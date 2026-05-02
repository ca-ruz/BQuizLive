// Unit tests for server/lightning.js
// Tests mode detection and manual invoice creation without hitting any real
// Lightning node — no mocking library needed.
// Run with: node --test tests/lightning.test.js

"use strict";

const { describe, test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

// lightning.js reads process.env at call-time (not at require-time),
// so we can safely change env vars between tests without re-requiring.
const lightning = require("../server/lightning");

function clearLightningEnv() {
  delete process.env.LN_ENGINE;
  delete process.env.NWC_URL;
  delete process.env.LND_REST_URL;
  delete process.env.LND_MACAROON;
  delete process.env.LND_CERT;
}

// ─── Mode detection ───────────────────────────────────────────────────────────

describe("activeMethod", () => {
  beforeEach(clearLightningEnv);
  afterEach(clearLightningEnv);

  test("returns 'manual' when no env vars are set", () => {
    assert.strictEqual(lightning.activeMethod(), "manual");
  });

  test("returns 'nwc' when NWC_URL has correct prefix", () => {
    process.env.NWC_URL = "nostr+walletconnect://pubkey@relay?secret=abc";
    assert.strictEqual(lightning.activeMethod(), "nwc");
  });

  test("returns 'manual' when NWC_URL has wrong prefix", () => {
    process.env.NWC_URL = "http://not-a-valid-nwc-url";
    assert.strictEqual(lightning.activeMethod(), "manual");
  });

  test("returns 'manual' when NWC_URL is empty string", () => {
    process.env.NWC_URL = "";
    assert.strictEqual(lightning.activeMethod(), "manual");
  });

  test("returns 'lnd' when both LND_REST_URL and LND_MACAROON are set", () => {
    process.env.LND_REST_URL = "https://my-node:8080";
    process.env.LND_MACAROON = "deadbeef1234";
    assert.strictEqual(lightning.activeMethod(), "lnd");
  });

  test("returns 'manual' when only LND_REST_URL is set (no macaroon)", () => {
    process.env.LND_REST_URL = "https://my-node:8080";
    assert.strictEqual(lightning.activeMethod(), "manual");
  });

  test("returns 'manual' when only LND_MACAROON is set (no URL)", () => {
    process.env.LND_MACAROON = "deadbeef1234";
    assert.strictEqual(lightning.activeMethod(), "manual");
  });

  test("NWC takes priority over LND when both are configured", () => {
    process.env.NWC_URL     = "nostr+walletconnect://pubkey@relay";
    process.env.LND_REST_URL = "https://my-node:8080";
    process.env.LND_MACAROON = "deadbeef1234";
    assert.strictEqual(lightning.activeMethod(), "nwc");
  });

  test("returns 'phoenixd' when LN_ENGINE is set to phoenixd", () => {
    process.env.LN_ENGINE = "phoenixd";
    assert.strictEqual(lightning.activeMethod(), "phoenixd");
  });
});

// ─── isConfigured ─────────────────────────────────────────────────────────────

describe("isConfigured", () => {
  beforeEach(clearLightningEnv);
  afterEach(clearLightningEnv);

  test("returns false in manual mode", () => {
    assert.strictEqual(lightning.isConfigured(), false);
  });

  test("returns true when NWC is configured", () => {
    process.env.NWC_URL = "nostr+walletconnect://pubkey@relay";
    assert.strictEqual(lightning.isConfigured(), true);
  });

  test("returns true when LND is configured", () => {
    process.env.LND_REST_URL = "https://my-node:8080";
    process.env.LND_MACAROON = "deadbeef";
    assert.strictEqual(lightning.isConfigured(), true);
  });

  test("returns true when phoenixd is configured", () => {
    process.env.LN_ENGINE = "phoenixd";
    assert.strictEqual(lightning.isConfigured(), true);
  });
});

// ─── createInvoice (manual mode only — no real node needed) ───────────────────

describe("createInvoice — manual mode", () => {
  beforeEach(clearLightningEnv);
  afterEach(clearLightningEnv);

  test("returns { manual: true } when no Lightning is configured", async () => {
    const result = await lightning.createInvoice(100, "Test memo");
    assert.strictEqual(result.manual, true);
  });

  test("includes the correct satAmount in the result", async () => {
    const result = await lightning.createInvoice(42, "Test");
    assert.strictEqual(result.satAmount, 42);
  });

  test("includes the memo in the result", async () => {
    const result = await lightning.createInvoice(100, "Bitcoin Quiz Winner: Alice");
    assert.strictEqual(result.memo, "Bitcoin Quiz Winner: Alice");
  });

  test("does not include a paymentRequest in manual mode", async () => {
    const result = await lightning.createInvoice(100, "memo");
    assert.ok(!result.paymentRequest,
      "paymentRequest should not be set in manual mode");
  });

  test("handles zero satoshis gracefully", async () => {
    const result = await lightning.createInvoice(0, "zero");
    assert.strictEqual(result.manual, true);
    assert.strictEqual(result.satAmount, 0);
  });
});
