// quizEngine.js — manages all quiz room state
// Rooms are stored in memory; restart clears all active sessions.

class QuizEngine {
  constructor() {
    // Map of roomCode -> room object
    this.rooms = new Map();
  }

  // ─── Room lifecycle ────────────────────────────────────────────────────────

  createRoom(hostSocketId, questions, entryFee = 0) {
    const roomCode = this._generateRoomCode();
    const room = {
      code: roomCode,
      hostSocketId,
      questions,                // array of questions selected for this room
      entryFee,                 // cost in sats to join
      poolAmount: 0,            // sum of all paid entry fees
      players: new Map(),       // playerId -> player object
      pendingPlayers: new Map(),// paymentHash -> player object (waiting for settlement)
      state: "lobby",           // lobby | question | results | finished
      currentQuestionIndex: -1, // index into room.questions
      questionTimer: null,      // server-side auto-end timeout handle (timer expires)
      endTimer: null,           // early-end timeout handle (first correct answer)
      questionStartTime: null,  // Date.now() when question started
      currentAnswers: new Map() // playerId -> { answerIndex, timestamp }
    };
    this.rooms.set(roomCode, room);
    return roomCode;
  }

  // ─── Player management ─────────────────────────────────────────────────────

  /**
   * Join or rejoin a room.
   * - If the game is in lobby state, adds a new player.
   * - If the game is running and the same nickname already exists, reconnects that player.
   * Returns { playerId, player, rejoined? } or { error }
   */
  joinRoom(roomCode, nickname, socketId, existingPlayerId = null) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: "Sala no encontrada. Verifica tu código." };

    // Normalize nickname for duplicate checking
    const nicknameLC = nickname.toLowerCase();

    // Check if this nickname already exists in the room (rejoin case)
    for (const [playerId, player] of room.players.entries()) {
      if (player.nickname.toLowerCase() === nicknameLC) {
        if (room.state !== "lobby" || existingPlayerId === playerId) {
          // Allow reconnect by updating socket. In lobby, require the saved player id.
          player.socketId = socketId;
          return { playerId, player, rejoined: true };
        } else {
          return { error: "Ese apodo ya está en uso. Elige otro." };
        }
      }
    }

    // Check if nickname is already in pending (Phase 3)
    for (const pending of room.pendingPlayers.values()) {
      if (pending.nickname.toLowerCase() === nicknameLC) {
        return { error: "Ese apodo ya está esperando pago. Intenta de nuevo en un momento." };
      }
    }

    // Reject new joins once the game has started
    if (room.state !== "lobby") {
      return { error: "El juego ya está en curso." };
    }

    // If entry fee is required, don't add to players yet (server.js will handle pending)
    if (room.entryFee > 0) {
      return { paymentRequired: true, entryFee: room.entryFee };
    }

    const playerId = this._generateId();
    const player = {
      id: playerId,
      nickname,
      socketId,
      score: 0,
      answers: [] // per-question answer history
    };
    room.players.set(playerId, player);
    return { playerId, player };
  }

  /**
   * Agrega un jugador a la lista de espera de pago (Phase 3).
   */
  addPendingPlayer(roomCode, nickname, socketId, paymentHash) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const playerId = this._generateId();
    const player = {
      id: playerId,
      nickname,
      socketId,
      paymentHash,
      score: 0,
      answers: []
    };
    room.pendingPlayers.set(paymentHash, player);
    return player;
  }

  /**
   * Confirma el pago y mueve al jugador de pendiente a activo (Phase 3).
   */
  confirmPayment(roomCode, paymentHash) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.pendingPlayers.get(paymentHash);
    if (!player) return null;

    room.pendingPlayers.delete(paymentHash);
    room.players.set(player.id, player);
    room.poolAmount += room.entryFee;
    
    return player;
  }

  // ─── Lookup helpers ────────────────────────────────────────────────────────

  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  getRoomByHostSocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.hostSocketId === socketId) return room;
    }
    return null;
  }

  /** Returns { room, player } or null */
  getRoomByPlayerSocket(socketId) {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) return { room, player };
      }
    }
    return null;
  }

  getPlayers(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.players.values());
  }

  // ─── Question flow ─────────────────────────────────────────────────────────

  startQuestion(roomCode, questionIndex) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.state = "question";
    room.currentQuestionIndex = questionIndex;
    room.questionStartTime = Date.now();
    room.currentAnswers = new Map(); // clear previous answers
    return true;
  }

  submitAnswer(roomCode, playerId, answerIndex) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== "question") return { error: "No hay pregunta activa." };
    if (room.currentAnswers.has(playerId)) return { error: "Ya respondiste esta pregunta." };

    room.currentAnswers.set(playerId, {
      answerIndex,
      timestamp: Date.now()
    });
    return { success: true };
  }

  /**
   * Score all answers for the current question.
   */
  scoreQuestion(roomCode, question, timeLimit) {
    const room = this.rooms.get(roomCode);
    if (!room) return {};

    const results = {};

    for (const [playerId, player] of room.players.entries()) {
      const answer = room.currentAnswers.get(playerId);
      let score = 0;
      let correct = false;

      if (answer !== undefined) {
        correct = answer.answerIndex === question.correct;
        if (correct) {
          const elapsed = (answer.timestamp - room.questionStartTime) / 1000;
          const speedRatio = Math.max(0, Math.min(1, (timeLimit - elapsed) / timeLimit));
          score = Math.floor(50 + 50 * speedRatio); // 50–100
        }
      }

      player.score += score;
      player.answers.push({
        questionIndex: room.currentQuestionIndex,
        answerIndex: answer ? answer.answerIndex : -1,
        correct,
        score
      });
      results[playerId] = { score, correct };
    }

    room.state = "results";
    return results;
  }

  // ─── Stats & leaderboard ───────────────────────────────────────────────────

  getLeaderboard(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.players.values())
      .map(p => ({ id: p.id, nickname: p.nickname, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  getAnswerStats(roomCode, numOptions) {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    const counts = Array(numOptions).fill(0);
    for (const ans of room.currentAnswers.values()) {
      if (ans.answerIndex >= 0 && ans.answerIndex < numOptions) {
        counts[ans.answerIndex]++;
      }
    }
    const total = room.players.size;
    return counts.map((count, i) => ({
      index: i,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  allPlayersAnswered(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room || room.players.size === 0) return false;
    return room.currentAnswers.size >= room.players.size;
  }

  // ─── End quiz ──────────────────────────────────────────────────────────────

  endQuiz(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (room.questionTimer) clearTimeout(room.questionTimer);
    room.state = "finished";
    return this.getLeaderboard(roomCode);
  }

  removeRoom(roomCode) {
    this.rooms.delete(roomCode);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  _generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code;
    do {
      code = Array.from({ length: 4 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("");
    } while (this.rooms.has(code));
    return code;
  }

  _generateId() {
    return Math.random().toString(36).slice(2, 11);
  }
}

module.exports = new QuizEngine();
