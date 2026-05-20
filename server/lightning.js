// lightning.js — Lightning Network engines integration (Phoenixd, NWC, LND, Legacy)

const https = require("https");
const fetch = require("node-fetch");

// ─── Lightning Engines ───────────────────────────────────────────────────────

/**
 * Returns the active method. If LN_ENGINE is 'none', it looks for legacy config.
 */
function activeMethod() {
  const engine = (process.env.LN_ENGINE || "none").toLowerCase();
  if (engine !== "none") return engine;

  // Legacy fallback (Manual Mode)
  if (process.env.NWC_URL && process.env.NWC_URL.startsWith("nostr+walletconnect://")) {
    return "nwc";
  }
  if (process.env.LND_REST_URL && process.env.LND_MACAROON) {
    return "lnd";
  }
  return "manual";
}

function isConfigured() {
  const method = activeMethod();
  return method !== "manual" && method !== "none";
}

/**
 * Initializes the selected engine on server startup.
 */
async function init() {
  const method = activeMethod();
  console.log(`[Lightning] Initializing engine: ${method.toUpperCase()}`);

  if (method === "phoenixd") {
    return await PhoenixdManager.checkStatus();
  }
  if (method === "nwc") {
    return await NwcManager.checkStatus();
  }
  if (method === "lnd") {
    return await LndManager.checkStatus();
  }
}

// ─── Phoenixd Manager ─────────────────────────────────────────────────────────

const PhoenixdManager = {
  get authHeader() {
    const key = process.env.PHOENIXD_API_KEY || "";
    return "Basic " + Buffer.from(":" + key).toString("base64");
  },

  async checkStatus() {
    const url = process.env.PHOENIXD_URL || "http://127.0.0.1:9740";
    try {
      const res = await fetch(`${url}/getinfo`, {
        headers: { Authorization: this.authHeader }
      });
      if (!res.ok) throw new Error(`Phoenixd error: ${res.status}`);
      const data = await res.json();
      console.log(`[Lightning] Phoenixd connected. NodeId: ${data.nodeId}`);
      return data;
    } catch (err) {
      console.error("[Lightning] Error connecting to Phoenixd:", err.message);
      return null;
    }
  },

  async createInvoice(satAmount, memo) {
    const url = process.env.PHOENIXD_URL || "http://127.0.0.1:9740";
    try {
      const params = new URLSearchParams();
      params.append("amountSat", satAmount);
      params.append("description", memo);

      const res = await fetch(`${url}/createinvoice`, {
        method: "POST",
        headers: { 
          Authorization: this.authHeader,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      if (!res.ok) throw new Error(`Phoenixd ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return {
        success: true,
        paymentRequest: data.serialized,
        paymentHash: data.paymentHash,
        satAmount,
        memo
      };
    } catch (err) {
      console.error("[Lightning] Phoenixd error creating invoice:", err.message);
      return { manual: true, satAmount, memo, error: err.message };
    }
  },

  async isPaid(paymentHash) {
    const url = process.env.PHOENIXD_URL || "http://127.0.0.1:9740";
    try {
      const res = await fetch(`${url}/payments/incoming/${paymentHash}`, {
        headers: { Authorization: this.authHeader }
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.isPaid === true;
    } catch (err) {
      return false;
    }
  },

  async payWinner(invoice) {
    const url = process.env.PHOENIXD_URL || "http://127.0.0.1:9740";
    try {
      const params = new URLSearchParams();
      params.append("invoice", invoice);

      const res = await fetch(`${url}/payinvoice`, {
        method: "POST",
        headers: { 
          Authorization: this.authHeader,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      if (!res.ok) throw new Error(`Phoenixd ${res.status}: ${await res.text()}`);
      const data = await res.json();
      if (data.status === "failed") {
        throw new Error(data.reason || "Payment failed");
      }
      
      const info = await this.checkStatus();
      const prizeSat = data.amountSat || data.recipientAmountSat || 0;
      const feeSat = data.feeSat || data.routingFeeSat || 0;
      
      return {
        success: true,
        preimage: data.preimage || data.paymentPreimage,
        paymentHash: data.paymentHash,
        prizeSat: Number(prizeSat),
        feeSat: Number(feeSat),
        sentSat: Number(prizeSat) + Number(feeSat),
        finalBalanceSat: info ? info.balanceSat : undefined,
        raw: data
      };
    } catch (err) {
      console.error("[Lightning] Phoenixd error paying winner:", err.message);
      return { success: false, error: err.message };
    }
  }
};

// ─── NWC Manager ──────────────────────────────────────────────────────────────

const NwcManager = {
  async checkStatus() {
    try {
      const { nwc } = await import("@getalby/sdk");
      const client = new nwc.NWCClient({ nostrWalletConnectUrl: process.env.NWC_URL });
      const info = await client.getInfo();
      await client.close();
      console.log(`[Lightning] NWC connected. Methods: ${info.methods.join(", ")}`);
      return info;
    } catch (err) {
      console.error("[Lightning] NWC check failed:", err.message);
      return null;
    }
  },

  async createInvoice(satAmount, memo) {
    try {
      const { nwc } = await import("@getalby/sdk");
      const client = new nwc.NWCClient({ nostrWalletConnectUrl: process.env.NWC_URL });
      const response = await client.makeInvoice({ 
        amount: satAmount * 1000, 
        description: memo, 
        expiry: 3600 
      });
      await client.close();
      return { 
        success: true, 
        paymentRequest: response.invoice, 
        paymentHash: response.payment_hash,
        satAmount, 
        memo 
      };
    } catch (err) {
      console.error("NWC error creating invoice:", err.message);
      return { manual: true, satAmount, memo, error: err.message };
    }
  },

  async isPaid(paymentHash) {
    try {
      const { nwc } = await import("@getalby/sdk");
      const client = new nwc.NWCClient({ nostrWalletConnectUrl: process.env.NWC_URL });
      const result = await client.lookupInvoice({ payment_hash: paymentHash });
      await client.close();
      return !!result.settled_at;
    } catch (err) {
      return false;
    }
  },

  async payWinner(invoice) {
    try {
      const { nwc } = await import("@getalby/sdk");
      const client = new nwc.NWCClient({ nostrWalletConnectUrl: process.env.NWC_URL });
      const response = await client.sendPayment({ invoice });
      await client.close();
      return {
        success: true,
        preimage: response.preimage,
        paymentHash: response.payment_hash,
        prizeSat: Math.floor(response.amount / 1000),
        feeSat: Math.floor(response.fees_paid / 1000),
        sentSat: Math.floor((response.amount + response.fees_paid) / 1000)
      };
    } catch (err) {
      console.error("NWC error paying winner:", err.message);
      return { success: false, error: err.message };
    }
  }
};

// ─── LND Manager ──────────────────────────────────────────────────────────────

const LndManager = {
  get agent() {
    const agentOptions = {};
    if (process.env.LND_CERT) agentOptions.ca = Buffer.from(process.env.LND_CERT, "base64");
    else agentOptions.rejectUnauthorized = false;
    return new https.Agent(agentOptions);
  },

  async checkStatus() {
    try {
      const res = await fetch(`${process.env.LND_REST_URL}/v1/getinfo`, {
        agent: this.agent,
        headers: { "Grpc-Metadata-macaroon": process.env.LND_MACAROON }
      });
      if (!res.ok) throw new Error(`LND error: ${res.status}`);
      const data = await res.json();
      console.log(`[Lightning] LND connected. Alias: ${data.alias}`);
      return data;
    } catch (err) {
      console.error("[Lightning] LND check failed:", err.message);
      return null;
    }
  },

  async createInvoice(satAmount, memo) {
    try {
      const response = await fetch(`${process.env.LND_REST_URL}/v1/invoices`, {
        method: "POST",
        agent: this.agent,
        headers: { "Grpc-Metadata-macaroon": process.env.LND_MACAROON, "Content-Type": "application/json" },
        body: JSON.stringify({ value: satAmount, memo, expiry: 3600 })
      });
      if (!response.ok) throw new Error(`LND ${response.status}: ${await response.text()}`);
      const data = await response.json();
      const paymentHash = Buffer.from(data.r_hash, "base64").toString("hex");
      return { success: true, paymentRequest: data.payment_request, paymentHash, satAmount, memo };
    } catch (err) {
      console.error("LND error creating invoice:", err.message);
      return { manual: true, satAmount, memo, error: err.message };
    }
  },

  async isPaid(paymentHash) {
    try {
      const response = await fetch(`${process.env.LND_REST_URL}/v1/invoice/${paymentHash}`, {
        agent: this.agent,
        headers: { "Grpc-Metadata-macaroon": process.env.LND_MACAROON }
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.settled === true;
    } catch (err) {
      return false;
    }
  },

  async payWinner(invoice) {
    try {
      const response = await fetch(`${process.env.LND_REST_URL}/v1/channels/transactions`, {
        method: "POST",
        agent: this.agent,
        headers: { "Grpc-Metadata-macaroon": process.env.LND_MACAROON, "Content-Type": "application/json" },
        body: JSON.stringify({ payment_request: invoice })
      });
      if (!response.ok) throw new Error(`LND ${response.status}: ${await response.text()}`);
      const data = await response.json();
      if (data.payment_error) throw new Error(data.payment_error);
      
      return {
        success: true,
        preimage: Buffer.from(data.payment_preimage, "base64").toString("hex"),
        paymentHash: Buffer.from(data.payment_hash, "base64").toString("hex"),
        sentSat: 0, // LND REST response for payments is a bit sparse on fees
        raw: data
      };
    } catch (err) {
      console.error("LND error paying winner:", err.message);
      return { success: false, error: err.message };
    }
  }
};

// ─── Main Functions ──────────────────────────────────────────────────────────

async function createInvoice(satAmount, memo) {
  const method = activeMethod();
  if (method === "phoenixd") return PhoenixdManager.createInvoice(satAmount, memo);
  if (method === "nwc") return NwcManager.createInvoice(satAmount, memo);
  if (method === "lnd") return LndManager.createInvoice(satAmount, memo);
  return { manual: true, satAmount, memo };
}

async function isPaid(paymentHash) {
  const method = activeMethod();
  if (method === "phoenixd") return PhoenixdManager.isPaid(paymentHash);
  if (method === "nwc") return NwcManager.isPaid(paymentHash);
  if (method === "lnd") return LndManager.isPaid(paymentHash);
  return false;
}

async function payWinner(invoice) {
  const method = activeMethod();
  if (method === "phoenixd") return PhoenixdManager.payWinner(invoice);
  if (method === "nwc") return NwcManager.payWinner(invoice);
  if (method === "lnd") return LndManager.payWinner(invoice);
  return { success: false, error: "Engine does not support automated payouts or not configured" };
}

module.exports = { init, isConfigured, activeMethod, createInvoice, isPaid, payWinner };
