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
const ENTRY_FEE_SATS = parseInt(process.env.ENTRY_FEE_SATS) || 0; // Phase 3
const PAYOUT_FEE_RESERVE_SATS = parseInt(process.env.PAYOUT_FEE_RESERVE_SATS) || 10;
const RESULTS_DELAY = parseInt(process.env.RESULTS_DELAY) || 8; // seconds to display results before auto-advancing
const QUESTION_COUNT = parseInt(process.env.QUESTION_COUNT) || allQuestions.length;

// Shuffle the answer options for a question and update the correct index to match.
function shuffleOptions(question) {
  const count = question.options.es.length;
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    ...question,
    options: {
      es: indices.map(i => question.options.es[i]),
      en: indices.map(i => question.options.en[i])
    },
    correct: indices.indexOf(question.correct)
  };
}

// Pick a random subset of questions for each new room (no repeats).
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
    lightningMethod: lightning.activeMethod(),
    totalQuestions: QUESTION_COUNT,
    timeLimit: TIME_LIMIT,
    entryFee: ENTRY_FEE_SATS
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

  socket.on("create_room", () => {
    const roomQuestions = pickQuestions();
    const roomCode = quizEngine.createRoom(socket.id, roomQuestions, ENTRY_FEE_SATS);
    socket.join(roomCode);

    const joinUrl = `${BASE_URL}/?room=${roomCode}`;

    socket.emit("room_created", {
      roomCode,
      joinUrl,
      totalQuestions: roomQuestions.length,
      timeLimit: TIME_LIMIT
    });

    console.log(`[Room] Created ${roomCode}`);
  });

  socket.on("start_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (!room) return;
    if (room.players.size === 0) {
      socket.emit("quiz_error", { message: "Aún no se ha unido ningún jugador." });
      return;
    }
    io.to(room.code).emit("quiz_started", { totalQuestions: room.questions.length });
    setTimeout(() => launchQuestion(room.code), 3000);
  });

  socket.on("force_end_question", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (!room || room.state !== "question") return;
    clearTimeout(room.questionTimer);
    endQuestion(room.code);
  });

  socket.on("end_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (!room) return;
    finishQuiz(room.code);
  });

  socket.on("restart_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (room) {
      io.to(room.code).emit("quiz_restarted");
      quizEngine.removeRoom(room.code);
    }
    const roomQuestions = pickQuestions();
    const newCode = quizEngine.createRoom(socket.id, roomQuestions, ENTRY_FEE_SATS);
    socket.join(newCode);
    const joinUrl = `${BASE_URL}/?room=${newCode}`;
    socket.emit("room_created", {
      roomCode: newCode,
      joinUrl,
      totalQuestions: roomQuestions.length,
      timeLimit: TIME_LIMIT
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  PLAYER EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  socket.on("join_room", async ({ roomCode, nickname, playerId }) => {
    roomCode = String(roomCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    nickname = String(nickname || "").trim().slice(0, 20);
    playerId = String(playerId || "").trim();

    if (!nickname || !roomCode) {
      socket.emit("join_error", { message: "Datos de entrada inválidos." });
      return;
    }

    const result = quizEngine.joinRoom(roomCode, nickname, socket.id, playerId);

    // If entry fee is required, generate invoice and wait for payment
    if (result.paymentRequired) {
      const invoice = await lightning.createInvoice(result.entryFee, `Join Quiz: ${nickname}`);
      if (invoice.success) {
        quizEngine.addPendingPlayer(roomCode, nickname, socket.id, invoice.paymentHash);
        socket.emit("payment_required", {
          paymentRequest: invoice.paymentRequest,
          amount: result.entryFee
        });

        const checkInterval = setInterval(async () => {
          const paid = await lightning.isPaid(invoice.paymentHash);
          if (paid) {
            clearInterval(checkInterval);
            const player = quizEngine.confirmPayment(roomCode, invoice.paymentHash);
            if (player) {
              socket.join(roomCode);
              socket.emit("join_success", {
                playerId: player.id,
                nickname: player.nickname,
                roomCode,
                rejoined: false,
                score: player.score
              });
              const room = quizEngine.getRoom(roomCode);
              if (room) {
                io.to(room.hostSocketId).emit("player_joined", {
                  players: quizEngine.getPlayers(roomCode).map(p => ({
                    id: p.id,
                    nickname: p.nickname,
                    score: p.score
                  }))
                });
              }
            }
          }
        }, 3000);
        socket.on("disconnect", () => clearInterval(checkInterval));
        return;
      } else {
        socket.emit("join_error", { message: "Error al generar factura de entrada." });
        return;
      }
    }

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

    const room = quizEngine.getRoom(roomCode);
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

  socket.on("submit_answer", ({ answerIndex }) => {
    const found = quizEngine.getRoomByPlayerSocket(socket.id);
    if (!found) return;
    const { room, player } = found;
    const question = room.questions[room.currentQuestionIndex];
    if (typeof answerIndex !== "number" || answerIndex < 0 || answerIndex >= question.options.es.length) {
      socket.emit("answer_error", { message: "Respuesta inválida." });
      return;
    }
    const result = quizEngine.submitAnswer(room.code, player.id, answerIndex);
    if (result.error) {
      socket.emit("answer_error", { message: result.error });
      return;
    }
    socket.emit("answer_received");
    const stats = quizEngine.getAnswerStats(room.code, room.questions[room.currentQuestionIndex].options.es.length);
    io.to(room.hostSocketId).emit("answer_stats", {
      stats,
      answeredCount: room.currentAnswers.size,
      totalPlayers: room.players.size
    });
    if (answerIndex === question.correct || quizEngine.allPlayersAnswered(room.code)) {
      if (!room.endTimer) {
        clearTimeout(room.questionTimer);
        room.endTimer = setTimeout(() => {
          room.endTimer = null;
          endQuestion(room.code);
        }, 1200);
      }
    }
  });

  // Phase 4: Winner Payout Request
  socket.on("process_payout", async ({ invoice }) => {
    const found = quizEngine.getRoomByPlayerSocket(socket.id);
    if (!found) return;
    const { room, player } = found;
    const leaderboard = quizEngine.getLeaderboard(room.code);
    const winner = leaderboard[0];

    if (player.id !== winner.id) {
      socket.emit("payout_error", { message: "Solo el ganador puede solicitar el premio." });
      return;
    }

    console.log(`[Payout] Processing for ${player.nickname} in ${room.code}...`);
    const payoutResult = await lightning.payWinner(invoice);
    if (payoutResult.success) {
      const payout = getPayoutAmounts(room.poolAmount);
      io.to(room.code).emit("payout_confirmed", { 
        preimage: payoutResult.preimage,
        winnerNickname: player.nickname,
        payoutSummary: {
          poolSat: payout.poolAmount,
          payoutSat: payout.payoutAmount,
          reserveSat: payout.feeReserveSat,
          sentSat: payoutResult.sentSat,
          feeMsat: payoutResult.feeMsat,
          reserveLeftSat: Number.isFinite(Number(payoutResult.sentSat))
            ? Math.max(0, payout.poolAmount - Number(payoutResult.sentSat))
            : null
        }
      });
      console.log(`[Payout] SUCCESS for ${player.nickname}`);
    } else {
      socket.emit("payout_error", { message: payoutResult.error });
      console.log(`[Payout] FAILED: ${payoutResult.error}`);
    }
  });

  socket.on("disconnect", () => {
    const hostRoom = quizEngine.getRoomByHostSocket(socket.id);
    if (hostRoom) io.to(hostRoom.code).emit("host_disconnected");
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const payload = { index: nextIndex, total: room.questions.length, text: question.text, options: question.options, timeLimit: TIME_LIMIT };
  io.to(roomCode).emit("question_started", payload);
  const hostSocket = io.sockets.sockets.get(room.hostSocketId);
  if (hostSocket) hostSocket.emit("question_started", { ...payload, correct: question.correct, explanation: question.explanation, totalPlayers: room.players.size });
  room.questionTimer = setTimeout(() => endQuestion(roomCode), TIME_LIMIT * 1000 + 800);
}

function endQuestion(roomCode) {
  const room = quizEngine.getRoom(roomCode);
  if (!room || room.state !== "question") return;
  const question = room.questions[room.currentQuestionIndex];
  const results = quizEngine.scoreQuestion(roomCode, question, TIME_LIMIT);
  const leaderboard = quizEngine.getLeaderboard(roomCode);
  const stats = quizEngine.getAnswerStats(roomCode, question.options.es.length);
  const isLast = room.currentQuestionIndex >= room.questions.length - 1;
  const basePayload = { correct: question.correct, explanation: question.explanation, stats, leaderboard, questionIndex: room.currentQuestionIndex, isLastQuestion: isLast };
  
  const hostSocket = io.sockets.sockets.get(room.hostSocketId);
  if (hostSocket) hostSocket.emit("question_ended", basePayload);

  for (const [playerId, player] of room.players.entries()) {
    const playerSocket = io.sockets.sockets.get(player.socketId);
    if (!playerSocket) continue;
    const personal = results[playerId] || { score: 0, correct: false };
    const playerAnswer = room.currentAnswers.get(playerId);
    playerSocket.emit("question_ended", { ...basePayload, playerResult: { correct: personal.correct, pointsEarned: personal.score, totalScore: player.score, answerIndex: playerAnswer !== undefined ? playerAnswer.answerIndex : -1 } });
  }
  io.to(roomCode).emit("auto_advance", { seconds: RESULTS_DELAY });
  if (isLast) setTimeout(() => finishQuiz(roomCode), RESULTS_DELAY * 1000);
  else setTimeout(() => launchQuestion(roomCode), RESULTS_DELAY * 1000);
}

function getPayoutAmounts(poolAmount) {
  const feeReserveSat = Math.min(PAYOUT_FEE_RESERVE_SATS, Math.max(0, poolAmount - 1));
  return {
    poolAmount,
    feeReserveSat,
    payoutAmount: Math.max(1, poolAmount - feeReserveSat)
  };
}

async function finishQuiz(roomCode) {
  const room = quizEngine.getRoom(roomCode);
  if (!room || room.state === "finished") return;

  const leaderboard = quizEngine.endQuiz(roomCode);
  const winner = leaderboard[0];

  let rewardInfo = null;
  if (winner) {
    // Phase 4: Use poolAmount if paid quiz
    const satAmount = room.entryFee > 0 
      ? room.poolAmount 
      : Math.max(1, Math.floor(winner.score * SAT_PER_POINT));
    
    if (room.entryFee > 0) {
      const payout = getPayoutAmounts(room.poolAmount);
      // For paid quiz, we wait for winner to provide invoice
      rewardInfo = { 
        paidMode: true, 
        satAmount,
        poolAmount: payout.poolAmount,
        payoutAmount: payout.payoutAmount,
        feeReserveSat: payout.feeReserveSat,
        winnerNickname: winner.nickname 
      };
    } else {
      // Legacy behavior: create invoice for host to pay (or auto-pay if NWC/LND)
      const memo = `Bitcoin Quiz Winner: ${winner.nickname} (${winner.score} pts)`;
      rewardInfo = await lightning.createInvoice(satAmount, memo);
      rewardInfo.satAmount = satAmount;
      rewardInfo.winnerNickname = winner.nickname;
      rewardInfo.winnerScore = winner.score;
    }
  }

  const hostSocket = io.sockets.sockets.get(room.hostSocketId);
  if (hostSocket) hostSocket.emit("quiz_ended", { leaderboard, rewardInfo });
  io.to(roomCode).emit("quiz_ended", { leaderboard, winnerNickname: winner?.nickname, rewardInfo });

  console.log(`[Room] ${roomCode} finished. Pool: ${room.poolAmount} sats`);
}

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, async () => {
  await lightning.init();
  console.log(`\nBitcoin Quiz Live`);
  console.log(`  Host:      ${BASE_URL}/host.html`);
  console.log(`  Players:   ${BASE_URL}/`);
  console.log(`  Lightning: ${lightning.isConfigured() ? lightning.activeMethod().toUpperCase() : "not configured"}`);
  console.log(`  Entry Fee: ${ENTRY_FEE_SATS} sats`);
  console.log(`  Questions: ${QUESTION_COUNT} of ${allQuestions.length} (random)\n`);
});
