# NOIR

Cold-chain **IoT compliance** demo: mock sensors log temperature/humidity, a hash chain and Merkle tree protect the log, and a Merkle root can be **anchored on Polygon Amoy** so anyone can verify the batch was not tampered with.

```
Frontend/     UI (TanStack Start) — currently uses mock data, not the live API
NOIR/         Node.js backend — sensors, SQLite, Merkle batches, Amoy anchoring, REST API
```

**To run the compliance pipeline, you only need `NOIR/`.** The frontend is a separate UI and is not wired to `http://localhost:3001` yet.

Stack, folders, and pipeline logic: [`TECH.md`](TECH.md).

The Express server that was running on port **3001** has been stopped.

---

# Backend setup (`NOIR/`)

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 18+** (24 is fine) | Check with `node -v` |
| **npm** | Comes with Node |
| **Git** | Optional, to clone |
| **Polygon Amoy wallet** | Only if you want on-chain anchoring |
| **Amoy MATIC** | Tiny amount of gas for deploy + `anchorBatch` txs |

On Windows you do **not** need Visual Studio / `better-sqlite3`. If that native module fails to install, the backend uses Node’s built-in `node:sqlite` (Node 22.13+ / 24).

## 2. Install

From the **repository root** (`C:\Users\Isel\Projects\NOIR` or wherever you cloned):

```powershell
cd NOIR
npm install
```

Copy env template (PowerShell):

```powershell
Copy-Item .env.example .env
```

macOS/Linux: `cp .env.example .env`

## 3. Choose a mode

### A. Local demo (no blockchain) — start here

Leave `PRIVATE_KEY` and `CONTRACT_ADDRESS` **empty** in `.env`.

```powershell
npm start
```

You should see:

```
[db] using node:sqlite   (or better-sqlite3)
[sensor] starting mock devices  COLD-A1, COLD-B2, COLD-C3, COLD-D4
[api] NOIR backend listening on http://localhost:3001
[log] reading logged (first) ...
```

Then every ~2 minutes:

```
[batch] batch created { batchId, merkleRoot, readingCount }
[anchor] skipped (missing RPC_URL, PRIVATE_KEY, or CONTRACT_ADDRESS)
```

API still works. Batches stay `status: "pending"` and `/api/verify/:id` returns `verified: false` with `reason: Batch has no transaction hash yet`. The **recomputed Merkle root** should still match `storedRoot`.

### B. Full demo (Polygon Amoy)

Do this after local mode works.

1. Create or use a wallet (MetaMask is fine). Switch network to **Polygon Amoy** (chain id **80002**).
2. Fund it with test MATIC (Amoy faucet — search “Polygon Amoy faucet”; faucets change often).
3. Export the **private key** (MetaMask: Account details → Show private key). Never commit it. Never use a mainnet key.
4. Put it in `NOIR/.env`:

```
RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0xYOUR_64_HEX_CHARS
CONTRACT_ADDRESS=
```

5. Compile and deploy the contract **once**:

```powershell
npm run compile
npm run deploy
```

Example output:

```
Deploying BatchAnchor from 0xYourWallet...
CONTRACT_ADDRESS=0xAbc...
Explorer: https://amoy.polygonscan.com/address/0xAbc...
```

6. Paste that address into `.env`:

```
CONTRACT_ADDRESS=0xAbc...
```

7. Restart the server (`Ctrl+C`, then `npm start`).

After the next batch interval (~2 min) you should see:

```
[batch] batch created ...
[anchor] anchoring tx sent { txHash }
[anchor] tx confirmed { txHash, blockNumber, explorer }
```

Then:

```powershell
curl.exe http://localhost:3001/api/verify/1
```

`verified` should be `true` if the tx landed and the local tree still matches.

---

## 4. What `.env` means

File: `NOIR/.env` (gitignored). Template: `NOIR/.env.example`.

| Variable | Default | What it does |
|---|---|---|
| `RPC_URL` | `https://rpc-amoy.polygon.technology` | Amoy JSON-RPC |
| `PRIVATE_KEY` | empty | Wallet that pays gas and calls `anchorBatch`. **Never share.** |
| `CONTRACT_ADDRESS` | empty | Deployed `BatchAnchor` address |
| `PORT` | `3001` | HTTP API |
| `SENSOR_INTERVAL_MS` | `5000` | Mock sample period (demo stand-in for 1–5 min) |
| `DEADBAND_THRESHOLD` | `0.3` | Only log if temp or humidity moves more than this |
| `HEARTBEAT_INTERVAL_MS` | `60000` | Force a log if quiet (demo stand-in for 15 min) |
| `BATCH_INTERVAL_MS` | `120000` | Merkle batch period (demo stand-in for 1 hour) |
| `ALERT_THRESHOLD_C` | `8` | Readings above this appear in `/api/alerts` |
| `CHAIN_ID` | `80002` | Polygon Amoy |
| `EXPLORER_TX_URL` | `https://amoy.polygonscan.com/tx/` | Links in API JSON |
| `DB_PATH` | `./data/noir.db` | SQLite file (created automatically) |

Reset demo data: stop the server, delete `NOIR/data/noir.db` (and `-wal`/`-shm` if present), start again.

---

## 5. How the pipeline works (for the live demo)

1. **Mock sensors** emit `{ deviceId, temperature, humidity, timestamp }` every 5s. Temperature stays ~2–5°C; about 1 in 100 readings spikes to 10–15°C (excursion).
2. **Delta logger** writes to SQLite only if the value moved past the deadband **or** the heartbeat elapsed. Each row gets `hash = SHA256(deviceId|temp|humidity|timestamp|prevHash)`.
3. **Batcher** (every 2 min) groups unbatched readings **per device**, builds a Merkle tree (`merkletreejs` + SHA-256, `sortPairs`), stores `merkleRoot`, marks rows with `batchId`.
4. **Anchor** (if keys are set) calls `anchorBatch(merkleRoot, deviceId)` on Amoy and saves `txHash`, `status = confirmed`.
5. **Verify** rebuilds the tree from stored hashes, reads the `BatchAnchored` event from that tx, compares roots.

Console tags to narrate: `[sensor]` `[log]` `[batch]` `[anchor]` `[verify]`.

---

## 6. API (base `http://localhost:3001`)

CORS is enabled for a local frontend.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | `{ "ok": true }` |
| GET | `/api/devices` | Devices, latest reading, `ok` / `excursion` / `unknown` |
| GET | `/api/devices/:id/readings?hours=24` | Chart series |
| GET | `/api/devices/:id/batches` | Batches + explorer URL when confirmed |
| GET | `/api/batches/:id/certificate` | Certificate payload (summary, root, tx, readings) |
| GET | `/api/verify/:batchId` | Recomputed root vs on-chain event |
| GET | `/api/alerts` | Readings above `ALERT_THRESHOLD_C` |

Device ids: `COLD-A1`, `COLD-B2`, `COLD-C3`, `COLD-D4`.

Examples (PowerShell):

```powershell
curl.exe http://localhost:3001/health
curl.exe http://localhost:3001/api/devices
curl.exe "http://localhost:3001/api/devices/COLD-A1/readings?hours=24"
curl.exe http://localhost:3001/api/devices/COLD-A1/batches
curl.exe http://localhost:3001/api/batches/1/certificate
curl.exe http://localhost:3001/api/verify/1
curl.exe http://localhost:3001/api/alerts
```

Wait ~2 minutes after start before batches (and verify) exist.

---

## 7. Contract

`NOIR/contracts/BatchAnchor.sol`:

- `anchorBatch(bytes32 merkleRoot, string deviceId)` emits `BatchAnchored(merkleRoot, deviceId, timestamp)`.

Compile output: `NOIR/src/chain/BatchAnchor.json` (ABI + bytecode). `npm start` does **not** deploy; only `npm run deploy` does.

---

## 8. Stop / restart

- Stop: `Ctrl+C` in the terminal running `npm start`.
- Port in use (`EADDRINUSE :::3001`): something is still bound to 3001. In PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'better-sqlite3'` | Harmless. Fallback to `node:sqlite` is automatic. |
| `listen EADDRINUSE :::3001` | Kill the old process (section 8) or set `PORT=3002` in `.env`. |
| `[anchor] skipped` | `.env` missing `PRIVATE_KEY` and/or `CONTRACT_ADDRESS`. Restart after editing `.env`. |
| `deploy` fails: insufficient funds | Get Amoy MATIC; confirm the RPC URL. |
| `deploy` fails: invalid private key | Key must be 64 hex chars, usually prefixed `0x`. |
| `verified: false` with no `txHash` | Expected until a batch is confirmed on-chain. |
| `verified: false` with a `txHash` | RPC issues, wrong `CONTRACT_ADDRESS`, or DB was wiped after the tx. |
| Empty `/api/devices` | Wait a few seconds for the first sensor ticks. |
| Want a clean slate | Stop server, delete `NOIR/data/`, start again. |

---

## 10. Frontend (`Frontend/`) — optional, UI only

The UI is **not** connected to the backend yet; it shows hard-coded devices (`truck-14`, etc.). To view it:

```powershell
cd Frontend
npm install
npm run dev
```

Open the URL Vite prints (often `http://localhost:8080` with this Lovable/TanStack setup).

---

## Security

- Never commit `.env` or a real private key.
- Use a **throwaway** Amoy test wallet.
- This contract only emits an event; it does not store funds.
