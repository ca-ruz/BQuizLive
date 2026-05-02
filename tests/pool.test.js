// Unit tests for Pay-to-Play Pool logic in quizEngine.js
// Run with: node --test tests/pool.test.js

"use strict";

const { describe, test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const quizEngine = require("../server/quizEngine");

const QUESTIONS = [{ text: "Q1", options: ["A", "B"], correct: 0, explanation: "exp" }];

describe("Pay-to-Play Pool Logic", () => {
  let code;
  const ENTRY_FEE = 1000;

  beforeEach(() => {
    code = quizEngine.createRoom("host-pool", QUESTIONS, ENTRY_FEE);
  });

  afterEach(() => {
    quizEngine.removeRoom(code);
  });

  test("createRoom stores entryFee and initializes poolAmount to 0", () => {
    const room = quizEngine.getRoom(code);
    assert.strictEqual(room.entryFee, ENTRY_FEE);
    assert.strictEqual(room.poolAmount, 0);
    assert.strictEqual(room.pendingPlayers.size, 0);
  });

  test("joinRoom returns paymentRequired when entryFee > 0", () => {
    const result = quizEngine.joinRoom(code, "Alice", "socket-a");
    assert.strictEqual(result.paymentRequired, true);
    assert.strictEqual(result.entryFee, ENTRY_FEE);
    assert.ok(!quizEngine.getRoom(code).players.has("Alice"));
  });

  test("addPendingPlayer adds player to pending list", () => {
    const hash = "hash123";
    const player = quizEngine.addPendingPlayer(code, "Alice", "socket-a", hash);
    
    assert.ok(player);
    assert.strictEqual(player.nickname, "Alice");
    assert.strictEqual(player.paymentHash, hash);
    
    const room = quizEngine.getRoom(code);
    assert.ok(room.pendingPlayers.has(hash));
  });

  test("confirmPayment moves player from pending to active and increments pool", () => {
    const hash = "hash123";
    quizEngine.addPendingPlayer(code, "Alice", "socket-a", hash);
    
    const player = quizEngine.confirmPayment(code, hash);
    assert.ok(player);
    
    const room = quizEngine.getRoom(code);
    assert.ok(!room.pendingPlayers.has(hash));
    assert.ok(room.players.has(player.id));
    assert.strictEqual(room.poolAmount, ENTRY_FEE);
  });

  test("confirmPayment increments poolAmount for multiple players", () => {
    const h1 = "hash1";
    const h2 = "hash2";
    quizEngine.addPendingPlayer(code, "Alice", "s1", h1);
    quizEngine.addPendingPlayer(code, "Bob",   "s2", h2);
    
    quizEngine.confirmPayment(code, h1);
    quizEngine.confirmPayment(code, h2);
    
    const room = quizEngine.getRoom(code);
    assert.strictEqual(room.poolAmount, ENTRY_FEE * 2);
    assert.strictEqual(room.players.size, 2);
  });

  test("rejects join if nickname is already in pending list", () => {
    const hash = "hash123";
    quizEngine.addPendingPlayer(code, "Alice", "socket-a", hash);
    
    const result = quizEngine.joinRoom(code, "Alice", "socket-new");
    assert.ok(result.error);
    assert.match(result.error, /esperando pago/);
  });
});
