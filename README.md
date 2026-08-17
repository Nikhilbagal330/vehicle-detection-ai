# ParkGuard — Vehicle Detection & Violation Ops

AI-assisted **no-parking violation** system:

1. **Python detector** watches video, tracks vehicles in a zone, runs plate OCR, saves evidence, and posts violations to the API.
2. **Node.js server** stores users/violations/admin activity in MongoDB and serves evidence images.
3. **React admin dashboard** lets operators sign up/log in, review detections, filter/search, edit plates, verify/reject, and view charts + activity history.

---

## Architecture

```text
┌─────────────────────┐     POST /api/violations      ┌──────────────────────┐
│  python/            │  ───────────────────────────► │  server/              │
│  YOLO + ByteTrack   │                               │  Express + MongoDB    │
│  PaddleOCR          │   evidence/*.jpg on disk      │  JWT auth             │
│  evidence/          │ ◄── served at /evidence/* ─── │  AdminActivity log    │
└─────────────────────┘                               └──────────┬───────────┘
                                                                 │
                                                      REST JSON  │
                                                                 ▼
                                                      ┌──────────────────────┐
                                                      │  front-end/          │
                                                      │  Vite + React        │
                                                      │  ParkGuard dashboard │
                                                      └──────────────────────┘
```

| Folder | Role |
|--------|------|
| [`python/`](python/) | Detection pipeline (YOLO tracking, zone timer, OCR, evidence files, API client) |
| [`server/`](server/) | REST API, auth, MongoDB models, static evidence hosting |
| [`front-end/`](front-end/) | Admin UI (login/signup, dashboard, filters, charts, review actions) |

---

## Prerequisites

Install these before setup:

| Tool | Suggested version | Purpose |
|------|-------------------|---------|
| **Node.js** | 20+ (LTS) | Server + front-end |
| **npm** | comes with Node | Package installs |
| **Python** | 3.10+ | Detector + OCR |
| **MongoDB** | 6+ (local or Atlas) | Persistence |
| **Git** | any recent | Clone repo |

Optional but useful:

- A GPU is **not** required (CPU works; OCR/detection will be slower).
- OpenCV GUI needs a display if you want the live OpenCV window (`cv2.imshow`).

---

## Repository layout (important paths)

```text
vehicle-detection-ai/
├── python/
│   ├── main.py              # Main detection loop + backend upload
│   ├── plate_utils.py       # PaddleOCR plate detection helpers
│   ├── ocr_filter.py        # OCR helpers (if used)
│   ├── yolo11n.pt           # YOLO weights
│   ├── videos/              # Input videos (e.g. parking.mp4)
│   ├── evidence/            # Crop / plate / full-frame JPEGs (gitignored)
│   ├── violations/          # Local JSON copies of violations (gitignored)
│   └── .env                 # Detector config (create yourself)
├── server/
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js           # Routes + static /evidence from python/evidence
│   │   ├── models/          # User, Violation, AdminActivity
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── middleware/      # JWT auth
│   ├── package.json
│   └── .env                 # MONGO_URI, JWT_SECRET, PORT
├── front-end/
│   ├── src/
│   │   ├── pages/           # Login, Signup, Dashboard
│   │   ├── components/      # Table, filters, charts, activity, etc.
│   │   ├── api/             # Axios client + auth/violation APIs
│   │   └── context/         # AuthContext
│   ├── .env.example
│   └── package.json
└── README.md                # This file
```

---

## Environment variables

Do **not** commit real `.env` files. Create them locally.

### 1) `server/.env`

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/parkguard
JWT_SECRET=replace_with_a_long_random_string
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign admin JWTs |
| `PORT` | No | Defaults to `3000` |

### 2) `python/.env`

```env
BACKEND_URL=http://localhost:3000
CAMERA_ID=cam_01
ZONE_ID=no_parking_01
VIOLATION_TIME=2
```

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | Yes | Node API base URL |
| `CAMERA_ID` | Yes | Camera id stored on each violation |
| `ZONE_ID` | Yes | Zone id stored on each violation |
| `VIOLATION_TIME` | No | Seconds inside zone before violation (default in code if unset) |

Video path is currently set in code as `VIDEO_PATH = "videos/parking.mp4"` (relative to `python/`). Put your file at `python/videos/parking.mp4` or change that constant.

### 3) `front-end/.env`

```env
VITE_API_URL=http://localhost:3000
```

Copy from example:

```bash
cd front-end
cp .env.example .env
```

---

## Full setup (from zero)

Open **three terminals**. Run steps in order: **Mongo → server → front-end → python**.

### Step 0 — Clone / enter project

```bash
cd /path/to/vehicle-detection-ai
```

### Step 1 — Start MongoDB

**Local example (systemd):**

```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

**Or MongoDB Atlas:** put your Atlas URI in `server/.env` as `MONGO_URI`.

### Step 2 — Backend (`server/`)

```bash
cd server
npm install
```

Create `server/.env` (see variables above), then:

```bash
# development (auto-restart)
npm run dev

# or production-style
npm start
```

Check health:

```bash
curl http://localhost:3000/health
```

Expected:

```json
{"success":true,"message":"Backend is running"}
```

Evidence images are served from the Python folder:

```text
GET http://localhost:3000/evidence/<filename>.jpg
```

mapped to `python/evidence/<filename>.jpg`.

### Step 3 — Front-end (`front-end/`)

```bash
cd front-end
npm install
cp .env.example .env
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

Typical scripts:

```bash
npm run dev       # Vite dev server
npm run build     # production build → dist/
npm run preview   # preview production build
npm run lint      # oxlint
```

### Step 4 — Python detector (`python/`)

```bash
cd python
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

Install dependencies (exact pins may vary; these are the core packages used):

```bash
pip install --upgrade pip
pip install ultralytics opencv-python numpy requests python-dotenv paddlepaddle paddleocr
```

> **Note:** PaddleOCR / PaddlePaddle install can be platform-specific. If OneDNN errors appear at OCR time, `plate_utils.py` already disables MKLDNN (`enable_mkldnn=False`).

Create `python/.env` (see variables above). Ensure video exists:

```bash
ls videos/parking.mp4
```

Create output folders if needed (code also creates them):

```bash
mkdir -p evidence violations
```

Run:

```bash
python main.py
```

Press `q` in the OpenCV window to quit (when a display is available).

---

## Day-to-day runbook

With Mongo running:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd front-end && npm run dev

# Terminal 3
cd python && source venv/bin/activate && python main.py
```

1. Open the dashboard → **Sign up** (first admin) → **Sign in**.
2. Run the detector; when a vehicle stays in the zone long enough, a violation is posted.
3. Dashboard auto-refreshes (~5s). Open a row to see evidence images, edit plate, verify/reject.

---

## How each part works

### Python detector (`python/main.py`)

High-level loop:

1. Read frames from `VIDEO_PATH`.
2. Run YOLO tracking (`persist=True`, ByteTrack).
3. Test vehicle bottom-center against the polygon `ZONE`.
4. Start a timer when inside; if duration ≥ `VIOLATION_TIME` and not already violated for that track id:
   - Save **full frame** + **vehicle crop** under `evidence/`.
   - Queue OCR in a background worker.
5. OCR (`plate_utils.detect_plate`) finds a plate candidate, saves `plate_*.jpg`, writes a local JSON under `violations/`, then `POST`s to the Node API.
6. Track ids already violated once in this run do not create duplicate evidence.

### Node API (`server/`)

**Auth**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create admin user |
| POST | `/api/auth/login` | No | Get JWT + user |

**Violations**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/violations` | No | Detector ingest (kept open for Python) |
| GET | `/api/violations` | JWT | List with filters + pagination + stats + facets |
| GET | `/api/violations/stats/timeline` | JWT | Chart series (`range=1d\|7d\|1m\|3m\|6m`) |
| GET | `/api/violations/:id` | JWT | Single violation |
| GET | `/api/violations/:id/activities` | JWT | Admin activity for one violation |
| PATCH | `/api/violations/:id/status` | JWT | `VERIFIED` / `REJECTED` |
| PATCH | `/api/violations/:id/plate` | JWT | Correct plate number |

**List query params (examples):**

```text
page=1
limit=10
status=PENDING|VERIFIED|REJECTED|ALL
cameraId=cam_01
zoneId=no_parking_01
vehicleType=car
plateNumber=KBC
from=2026-08-01
to=2026-08-17
```

**Mongo collections (models)**

- `User` — admins (hashed password)
- `Violation` — detections + evidence paths + status
- `AdminActivity` — audit log (`VERIFIED`, `REJECTED`, `PLATE_UPDATED`)

### Front-end (`front-end/`)

Routes:

| Path | Access | Page |
|------|--------|------|
| `/login` | Public | Login |
| `/signup` | Public | Signup |
| `/` | JWT required | Dashboard |

Dashboard capabilities:

- Stat cards (pending / verified / rejected / total)
- Trends chart with timespan chips (1 day … 6 months)
- Filters: camera, zone, status, vehicle type, plate, date range
- Paginated table (server-side, 10 per page)
- Detail panel: evidence images from `/evidence/...`, edit plate, verify/reject
- Admin activity timeline per violation
- Silent auto-refresh so filters don’t flash a full-page loader

Auth token is stored in `localStorage` (`parkguard_token` / `parkguard_user`) and sent as `Authorization: Bearer <token>`.

More front-end detail: [`front-end/README.md`](front-end/README.md).

---

## Evidence images (important)

- Files are written by Python into **`python/evidence/`** only (not uploaded into the server process).
- Mongo stores relative paths like `evidence/plate_vehicle_82_....jpg`.
- The Node app statically serves that directory at **`/evidence/<filename>`**.
- The React UI builds URLs as `{VITE_API_URL}/evidence/<filename>`.

If images fail to load:

1. Confirm the file exists under `python/evidence/`.
2. Restart the Node server after path changes.
3. Open the image URL directly in the browser.
4. Ensure `VITE_API_URL` points at the running API.

---

## Typical workflow for an admin

1. Sign up / log in.
2. Watch new rows appear (or hit Refresh).
3. Filter by plate/camera/date as needed.
4. Open a violation → review plate/vehicle/full images.
5. Fix plate text if OCR was wrong → **Save plate** (logged in `AdminActivity`).
6. **Verify** or **Reject** (rejection reason optional; both logged).

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| `Could not connect to Node.js backend` | Server running? `BACKEND_URL` correct? |
| `JWT_SECRET` / login signup fails | `JWT_SECRET` set in `server/.env`? Restart server |
| Mongo connection failed | `MONGO_URI`, Mongo process/Atlas network |
| OCR OneDNN / PIR errors | Already mitigated in `plate_utils.py`; reinstall paddle packages if needed |
| Dashboard empty | Detector posting? Check server logs / Mongo `violations` |
| Images “could not be loaded” | File missing in `python/evidence`, or server not serving `/evidence` |
| Auth name missing in activity | Log out and log in again after JWT payload updates |
| OpenCV window / Wayland warnings | Display / `QT_QPA_PLATFORM` environment; headless machines may skip GUI |

---

## Security notes (current design)

- Detector `POST /api/violations` is **unauthenticated** so the Python job can post easily — lock this down for production (API key, network policy, etc.).
- `/evidence` is publicly readable by filename — treat filenames as sensitive or put auth/CDN rules in production.
- Use a strong `JWT_SECRET` and HTTPS in production.
- Change default demo camera/zone ids and rotate secrets.

---

## Tech stack summary

| Layer | Stack |
|-------|--------|
| Detection | Python, Ultralytics YOLO11, OpenCV, PaddleOCR |
| API | Node.js, Express 5, Mongoose, JWT, bcryptjs |
| DB | MongoDB |
| Admin UI | React 19, Vite, React Router, Axios, Recharts |

---

## Quick command cheat sheet

```bash
# Server
cd server && npm install && npm run dev

# Front-end
cd front-end && npm install && cp .env.example .env && npm run dev

# Python
cd python
python3 -m venv venv && source venv/bin/activate
pip install ultralytics opencv-python numpy requests python-dotenv paddlepaddle paddleocr
python main.py
```

Health checks:

```bash
curl http://localhost:3000/health
# Front-end: http://localhost:5173
```
