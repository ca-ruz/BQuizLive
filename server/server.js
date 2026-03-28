// server.js — Express + Socket.io entry point
// Handles all real-time quiz events between host and players.

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const http = require("http");
const os = require("os");
const { Server } = require("socket.io");
const path = require("path");
const QRCode = require("qrcode");

// Auto-detect the machine's local network IP so QR codes work on other devices.
// Reads .env BASE_URL first; falls back to the first non-internal IPv4 address.
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

const quizEngine = require("./quizEngine");
const lightning = require("./lightning");

// Load questions from one or more categories defined in CATEGORIES env var.
// Example: CATEGORIES=bitcoin  or  CATEGORIES=lightning,channels,lsp
// Falls back to the "bitcoin" (general/beginner) category if not set.
function loadQuestions() {
  const names = (process.env.CATEGORIES || "bitcoin")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const all = [];
  for (const name of names) {
    try {
      const qs = require(`../data/categories/${name}`);
      all.push(...qs);
      console.log(`[Questions] Loaded category "${name}" (${qs.length} questions)`);
    } catch {
      console.warn(`[Questions] Category "${name}" not found — skipping.`);
    }
  }
  if (all.length === 0) {
    console.warn("[Questions] No categories loaded — falling back to bitcoin.");
    return require("../data/categories/bitcoin");
  }
  return all;
}

const allQuestions = loadQuestions();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = parseInt(process.env.PORT) || 3000;
const BASE_URL = process.env.BASE_URL || `http://${getLocalIP()}:${PORT}`;
const TIME_LIMIT = parseInt(process.env.QUESTION_TIME_LIMIT) || 21; // seconds (default 21)
const SAT_PER_POINT = parseInt(process.env.SAT_PER_POINT) || 1;
const RESULTS_DELAY = parseInt(process.env.RESULTS_DELAY) || 8; // seconds to display results before auto-advancing
const QUESTION_COUNT = parseInt(process.env.QUESTION_COUNT) || allQuestions.length;

// Shuffle the answer options for a question and update the correct index to match.
// This prevents players from noticing that the correct answer is always the longest
// or always in the same position.
function shuffleOptions(question) {
  const indices = question.options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    ...question,
    options: indices.map(i => question.options[i]),
    correct: indices.indexOf(question.correct)
  };
}

// Pick a random subset of questions for each new room (no repeats).
// Options within each question are also shuffled so the correct answer
// appears in a random position every game.
function pickQuestions() {
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(QUESTION_COUNT, allQuestions.length)).map(shuffleOptions);
}

// ─── Static files ────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, "../public")));

// ─── HTTP API ─────────────────────────────────────────────────────────────────

// Info endpoint — lets the client know if Lightning is available
app.get("/api/info", (_req, res) => {
  res.json({
    lightningConfigured: lightning.isConfigured(),
    lightningMethod: lightning.activeMethod(), // "nwc" | "lnd" | "manual"
    totalQuestions: QUESTION_COUNT,
    timeLimit: TIME_LIMIT
  });
});

// QR code endpoint — generates a PNG QR code for any URL
app.get("/api/qr", async (req, res) => {
  const url = String(req.query.url || "").slice(0, 500);
  if (!url) return res.status(400).send("Missing url param");
  try {
    const png = await QRCode.toBuffer(url, {
      type: "png",
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" }
    });
    res.set("Content-Type", "image/png");
    res.send(png);
  } catch (e) {
    res.status(500).send("QR error");
  }
});

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`[+] Connected  ${socket.id}`);

  // ═══════════════════════════════════════════════════════════════════════════
  //  HOST EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Host creates a new room and gets back the room code + join URL
  socket.on("create_room", () => {
    const roomQuestions = pickQuestions();
    const roomCode = quizEngine.createRoom(socket.id, roomQuestions);
    socket.join(roomCode); // host joins the socket room for broadcasts

    const joinUrl = `${BASE_URL}/?room=${roomCode}`;

    socket.emit("room_created", {
      roomCode,
      joinUrl,
      totalQuestions: roomQuestions.length,
      timeLimit: TIME_LIMIT
    });

    console.log(`[Room] Created ${roomCode}`);
  });

  // Host signals quiz start — auto-launches first question after a short countdown
  socket.on("start_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (!room) return;

    if (room.players.size === 0) {
      socket.emit("quiz_error", { message: "Aún no se ha unido ningún jugador." });
      return;
    }

    io.to(room.code).emit("quiz_started", { totalQuestions: room.questions.length });
    console.log(`[Room] ${room.code} quiz started with ${room.players.size} players`);

    // Auto-launch first question after a 3-second countdown
    setTimeout(() => launchQuestion(room.code), 3000);
  });

  // Host can force-end the current question early if needed
  socket.on("force_end_question", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (!room || room.state !== "question") return;
    clearTimeout(room.questionTimer);
    endQuestion(room.code);
  });

  // Host ends the quiz manually
  socket.on("end_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (!room) return;
    finishQuiz(room.code);
  });

  // Host restarts with a fresh room (same socket, new room code)
  socket.on("restart_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (room) {
      io.to(room.code).emit("quiz_restarted");
      quizEngine.removeRoom(room.code);
    }
    // Create a new room for the same host
    const roomQuestions = pickQuestions();
    const newCode = quizEngine.createRoom(socket.id, roomQuestions);
    socket.join(newCode);
    const joinUrl = `${BASE_URL}/?room=${newCode}`;
    socket.emit("room_created", {
      roomCode: newCode,
      joinUrl,
      totalQuestions: roomQuestions.length,
      timeLimit: TIME_LIMIT
    });
    console.log(`[Room] Restarted → ${newCode}`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  PLAYER EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Player joins (or rejoins) a room
  socket.on("join_room", ({ roomCode, nickname }) => {
    // Sanitize inputs
    roomCode = String(roomCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    nickname = String(nickname || "").trim().slice(0, 20);

    if (!nickname) {
      socket.emit("join_error", { message: "El apodo no puede estar vacío." });
      return;
    }
    if (!roomCode) {
      socket.emit("join_error", { message: "El código de sala no puede estar vacío." });
      return;
    }

    const result = quizEngine.joinRoom(roomCode, nickname, socket.id);

    if (result.error) {
      socket.emit("join_error", { message: result.error });
      return;
    }

    socket.join(roomCode);

    socket.emit("join_success", {
      playerId: result.playerId,
      nickname: result.player.nickname,
      roomCode,
      rejoined: result.rejoined || false,
      score: result.player.score
    });

    // Tell the host someone joined so the player list updates
    const room = quizEngine.getRoom(roomCode);

    // If the player is rejoining mid-game, push the current game state so they
    // don't get stuck on the waiting screen.
    if (result.rejoined && room) {
      if (room.state === "question") {
        const q = room.questions[room.currentQuestionIndex];
        const elapsed = (Date.now() - room.questionStartTime) / 1000;
        const remaining = Math.max(1, Math.ceil(TIME_LIMIT - elapsed));
        socket.emit("question_started", {
          index: room.currentQuestionIndex,
          total: room.questions.length,
          text: q.text,
          options: q.options,
          timeLimit: remaining,
          alreadyAnswered: room.currentAnswers.has(result.playerId)
        });
      } else if (room.state === "finished") {
        const leaderboard = quizEngine.getLeaderboard(roomCode);
        const winner = leaderboard[0];
        socket.emit("quiz_ended", { leaderboard, winnerNickname: winner?.nickname });
      }
      // "lobby" or "results" → screen-waiting is the right place to be
    }
    if (room) {
      io.to(room.hostSocketId).emit("player_joined", {
        players: quizEngine.getPlayers(roomCode).map(p => ({
          id: p.id,
          nickname: p.nickname,
          score: p.score
        }))
      });
    }

    console.log(`[Room] ${roomCode} ← ${nickname} ${result.rejoined ? "(rejoin)" : "joined"}`);
  });

  // Player submits an answer
  socket.on("submit_answer", ({ answerIndex }) => {
    const found = quizEngine.getRoomByPlayerSocket(socket.id);
    if (!found) return;

    const { room, player } = found;

    // Validate answer index is within bounds
    const question = room.questions[room.currentQuestionIndex];
    if (
      typeof answerIndex !== "number" ||
      answerIndex < 0 ||
      answerIndex >= question.options.length
    ) {
      socket.emit("answer_error", { message: "Respuesta inválida." });
      return;
    }

    const result = quizEngine.submitAnswer(room.code, player.id, answerIndex);
    if (result.error) {
      socket.emit("answer_error", { message: result.error });
      return;
    }

    // Acknowledge receipt immediately (player sees "waiting" state)
    socket.emit("answer_received");

    // Push live stats to the host display
    const stats = quizEngine.getAnswerStats(room.code, room.questions[room.currentQuestionIndex].options.length);
    io.to(room.hostSocketId).emit("answer_stats", {
      stats,
      answeredCount: room.currentAnswers.size,
      totalPlayers: room.players.size
    });

    // End question early if: first correct answer OR every player has now answered.
    // Store the timer reference so rapid simultaneous answers don't stack multiple timers.
    if (answerIndex === question.correct || quizEngine.allPlayersAnswered(room.code)) {
      if (!room.endTimer) {
        clearTimeout(room.questionTimer);
        room.endTimer = setTimeout(() => {
          room.endTimer = null;
          endQuestion(room.code);
        }, 1200); // brief pause for drama
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  DISCONNECT
  // ═══════════════════════════════════════════════════════════════════════════

  socket.on("disconnect", () => {
    console.log(`[-] Disconnected ${socket.id}`);

    // If the host disconnects, warn players (room stays alive for reconnect)
    const hostRoom = quizEngine.getRoomByHostSocket(socket.id);
    if (hostRoom) {
      io.to(hostRoom.code).emit("host_disconnected");
    }
  });
});

// ─── Helper: launch the next question automatically ───────────────────────────

function launchQuestion(roomCode) {
  const room = quizEngine.getRoom(roomCode);
  if (!room || room.state === "finished") return;

  const nextIndex = room.currentQuestionIndex + 1;
  if (nextIndex >= room.questions.length) {
    finishQuiz(roomCode);
    return;
  }

  const question = room.questions[nextIndex];
  quizEngine.startQuestion(roomCode, nextIndex);

  const playerPayload = {
    index: nextIndex,
    total: room.questions.length,
    text: question.text,
    options: question.options,
    timeLimit: TIME_LIMIT
  };

  // Players get the question without the correct answer
  io.to(roomCode).emit("question_started", playerPayload);

  // Host gets the correct answer too
  const hostSocket = io.sockets.sockets.get(room.hostSocketId);
  if (hostSocket) {
    hostSocket.emit("question_started", {
      ...playerPayload,
      correct: question.correct,
      explanation: question.explanation,
      totalPlayers: room.players.size
    });
  }

  console.log(`[Room] ${roomCode} Q${nextIndex + 1} started (auto)`);

  room.questionTimer = setTimeout(() => {
    endQuestion(roomCode);
  }, TIME_LIMIT * 1000 + 800);
}

// ─── Helper: end the current question and broadcast results ──────────────────

function endQuestion(roomCode) {
  const room = quizEngine.getRoom(roomCode);
  if (!room || room.state !== "question") return;

  const question = room.questions[room.currentQuestionIndex];
  const results = quizEngine.scoreQuestion(roomCode, question, TIME_LIMIT);
  const leaderboard = quizEngine.getLeaderboard(roomCode);
  const stats = quizEngine.getAnswerStats(roomCode, question.options.length);
  const isLast = room.currentQuestionIndex >= room.questions.length - 1;

  const basePayload = {
    correct: question.correct,
    explanation: question.explanation,
    stats,
    leaderboard,
    questionIndex: room.currentQuestionIndex,
    isLastQuestion: isLast
  };

  // Send host the full result payload
  const hostSocket = io.sockets.sockets.get(room.hostSocketId);
  if (hostSocket) {
    hostSocket.emit("question_ended", basePayload);
  }

  // Send each player their personal result alongside the shared payload
  for (const [playerId, player] of room.players.entries()) {
    const playerSocket = io.sockets.sockets.get(player.socketId);
    if (!playerSocket) continue;

    const personal = results[playerId] || { score: 0, correct: false };
    const playerAnswer = room.currentAnswers.get(playerId);
    playerSocket.emit("question_ended", {
      ...basePayload,
      playerResult: {
        correct: personal.correct,
        pointsEarned: personal.score,
        totalScore: player.score,
        // -1 means the player didn't submit an answer in time
        answerIndex: playerAnswer !== undefined ? playerAnswer.answerIndex : -1
      }
    });
  }

  console.log(`[Room] ${roomCode} Q${room.currentQuestionIndex + 1} ended`);

  // Tell everyone how long results will be shown before auto-advancing
  io.to(roomCode).emit("auto_advance", { seconds: RESULTS_DELAY });

  if (isLast) {
    setTimeout(() => finishQuiz(roomCode), RESULTS_DELAY * 1000);
  } else {
    setTimeout(() => launchQuestion(roomCode), RESULTS_DELAY * 1000);
  }
}

// ─── Helper: finalise the quiz and emit winner + Lightning invoice ────────────

async function finishQuiz(roomCode) {
  const room = quizEngine.getRoom(roomCode);
  if (!room || room.state === "finished") return;

  const leaderboard = quizEngine.endQuiz(roomCode);
  const winner = leaderboard[0];

  let rewardInfo = null;
  if (winner) {
    const satAmount = Math.max(1, Math.floor(winner.score * SAT_PER_POINT));
    const memo = `Bitcoin Quiz Winner: ${winner.nickname} (${winner.score} pts)`;
    rewardInfo = await lightning.createInvoice(satAmount, memo);
    rewardInfo.satAmount = satAmount;
    rewardInfo.winnerNickname = winner.nickname;
    rewardInfo.winnerScore = winner.score;
  }

  // Host gets the full reward info (invoice or manual amount)
  const hostSocket = io.sockets.sockets.get(room.hostSocketId);
  if (hostSocket) {
    hostSocket.emit("quiz_ended", { leaderboard, rewardInfo });
  }

  // Players just see the final leaderboard
  io.to(roomCode).emit("quiz_ended", {
    leaderboard,
    winnerNickname: winner?.nickname
  });

  console.log(
    `[Room] ${roomCode} finished. Winner: ${winner?.nickname} (${winner?.score} pts, ${rewardInfo?.satAmount} sats)`
  );
}

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`\nBitcoin Quiz Live`);
  console.log(`  Host:      ${BASE_URL}/host.html`);
  console.log(`  Players:   ${BASE_URL}/`);
  console.log(`  Lightning: ${lightning.isConfigured() ? lightning.activeMethod().toUpperCase() + " configured" : "not configured (manual payout mode)"}`);
  console.log(`  Questions: ${QUESTION_COUNT} of ${allQuestions.length} (random)`);
  console.log(`  Time limit: ${TIME_LIMIT}s per question\n`);
});
