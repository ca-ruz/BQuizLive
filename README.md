# Bitcoin Quiz Live

Quiz multijugador estilo Kahoot para meetups de Bitcoin.
Los participantes se unen desde su teléfono, compiten en tiempo real y
el ganador recibe sats a través de Lightning Network.

---

## Características

- **Modo Pay-to-Play**: Los jugadores pagan una entrada (sats) para fondear un pozo de premios.
- **Pagos Automáticos**: El ganador reclama su premio al final ingresando su dirección Lightning.
- **Soporte Multi-Motor**: Phoenixd, Breez SDK (Liquid), MDK (Cloud), NWC, LND o modo manual.
- Panel del presentador con marcador en vivo y flujo automático.
- Participantes se unen desde su celular con código o QR.
- ~100 preguntas en 9 categorías (bilingües ES/EN).
- Temporizador con puntuación por velocidad (50–100 pts).
- UI mobile-first con tema Synthwave/Neon.

---

## Inicio rápido

### 1. Clonar e Instalar dependencias

```bash
git clone https://github.com/ca-ruz/bitcoin-quiz-live
cd bitcoin-quiz-live
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
# edita .env según necesites
```

- **Modo Manual**: Deja `ENTRY_FEE_SATS=0`. Gratis para jugadores, pago manual del host.
- **Modo Pool**: Configura `ENTRY_FEE_SATS` (ej: 100) y elige un `LN_ENGINE` (ej: phoenixd).

### 3. Correr el servidor

```bash
npm run dev
```

---

## Modos de Juego y Recompensa

| Modo | Entrada | Recompensa (Premio) | Pago |
|------|---------|---------------------|------|
| **Manual** | Gratis | `puntos_ganador × SAT_PER_POINT` | Manual (Host) |
| **Phoenixd** | Sats | Suma de todas las entradas (Pozo) | Automático |
| **Breez Liquid**| Sats | Suma de todas las entradas (Pozo) | Automático |
| **MDK (Cloud)** | Sats | Suma de todas las entradas (Pozo) | Automático |

---

## Integración Lightning Network

### Motores Modernos (Recomendado para Pay-to-Play)

1.  **Phoenixd**: Ideal si ya corres `phoenixd` localmente. Gestión automática de canales.
2.  **Breez SDK (Liquid)**: Experiencia "nodeless" usando Liquid Network. Sin canales.
3.  **Money Dev Kit (MDK)**: Opción en la nube, zero-config.

### Métodos Legado (Solo para modo Manual)

- **NWC (Nostr Wallet Connect)**: Conecta tu wallet (Alby, Zeus) vía Nostr.
- **LND REST**: Conexión directa a tu nodo LND.

---

## Variables de entorno principales

```env
ENTRY_FEE_SATS=100             # Costo de entrada (0 = Manual)
LN_ENGINE=phoenixd             # none, phoenixd, breez-liquid, mdk

# Config Phoenixd
PHOENIXD_URL=http://localhost:9740
PHOENIXD_API_KEY=tu_password_aqui

# Config Breez Liquid
BREEZ_API_KEY=tu_breez_api_key
BREEZ_MNEMONIC=tus_12_palabras...
```

---

## Estructura del proyecto

```
bitcoin-quiz-live/
├── server/
│   ├── server.js        Socket.io orchestration + join gating
│   ├── quizEngine.js    Prize pool & room state logic
│   └── lightning.js     Multi-engine abstraction (Phoenixd, Breez, MDK...)
├── public/
│   ├── host.html        Presenter dashboard
│   ├── index.html       Player app (with payment/payout screens)
│   └── i18n.js          Bilingual translations
├── tests/
│   ├── pool.test.js     Prize pool logic validation
│   ├── phoenixd.test.js Mocked API tests
│   └── ...
└── PLAN.md              Implementation roadmap
```

---

## Pendientes / Hoja de ruta

### Conectividad Lightning

- [x] **Pool de sats para premios** — Los participantes pagan su entrada para fondear el premio.
- [x] **Pagos automáticos** — El servidor paga directamente al ganador al finalizar.
- [ ] **Soporte BOLT12** — Permitir que el ganador cobre vía oferta estática (en phoenixd).
- [ ] **Zaps de Nostr** — Fondeo externo del pool vía Nostr.

---

## Licencia

GNU General Public License v3.0. Software libre — contribuciones bienvenidas.
