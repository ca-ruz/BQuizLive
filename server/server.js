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
const TIME_LIMIT = parseInt(process.env.QUESTION_TIME_LIMIT) || 21;
const SAT_PER_POINT = parseInt(process.env.SAT_PER_POINT) || 1;
const RESULTS_DELAY = parseInt(process.env.RESULTS_DELAY) || 8;
const QUESTION_COUNT = parseInt(process.env.QUESTION_COUNT) || allQuestions.length;

// Shuffle answer options
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

function pickQuestions() {
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(QUESTION_COUNT, allQuestions.length)).map(shuffleOptions);
}

app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/info", (_req, res) => {
  res.json({
    lightningConfigured: lightning.isConfigured(),
    lightningMethod: lightning.activeMethod(),
    totalQuestions: QUESTION_COUNT,
    timeLimit: TIME_LIMIT,
    entryFee: parseInt(process.env.ENTRY_FEE_SATS) || 0
  });
});

app.get("/api/qr", async (req, res) => {
  const url = String(req.query.url || "").slice(0, 500);
  if (!url) return res.status(400).send("Missing url param");
  try {
    const png = await QRCode.toBuffer(url, { width: 300, margin: 2 });
    res.set("Content-Type", "image/png");
    res.send(png);
  } catch (e) {
    res.status(500).send("QR error");
  }
});

io.on("connection", (socket) => {
  console.log(`[+] Connected  ${socket.id}`);

  // Helper to check for payment settlement and admit player
  function startSettlementCheck(targetSocket, roomCode, paymentHash) {
    const checkInterval = setInterval(async () => {
      const paid = await lightning.isPaid(paymentHash);
      if (paid) {
        clearInterval(checkInterval);
        const player = quizEngine.confirmPayment(roomCode, paymentHash);
        if (player) {
          targetSocket.join(roomCode);
          targetSocket.emit("join_success", {
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
                id: p.id, nickname: p.nickname, score: p.score
              }))
            });
          }
        }
      }
    }, 3000);
    targetSocket.on("disconnect", () => clearInterval(checkInterval));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HOST EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  socket.on("create_room", () => {
    const roomQuestions = pickQuestions();
    const entryFee = parseInt(process.env.ENTRY_FEE_SATS) || 0;
    const roomCode = quizEngine.createRoom(socket.id, roomQuestions, entryFee);
    socket.join(roomCode);
    socket.emit("room_created", {
      roomCode,
      joinUrl: `${BASE_URL}/?room=${roomCode}`,
      totalQuestions: roomQuestions.length,
      timeLimit: TIME_LIMIT
    });
    console.log(`[Room] Created ${roomCode}`);
  });

  socket.on("start_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (!room || room.players.size === 0) return;
    io.to(room.code).emit("quiz_started", { totalQuestions: room.questions.length });
    setTimeout(() => launchQuestion(room.code), 3000);
  });

  socket.on("force_end_question", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (room?.state === "question") {
      clearTimeout(room.questionTimer);
      endQuestion(room.code);
    }
  });

  socket.on("end_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (room) finishQuiz(room.code);
  });

  socket.on("restart_quiz", () => {
    const room = quizEngine.getRoomByHostSocket(socket.id);
    if (room) {
      io.to(room.code).emit("quiz_restarted");
      quizEngine.removeRoom(room.code);
    }
    const roomQuestions = pickQuestions();
    const entryFee = parseInt(process.env.ENTRY_FEE_SATS) || 0;
    const newCode = quizEngine.createRoom(socket.id, roomQuestions, entryFee);
    socket.join(newCode);
    socket.emit("room_created", {
      roomCode: newCode,
      joinUrl: `${BASE_URL}/?room=${newCode}`,
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

    if (!nickname || !roomCode) return socket.emit("join_error", { message: "Datos inválidos." });

    const result = quizEngine.joinRoom(roomCode, nickname, socket.id, playerId);

    if (result.alreadyPending) {
      const p = result.player;
      socket.emit("payment_required", {
        paymentRequest: p.paymentRequest,
        amount: quizEngine.getRoom(roomCode).entryFee,
        playerId: p.id
      });
      startSettlementCheck(socket, roomCode, p.paymentHash);
      return;
    }

    if (result.paymentRequired) {
      const invoice = await lightning.createInvoice(result.entryFee, `Join Quiz: ${nickname}`);
      if (invoice.success && invoice.paymentRequest) {
        console.log(`[Payment] Invoice for ${nickname}: ${invoice.paymentHash}`);
        const p = quizEngine.addPendingPlayer(roomCode, nickname, socket.id, invoice.paymentHash, invoice.paymentRequest);
        socket.emit("payment_required", {
          paymentRequest: invoice.paymentRequest,
          amount: result.entryFee,
          playerId: p.id
        });
        startSettlementCheck(socket, roomCode, invoice.paymentHash);
        return;
      }
      return socket.emit("join_error", { message: "Error al generar factura de entrada (Lightning no disponible)." });
    }

    if (result.error) return socket.emit("join_error", { message: result.error });

    socket.join(roomCode);
    socket.emit("join_success", { playerId: result.playerId, nickname: result.player.nickname, roomCode });

    const room = quizEngine.getRoom(roomCode);
    if (room) {
      // Notify host
      io.to(room.hostSocketId).emit("player_joined", {
        players: quizEngine.getPlayers(roomCode).map(p => ({ id: p.id, nickname: p.nickname, score: p.score }))
      });

      // Re-sync if game is in progress
      if (room.state === "question") {
        const question = room.questions[room.currentQuestionIndex];
        const elapsed = (Date.now() - room.questionStartTime) / 1000;
        const remaining = Math.max(0, TIME_LIMIT - elapsed);
        socket.emit("question_started", {
          index: room.currentQuestionIndex,
          total: room.questions.length,
          text: question.text,
          options: question.options,
          timeLimit: remaining,
          alreadyAnswered: room.currentAnswers.has(result.playerId)
        });
      }
    }
  });

  socket.on("submit_answer", ({ answerIndex }) => {
    const found = quizEngine.getRoomByPlayerSocket(socket.id);
    if (!found) return;
    const { room, player } = found;
    const question = room.questions[room.currentQuestionIndex];
    if (typeof answerIndex !== "number" || answerIndex < 0) return;

    const result = quizEngine.submitAnswer(room.code, player.id, answerIndex);
    if (result.error) return;

    socket.emit("answer_received");
    io.to(room.hostSocketId).emit("answer_stats", {
      stats: quizEngine.getAnswerStats(room.code, question.options.es.length),
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

  socket.on("process_payout", async ({ invoice }) => {
    const found = quizEngine.getRoomByPlayerSocket(socket.id);
    if (!found) return;
    const { room, player } = found;
    const leaderboard = quizEngine.getLeaderboard(room.code);
    const winner = leaderboard[0];

    if (player.id !== winner?.id) return socket.emit("payout_error", { message: "Solo el ganador." });

    console.log(`[Payout] Processing for ${player.nickname}...`);
    const payoutResult = await lightning.payWinner(invoice);
    if (payoutResult.success) {
      const pool = room.poolAmount;
      const prize = payoutResult.prizeSat || 0;
      const fee = payoutResult.feeSat || 0;
      const sent = prize + fee;
      const payoutSummary = {
        poolSat: pool, payoutSat: prize, feeSat: fee, sentSat: sent,
        reserveLeftSat: Math.max(0, pool - sent),
        nodeBalanceSat: payoutResult.finalBalanceSat
      };
      io.to(room.code).emit("payout_confirmed", { 
        preimage: payoutResult.preimage,
        winnerNickname: player.nickname,
        payoutSummary
      });
      console.log(`[Payout] SUCCESS`, payoutSummary);
    } else {
      socket.emit("payout_error", { message: payoutResult.error });
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
  if (nextIndex >= room.questions.length) return finishQuiz(roomCode);

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
  if (room?.state !== "question") return;
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

async function finishQuiz(roomCode) {
  const room = quizEngine.getRoom(roomCode);
  if (!room || room.state === "finished") return;

  const leaderboard = quizEngine.endQuiz(roomCode);
  const winner = leaderboard[0];

  let rewardInfo = null;
  if (winner) {
    const satAmount = room.entryFee > 0 ? room.poolAmount : Math.max(1, Math.floor(winner.score * SAT_PER_POINT));
    if (room.entryFee > 0) {
      const reserve = parseInt(process.env.PAYOUT_FEE_RESERVE_SATS) || 10;
      const feeReserveSat = Math.min(reserve, Math.max(0, room.poolAmount - 1));
      rewardInfo = { 
        paidMode: true, satAmount, poolAmount: room.poolAmount, 
        payoutAmount: Math.max(1, room.poolAmount - feeReserveSat),
        feeReserveSat, winnerNickname: winner.nickname 
      };
    } else {
      // Manual Mode (Free to play)
      rewardInfo = { manual: true, satAmount, winnerNickname: winner.nickname, winnerScore: winner.score };
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
  console.log(`\nBitcoin Quiz Live\n  Host: ${BASE_URL}/host.html\n  Players: ${BASE_URL}/\n  Lightning: ${lightning.isConfigured() ? lightning.activeMethod().toUpperCase() : "not configured"}\n  Questions: ${QUESTION_COUNT}\n`);
});
