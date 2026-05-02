// lightning.js — Integración con motores Lightning (Phoenixd, Breez Liquid, MDK, Legacy)

const https = require("https");
// No node-fetch needed in Node 18+ (using global fetch)

// ─── Motores Lightning ────────────────────────────────────────────────────────

/**
 * Retorna el método activo. Si LN_ENGINE es 'none', busca configuración legado.
 */
function activeMethod() {
  const engine = (process.env.LN_ENGINE || "none").toLowerCase();
  if (engine !== "none") return engine;

  // Fallback legado (Manual Mode)
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
 * Inicializa el motor seleccionado al arrancar el servidor.
 */
async function init() {
  const method = activeMethod();
  console.log(`[Lightning] Inicializando motor: ${method.toUpperCase()}`);

  if (method === "phoenixd") {
    return await PhoenixdManager.checkStatus();
  }
  if (method === "breez-liquid") {
    // Phase 6
    console.log("[Lightning] Breez Liquid seleccionado (Próximamente)");
  }
  if (method === "mdk") {
    // Phase 7
    console.log("[Lightning] Money Dev Kit seleccionado (Próximamente)");
  }
}

// ─── Phoenixd Manager ─────────────────────────────────────────────────────────
// Support for phoenixd (https://github.com/acinq/phoenixd)
// Uses Basic Auth and form-encoded (x-www-form-urlencoded) POST requests.

const PhoenixdManager = {
  get authHeader() {
    const key = process.env.PHOENIXD_API_KEY || "";
    return "Basic " + Buffer.from(":" + key).toString("base64");
  },

  /** Verifies connectivity and retrieves NodeId */
  async checkStatus() {
    const url = process.env.PHOENIXD_URL || "http://localhost:9740";
    try {
      const res = await fetch(`${url}/getinfo`, {
        headers: { Authorization: this.authHeader }
      });
      if (!res.ok) throw new Error(`Phoenixd error: ${res.status}`);
      const data = await res.json();
      console.log(`[Lightning] Phoenixd conectado. NodeId: ${data.nodeId}`);
      return true;
    } catch (err) {
      console.error("[Lightning] Error al conectar con Phoenixd:", err.message);
      return false;
    }
  },

  /** Creates a BOLT11 invoice via /createinvoice */
  async createInvoice(satAmount, memo) {
    const url = process.env.PHOENIXD_URL || "http://localhost:9740";
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

  /** Checks if an incoming payment hash is settled via /payments/incoming/{hash} */
  async isPaid(paymentHash) {
    const url = process.env.PHOENIXD_URL || "http://localhost:9740";
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

  /** Pays a BOLT11/BOLT12 invoice via /payinvoice */
  async payWinner(invoice) {
    const url = process.env.PHOENIXD_URL || "http://localhost:9740";
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
      return { success: true, preimage: data.preimage };
    } catch (err) {
      console.error("[Lightning] Phoenixd error paying winner:", err.message);
      return { success: false, error: err.message };
    }
  }
};

// ─── Función principal ────────────────────────────────────────────────────────

async function createInvoice(satAmount, memo) {
  const method = activeMethod();

  if (method === "phoenixd") return PhoenixdManager.createInvoice(satAmount, memo);
  if (method === "nwc") return createInvoiceViaNWC(satAmount, memo);
  if (method === "lnd") return createInvoiceViaLND(satAmount, memo);

  return { manual: true, satAmount, memo };
}

/**
 * Verifica si un pago ha sido recibido.
 */
async function isPaid(paymentHash) {
  const method = activeMethod();
  if (method === "phoenixd") return PhoenixdManager.isPaid(paymentHash);
  // NWC/LND legacy no soportan isPaid fácilmente sin más lógica,
  // pero para Pay-to-Play solo usaremos los nuevos motores.
  return false;
}

/**
 * Paga al ganador (usado en modo Pay-to-Play).
 */
async function payWinner(invoice) {
  const method = activeMethod();
  if (method === "phoenixd") return PhoenixdManager.payWinner(invoice);
  return { success: false, error: "Motor no soporta pagos automáticos o no configurado" };
}

// ─── Legacy Providers (NWC / LND) ─────────────────────────────────────────────

async function createInvoiceViaNWC(satAmount, memo) {
  try {
    const { nwc } = await import("@getalby/sdk");
    const client = new nwc.NWCClient({ nostrWalletConnectUrl: process.env.NWC_URL });
    const response = await client.makeInvoice({ amount: satAmount * 1000, description: memo, expiry: 3600 });
    await client.close();
    return { success: true, paymentRequest: response.invoice, satAmount, memo };
  } catch (err) {
    console.error("Error NWC al crear factura:", err.message);
    return { manual: true, satAmount, memo, error: err.message };
  }
}

async function createInvoiceViaLND(satAmount, memo) {
  try {
    const agentOptions = {};
    if (process.env.LND_CERT) agentOptions.ca = Buffer.from(process.env.LND_CERT, "base64");
    else agentOptions.rejectUnauthorized = false;
    const agent = new https.Agent(agentOptions);
    const response = await fetch(`${process.env.LND_REST_URL}/v1/invoices`, {
      method: "POST",
      agent,
      headers: { "Grpc-Metadata-macaroon": process.env.LND_MACAROON, "Content-Type": "application/json" },
      body: JSON.stringify({ value: satAmount, memo, expiry: 3600 })
    });
    if (!response.ok) throw new Error(`LND ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return { success: true, paymentRequest: data.payment_request, satAmount, memo };
  } catch (err) {
    console.error("Error LND al crear factura:", err.message);
    return { manual: true, satAmount, memo, error: err.message };
  }
}

module.exports = { init, isConfigured, activeMethod, createInvoice, isPaid, payWinner };
