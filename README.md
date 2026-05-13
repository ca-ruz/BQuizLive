# Bitcoin Quiz Live

Multiplayer Kahoot-style quiz for Bitcoin meetups. Participants join via mobile, compete in real-time, and the winner receives sats via the Lightning Network.

---

## Features

- **Pay-to-Play Mode**: Players pay an entry fee (sats) to fund a prize pool.
- **Automated Payouts**: The winner claims their prize at the end by entering their Lightning Address.
- **Multi-Engine Support**: Phoenixd or manual mode. Coming soon: Breez SDK (Liquid), MDK (Cloud), NWC, LND.
- Presenter dashboard with live leaderboard and automated game flow.
- Participants join via mobile using a room code or QR.
- ~100 questions across 9 categories (bilingual ES/EN).
- Timer with speed-based scoring (50–100 pts).
- Mobile-first UI with a Synthwave/Neon theme.

---

## Quick Start

### 1. Clone and Install dependencies

```bash
git clone https://github.com/ca-ruz/bitcoin-quiz-live
cd bitcoin-quiz-live
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# edit .env as needed
```

- **Manual Mode**: Leave `ENTRY_FEE_SATS=0`. Free for players, manual payout by host.
- **Pool Mode**: Configure `ENTRY_FEE_SATS` (e.g., 2100) and select an `LN_ENGINE` (e.g., phoenixd).

### 3. Run the server

```bash
npm run dev
```

---

## Game Modes & Rewards

| Mode | Entry Fee | Reward (Prize) | Payout |
|------|-----------|----------------|--------|
| **Manual** | Free | `winner_points × SAT_PER_POINT` | Manual (Host) |
| **Phoenixd** | Sats | Sum of all entries (Pool) | Automated |

---

## Lightning Network Integration

### Modern Engines (Recommended for Pay-to-Play)

1.  **Phoenixd**: Ideal if you already run `phoenixd` locally. Automated channel management.

---

## Main Environment Variables

```env
ENTRY_FEE_SATS=2100            # Entry cost (0 = Manual)
PAYOUT_FEE_RESERVE_SATS=20     # Pool sats reserved for routing fees
LN_ENGINE=phoenixd             # none, phoenixd, breez-liquid, mdk

# Phoenixd Config
PHOENIXD_URL=http://127.0.0.1:9740
PHOENIXD_API_KEY=your_password_here

---

## Project Structure

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
```

---

## Roadmap / Pending Tasks

### Lightning Connectivity

- [x] **Prize Pool** — Participants pay to fund the prize.
- [x] **Automated Payouts** — Server pays the winner directly.
- [ ] **BOLT12 Support** — Allow winner to claim via static offer (on phoenixd).
- [ ] **Nostr Zaps** — External pool funding via Nostr.

---

## License

GNU General Public License v3.0. Free software — contributions welcome.
