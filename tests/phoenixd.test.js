// Unit tests for Phoenixd integration in server/lightning.js
// Mocking global fetch to test API calls without a real node.
// Run with: node --test tests/phoenixd.test.js

"use strict";

const { describe, test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

// Set env vars before requiring lightning.js
process.env.LN_ENGINE = "phoenixd";
process.env.PHOENIXD_URL = "http://localhost:9740";
process.env.PHOENIXD_API_KEY = "test-key";

const lightning = require("../server/lightning");

describe("Phoenixd Manager", () => {
  
  beforeEach(() => {
    // Reset global fetch mock
    mock.method(global, 'fetch', () => {});
  });

  afterEach(() => {
    mock.reset();
  });

  test("createInvoice calls /createinvoice with correct params", async () => {
    mock.method(global, 'fetch', async (url, options) => {
      assert.strictEqual(url, "http://localhost:9740/createinvoice");
      assert.strictEqual(options.method, "POST");
      assert.ok(options.body instanceof URLSearchParams);
      assert.strictEqual(options.body.get("amountSat"), "1000");
      assert.strictEqual(options.body.get("description"), "Test Memo");
      
      return {
        ok: true,
        json: async () => ({
          paymentHash: "fake-hash",
          serialized: "lnbc1..."
        })
      };
    });

    const result = await lightning.createInvoice(1000, "Test Memo");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.paymentHash, "fake-hash");
  });

  test("isPaid correctly identifies paid status", async () => {
    mock.method(global, 'fetch', async (url) => {
      assert.ok(url.includes("/payments/incoming/fake-hash"));
      return {
        ok: true,
        json: async () => ({ isPaid: true })
      };
    });

    const paid = await lightning.isPaid("fake-hash");
    assert.strictEqual(paid, true);
  });

  test("payWinner calls /payinvoice with correct invoice", async () => {
    mock.method(global, 'fetch', async (url, options) => {
      assert.strictEqual(url, "http://localhost:9740/payinvoice");
      assert.strictEqual(options.body.get("invoice"), "lnbc1...");
      return {
        ok: true,
        json: async () => ({ status: "succeeded", preimage: "fake-preimage" })
      };
    });

    const result = await lightning.payWinner("lnbc1...");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.preimage, "fake-preimage");
  });

  test("payWinner handles payment failure", async () => {
    mock.method(global, 'fetch', async () => {
      return {
        ok: true,
        json: async () => ({ status: "failed", reason: "Insufficient funds" })
      };
    });

    const result = await lightning.payWinner("lnbc1...");
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, "Insufficient funds");
  });
});
