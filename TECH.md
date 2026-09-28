# NOIR — tech stack, directory, logic

## Tech stack

### Backend (`NOIR/`)

| Layer | Choice | Role |
|---|---|---|
| Runtime | Node.js 18+ (CommonJS) | Process that runs sensors, pipeline, HTTP |
| HTTP | Express + cors | REST API for the frontend / demo |
| Config | dotenv | RPC, keys, intervals — never hardcoded |
| Storage | SQLite (`data/noir.db`) | Readings + batches |
| SQLite driver | `better-sqlite3` if it compiles; else Node 24 `node:sqlite` | Same schema either way |
| Hashing | crypto-js SHA-256 | Per-reading hash chain |
| Merkle | merkletreejs + SHA-256 (`sortPairs`) | Batch root from reading hashes |
| Chain | ethers.js v6 | Deploy + `anchorBatch` + read events |
| Network | Polygon Amoy testnet (chain id 80002) | Public tamper-evident anchor |
| Contract | Solidity `BatchAnchor.sol` (solc) | Emits `BatchAnchored(merkleRoot, deviceId, timestamp)` |

Sensors are **simulated**. No hardware.

### Frontend (`Frontend/`)

| Layer | Choice | Role |
|---|---|---|
| App | TanStack Start + React 19 + TypeScript | Pages: devices, device detail, alerts, verify |
| Styling | Tailwind + shadcn-style UI | Dashboard look |
| Charts | Recharts | Temperature series |
| Data today | `src/lib/noir-data.ts` mock objects | **Not wired to the Express API yet** |

---

## Directory

```
NOIR/                          repo root
├── README.md                  how to run / Amoy / API / troubleshooting
├── TECH.md                    this file
│
├── NOIR/                      backend
│   ├── .env.example           copy to .env
│   ├── package.json
│   ├── contracts/
│   │   └── BatchAnchor.sol    on-chain event-only contract
│   ├── scripts/
│   │   ├── compile.js         solc → src/chain/BatchAnchor.json
│   │   └── deploy.js          ethers deploy to Amoy
│   ├── data/                  created at runtime (gitignored)
│   │   └── noir.db
│   └── src/
│       ├── index.js           process entry: DB → sensors → batch timer → HTTP
│       ├── seed.js            starts 4 mock devices (also used by npm start)
│       ├── config.js          env + demo intervals + device ids
│       ├── db.js              schema + driver fallback
│       ├── logger.js          [sensor] [log] [batch] [anchor] [verify]
│       ├── sensor/generator.js
│       ├── pipeline/
│       │   ├── hashChain.js   SHA-256(device|temp|hum|ts|prevHash)
│       │   ├── deltaLogger.js deadband + heartbeat → INSERT readings
│       │   ├── merkle.js      tree from stored hashes
│       │   └── batcher.js     unbatched rows → batches row + batchId
│       ├── chain/
│       │   ├── BatchAnchor.json   ABI + bytecode
│       │   └── anchor.js      send tx, wait, parse BatchAnchored
│       └── api/routes.js      REST handlers
│
└── Frontend/
    └── src/
        ├── routes/            /, /device/$id, /alerts, /verify/$batchId
        ├── lib/noir-data.ts   mock devices / batches / alerts
        └── components/noir/   app shell, status badge
```

---

## Overall logic

Goal: prove a cold-chain log was not edited after the fact.

```
mock sensor (5s)
    → skip or log (deadband 0.3 °C/%  OR  heartbeat 60s)
    → SQLite readings  (hash chained to previous hash)
    → every 2 min, per device: Merkle tree of those hashes
    → batches (pending)
    → if PRIVATE_KEY + CONTRACT_ADDRESS: anchorBatch() on Amoy
    → batches (confirmed, txHash)
    → GET /api/verify/:id  rebuilds root, reads event from tx, compares
```

### 1. Generate

Four devices (`COLD-A1` … `COLD-D4`). Temperature stays ~2–5°C with noise; ~1/100 readings spike to 10–15°C (excursion for demo). Humidity ~80–98%.

### 2. Log less, chain more

Keep last logged point **in memory** (reloaded from DB on restart).

Log only if:

- first reading for that device, or
- `|Δtemp|` or `|Δhumidity|` > `DEADBAND_THRESHOLD`, or
- time since last log ≥ `HEARTBEAT_INTERVAL_MS`

Hash input (order fixed):

`deviceId | temperature(2dp) | humidity(2dp) | timestamp | prevHash`

Genesis `prevHash` is 32 zero bytes. Stored columns: `id, deviceId, temperature, humidity, timestamp, hash, prevHash, batchId`.

Changing any historical field breaks the chain from that point.

### 3. Batch

Every `BATCH_INTERVAL_MS`, for each device with unbatched rows:

1. Take those hashes in `id` order.
2. Merkle root (`hashLeaves: false`, leaves already SHA-256).
3. Insert `batches` (`pending`, `txHash` null).
4. Set `readings.batchId`.

A batch is the **unit of proof**: one root, one optional tx.

### 4. Anchor (optional)

`BatchAnchor.anchorBatch(bytes32 merkleRoot, string deviceId)` only emits an event (cheap, public).

If env is incomplete, skip and leave `pending`. If complete: send tx, `wait()`, store `txHash`, set `confirmed`.

### 5. Verify

1. Load batch readings, recompute Merkle root the same way.
2. If no `txHash` → not verified on chain (local root may still match `storedRoot`).
3. If `txHash`: `getTransactionReceipt`, parse `BatchAnchored`, compare `recomputedRoot` vs `anchoredRoot` vs stored root.

Explorer link: `https://amoy.polygonscan.com/tx/{txHash}`.

### 6. Alerts & API

Any logged temperature `> ALERT_THRESHOLD_C` (default 8°C) is an alert, with device + batch refs.

HTTP (`PORT`, default 3001): `/health`, `/api/devices`, `.../readings`, `.../batches`, `/api/batches/:id/certificate`, `/api/verify/:batchId`, `/api/alerts`.

Demo clocks are compressed: 5s ≈ sample interval, 60s ≈ 15 min heartbeat, 120s ≈ 1 hour batch.

---

## Data model (SQLite)

**readings** — one hash-chained sample (nullable `batchId` until batched).

**batches** — `merkleRoot`, `readingCount`, `startTime`, `endTime`, `status` (`pending` | `confirmed`), `txHash`, `createdAt`.

---

## Trust model (what is / isn’t proven)

| Claim | How |
|---|---|
| This set of hashes was committed at time T | Merkle root in Amoy event + tx timestamp |
| These rows match that commitment | Recompute tree from DB hashes |
| Order / no silent edit of a logged row | Hash chain (`prevHash`) |
| Sensor was physically real | **Not proven** (generator is fake) |
| Private key secrecy | Operator responsibility; `.env` gitignored |

Frontend screens describe the same product story but still read **static mock data**, not this backend.
