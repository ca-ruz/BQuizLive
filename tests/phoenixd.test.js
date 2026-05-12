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
    mock.method(global, 'fetch', () => {});
  });

  afterEach(() => {
    mock.reset();
  });

  test("createInvoice calls /createinvoice with correct params", async () => {
    mock.method(global, 'fetch', async (url) => {
      if (url.endsWith("/createinvoice")) {
        return {
          ok: true,
          json: async () => ({
            paymentHash: "fake-hash",
            serialized: "lnbc1..."
          })
        };
      }
      return { ok: false };
    });

    const result = await lightning.createInvoice(1000, "Test Memo");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.paymentHash, "fake-hash");
  });

  test("isPaid correctly identifies paid status", async () => {
    mock.method(global, 'fetch', async (url) => {
      if (url.includes("/payments/incoming/")) {
        return {
          ok: true,
          json: async () => ({ isPaid: true })
        };
      }
      return { ok: false };
    });

    const paid = await lightning.isPaid("fake-hash");
    assert.strictEqual(paid, true);
  });

  test("payWinner calls /payinvoice", async () => {
    mock.method(global, 'fetch', async (url) => {
      if (url.endsWith("/payinvoice")) {
        return {
          ok: true,
          json: async () => ({
            status: "succeeded",
            preimage: "fake-preimage",
            amountSat: 2000,
            feeSat: 15
          })
        };
      }
      // Return empty info for checkStatus
      return {
        ok: true,
        json: async () => ({ balanceSat: 0 })
      };
    });

    const result = await lightning.payWinner("lnbc1...");
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.prizeSat, 2000);
    assert.strictEqual(result.feeSat, 15);
  });

  test("payWinner handles payment failure", async () => {
    mock.method(global, 'fetch', async (url) => {
      if (url.endsWith("/payinvoice")) {
        return {
          ok: true,
          json: async () => ({ status: "failed", reason: "Insufficient funds" })
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const result = await lightning.payWinner("lnbc1...");
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, "Insufficient funds");
  });
});
