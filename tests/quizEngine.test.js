// Unit tests for server/quizEngine.js
// Run with: node --test tests/quizEngine.test.js

"use strict";

const { describe, test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const quizEngine = require("../server/quizEngine");

// Minimal questions for tests — keeps things fast and independent of real data
const QUESTIONS = [
  { text: "Q1", options: ["Wrong A", "Correct B", "Wrong C", "Wrong D"], correct: 1, explanation: "exp1" },
  { text: "Q2", options: ["Correct A", "Wrong B", "Wrong C"], correct: 0, explanation: "exp2" }
];

// ─── Room lifecycle ────────────────────────────────────────────────────────────

describe("createRoom", () => {
  let code;
  afterEach(() => { quizEngine.removeRoom(code); });

  test("returns a 4-character alphanumeric code", () => {
    code = quizEngine.createRoom("host-1", QUESTIONS);
    assert.match(code, /^[A-Z0-9]{4}$/);
  });

  test("new room starts in lobby state", () => {
    code = quizEngine.createRoom("host-2", QUESTIONS);
    assert.strictEqual(quizEngine.getRoom(code).state, "lobby");
  });

  test("generates unique codes for multiple rooms", () => {
    const code2 = quizEngine.createRoom("host-3", QUESTIONS);
    code = quizEngine.createRoom("host-4", QUESTIONS);
    assert.notStrictEqual(code, code2);
    quizEngine.removeRoom(code2);
  });
});

describe("getRoom / getRoomByHostSocket / removeRoom", () => {
  let code;
  beforeEach(() => { code = quizEngine.createRoom("host-lookup", QUESTIONS); });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("getRoom returns room for known code", () => {
    assert.ok(quizEngine.getRoom(code));
  });

  test("getRoom returns undefined for unknown code", () => {
    assert.strictEqual(quizEngine.getRoom("ZZZZ"), undefined);
  });

  test("getRoomByHostSocket finds room by host socket id", () => {
    const room = quizEngine.getRoomByHostSocket("host-lookup");
    assert.strictEqual(room.code, code);
  });

  test("getRoomByHostSocket returns null for unknown socket", () => {
    assert.strictEqual(quizEngine.getRoomByHostSocket("nobody"), null);
  });

  test("removeRoom deletes the room", () => {
    quizEngine.removeRoom(code);
    assert.strictEqual(quizEngine.getRoom(code), undefined);
    code = null; // already removed
  });
});

// ─── Player management ─────────────────────────────────────────────────────────

describe("joinRoom", () => {
  let code;
  beforeEach(() => { code = quizEngine.createRoom("host-join", QUESTIONS); });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("adds a new player and returns playerId", () => {
    const result = quizEngine.joinRoom(code, "Alice", "socket-a");
    assert.ok(result.playerId);
    assert.strictEqual(result.player.nickname, "Alice");
    assert.ok(!result.rejoined);
  });

  test("returns error for unknown room code", () => {
    const result = quizEngine.joinRoom("ZZZZ", "Bob", "socket-b");
    assert.ok(result.error);
  });

  test("rejects duplicate nickname in lobby (case-insensitive)", () => {
    quizEngine.joinRoom(code, "Alice", "socket-a1");
    const result = quizEngine.joinRoom(code, "alice", "socket-a2");
    assert.ok(result.error);
  });

  test("allows lobby reconnect with matching saved player id", () => {
    const { playerId } = quizEngine.joinRoom(code, "Alice", "socket-old");
    const result = quizEngine.joinRoom(code, "Alice", "socket-new", playerId);
    assert.strictEqual(result.rejoined, true);
    assert.strictEqual(result.player.socketId, "socket-new");
  });

  test("rejects new players once game is in progress", () => {
    quizEngine.startQuestion(code, 0);
    const result = quizEngine.joinRoom(code, "Latecomer", "socket-late");
    assert.ok(result.error);
  });

  test("allows rejoining mid-game with same nickname", () => {
    quizEngine.joinRoom(code, "Alice", "socket-old");
    quizEngine.startQuestion(code, 0);
    const result = quizEngine.joinRoom(code, "Alice", "socket-new");
    assert.strictEqual(result.rejoined, true);
    assert.strictEqual(result.player.socketId, "socket-new");
  });

  test("player score is preserved on rejoin", () => {
    const { playerId } = quizEngine.joinRoom(code, "Alice", "socket-old");
    const room = quizEngine.getRoom(code);
    room.players.get(playerId).score = 75;
    quizEngine.startQuestion(code, 0);
    const result = quizEngine.joinRoom(code, "Alice", "socket-new");
    assert.strictEqual(result.player.score, 75);
  });
});

describe("getPlayers / getRoomByPlayerSocket", () => {
  let code;
  beforeEach(() => { code = quizEngine.createRoom("host-players", QUESTIONS); });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("getPlayers returns all joined players", () => {
    quizEngine.joinRoom(code, "Alice", "sa");
    quizEngine.joinRoom(code, "Bob", "sb");
    assert.strictEqual(quizEngine.getPlayers(code).length, 2);
  });

  test("getPlayers returns empty array for empty room", () => {
    assert.deepStrictEqual(quizEngine.getPlayers(code), []);
  });

  test("getRoomByPlayerSocket finds room and player", () => {
    quizEngine.joinRoom(code, "Alice", "socket-alice");
    const found = quizEngine.getRoomByPlayerSocket("socket-alice");
    assert.ok(found);
    assert.strictEqual(found.room.code, code);
    assert.strictEqual(found.player.nickname, "Alice");
  });

  test("getRoomByPlayerSocket returns null for unknown socket", () => {
    assert.strictEqual(quizEngine.getRoomByPlayerSocket("ghost"), null);
  });
});

// ─── Question flow ─────────────────────────────────────────────────────────────

describe("startQuestion", () => {
  let code;
  beforeEach(() => { code = quizEngine.createRoom("host-q", QUESTIONS); });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("sets state to question and records start time", () => {
    quizEngine.startQuestion(code, 0);
    const room = quizEngine.getRoom(code);
    assert.strictEqual(room.state, "question");
    assert.strictEqual(room.currentQuestionIndex, 0);
    assert.ok(room.questionStartTime > 0);
  });

  test("clears answers from previous question", () => {
    const { playerId } = quizEngine.joinRoom(code, "Alice", "sa");
    quizEngine.startQuestion(code, 0);
    quizEngine.submitAnswer(code, playerId, 1);
    quizEngine.startQuestion(code, 1);
    assert.strictEqual(quizEngine.getRoom(code).currentAnswers.size, 0);
  });
});

describe("submitAnswer", () => {
  let code, aliceId;
  beforeEach(() => {
    code = quizEngine.createRoom("host-ans", QUESTIONS);
    ({ playerId: aliceId } = quizEngine.joinRoom(code, "Alice", "sa"));
    quizEngine.startQuestion(code, 0);
  });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("records a valid answer", () => {
    const result = quizEngine.submitAnswer(code, aliceId, 1);
    assert.ok(result.success);
  });

  test("rejects duplicate answer from the same player", () => {
    quizEngine.submitAnswer(code, aliceId, 1);
    const result = quizEngine.submitAnswer(code, aliceId, 0);
    assert.ok(result.error);
  });

  test("rejects answer when no question is active", () => {
    // Room in lobby state — no active question
    const code2 = quizEngine.createRoom("host-noq", QUESTIONS);
    const { playerId: pid } = quizEngine.joinRoom(code2, "Bob", "sb");
    const result = quizEngine.submitAnswer(code2, pid, 0);
    assert.ok(result.error);
    quizEngine.removeRoom(code2);
  });
});

describe("allPlayersAnswered", () => {
  let code, aliceId, bobId;
  beforeEach(() => {
    code = quizEngine.createRoom("host-all", QUESTIONS);
    ({ playerId: aliceId } = quizEngine.joinRoom(code, "Alice", "sa"));
    ({ playerId: bobId } = quizEngine.joinRoom(code, "Bob", "sb"));
    quizEngine.startQuestion(code, 0);
  });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("returns false before all players answer", () => {
    quizEngine.submitAnswer(code, aliceId, 1);
    assert.strictEqual(quizEngine.allPlayersAnswered(code), false);
  });

  test("returns true once all players have answered", () => {
    quizEngine.submitAnswer(code, aliceId, 1);
    quizEngine.submitAnswer(code, bobId, 0);
    assert.strictEqual(quizEngine.allPlayersAnswered(code), true);
  });
});

// ─── Scoring ──────────────────────────────────────────────────────────────────

describe("scoreQuestion", () => {
  let code, aliceId, bobId;
  const question = QUESTIONS[0]; // correct: 1

  beforeEach(() => {
    code = quizEngine.createRoom("host-score", QUESTIONS);
    ({ playerId: aliceId } = quizEngine.joinRoom(code, "Alice", "sa"));
    ({ playerId: bobId }   = quizEngine.joinRoom(code, "Bob",   "sb"));
    quizEngine.startQuestion(code, 0);
  });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("correct answer earns between 50 and 100 points", () => {
    quizEngine.submitAnswer(code, aliceId, 1); // correct
    const results = quizEngine.scoreQuestion(code, question, 21);
    assert.ok(results[aliceId].correct);
    assert.ok(results[aliceId].score >= 50 && results[aliceId].score <= 100,
      `Score ${results[aliceId].score} not in [50,100]`);
  });

  test("wrong answer earns 0 points", () => {
    quizEngine.submitAnswer(code, aliceId, 0); // wrong (correct is 1)
    const results = quizEngine.scoreQuestion(code, question, 21);
    assert.strictEqual(results[aliceId].correct, false);
    assert.strictEqual(results[aliceId].score, 0);
  });

  test("no answer earns 0 points", () => {
    // Alice answers, Bob does not
    quizEngine.submitAnswer(code, aliceId, 1);
    const results = quizEngine.scoreQuestion(code, question, 21);
    assert.strictEqual(results[bobId].score, 0);
    assert.strictEqual(results[bobId].correct, false);
  });

  test("faster correct answer earns more than slower correct answer", () => {
    quizEngine.submitAnswer(code, aliceId, 1); // fast
    const room = quizEngine.getRoom(code);
    // Fake Bob's timestamp to be near timeout
    room.currentAnswers.set(bobId, { answerIndex: 1, timestamp: room.questionStartTime + 19000 });
    const results = quizEngine.scoreQuestion(code, question, 21);
    assert.ok(results[aliceId].score > results[bobId].score,
      `Expected Alice (fast) ${results[aliceId].score} > Bob (slow) ${results[bobId].score}`);
  });

  test("scoreQuestion sets room state to results", () => {
    quizEngine.scoreQuestion(code, question, 21);
    assert.strictEqual(quizEngine.getRoom(code).state, "results");
  });

  test("cumulative scores update on the player object", () => {
    quizEngine.submitAnswer(code, aliceId, 1);
    quizEngine.scoreQuestion(code, question, 21);
    const players = quizEngine.getPlayers(code);
    const alice = players.find(p => p.id === aliceId);
    assert.ok(alice.score > 0);
  });
});

// ─── Leaderboard & stats ───────────────────────────────────────────────────────

describe("getLeaderboard", () => {
  let code;
  beforeEach(() => { code = quizEngine.createRoom("host-lb", QUESTIONS); });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("is sorted by score descending", () => {
    const { playerId: aliceId } = quizEngine.joinRoom(code, "Alice", "sa");
    const { playerId: bobId }   = quizEngine.joinRoom(code, "Bob",   "sb");
    const room = quizEngine.getRoom(code);
    room.players.get(aliceId).score = 80;
    room.players.get(bobId).score   = 150;
    const lb = quizEngine.getLeaderboard(code);
    assert.strictEqual(lb[0].nickname, "Bob");
    assert.strictEqual(lb[1].nickname, "Alice");
  });

  test("each entry has id, nickname and score fields", () => {
    quizEngine.joinRoom(code, "Alice", "sa");
    const [entry] = quizEngine.getLeaderboard(code);
    assert.ok("id" in entry && "nickname" in entry && "score" in entry);
  });
});

describe("getAnswerStats", () => {
  let code, aliceId, bobId;
  beforeEach(() => {
    code = quizEngine.createRoom("host-stats", QUESTIONS);
    ({ playerId: aliceId } = quizEngine.joinRoom(code, "Alice", "sa"));
    ({ playerId: bobId }   = quizEngine.joinRoom(code, "Bob",   "sb"));
    quizEngine.startQuestion(code, 0);
  });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("counts how many players chose each option", () => {
    quizEngine.submitAnswer(code, aliceId, 1);
    quizEngine.submitAnswer(code, bobId,   1);
    const stats = quizEngine.getAnswerStats(code, 4);
    assert.strictEqual(stats[1].count, 2);
    assert.strictEqual(stats[0].count, 0);
  });

  test("calculates percentage based on total players", () => {
    quizEngine.submitAnswer(code, aliceId, 0);
    quizEngine.submitAnswer(code, bobId,   1);
    const stats = quizEngine.getAnswerStats(code, 4);
    assert.strictEqual(stats[0].percentage, 50);
    assert.strictEqual(stats[1].percentage, 50);
  });
});

describe("endQuiz", () => {
  let code;
  beforeEach(() => { code = quizEngine.createRoom("host-end", QUESTIONS); });
  afterEach(() => { quizEngine.removeRoom(code); });

  test("sets room state to finished", () => {
    quizEngine.endQuiz(code);
    assert.strictEqual(quizEngine.getRoom(code).state, "finished");
  });

  test("returns the leaderboard", () => {
    quizEngine.joinRoom(code, "Alice", "sa");
    const lb = quizEngine.endQuiz(code);
    assert.ok(Array.isArray(lb));
    assert.strictEqual(lb[0].nickname, "Alice");
  });
});
