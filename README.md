# Multithreaded mayhem

> Accepts a `.zip` file with images, extracts them, generates thumbnails in worker threads, and returns a summary.
> Thumbnail generation is offloaded to worker threads, and processed/skipped counters are mutex-protected for consistency.

---

## API

### POST `/zip`

**Accepts:**

- `multipart/form-data` with a field `file` containing a `.zip` archive (10–50 images)

**Returns:**

```json
{
  "processed": 48,
  "skipped": 2,
  "durationMs": 3278
}
```

---

## Technical Overview

| Component        | Description                                                  | Required Tools                |
|------------------|--------------------------------------------------------------|-------------------------------|
| **API**          | Express server with a single `POST /zip` route               | `express`, `multer`           |
| **Zip Handling** | Extracts zip into `/tmp/<request_id>`                        | `adm-zip`, `fs/promises`      |
| **Thumbnailing** | Each image is processed in a background worker thread        | `worker_threads`, `sharp`     |
| **Sync**         | `processed`/`skipped` counters updated with mutex protection | `async-mutex` or custom mutex |
| **Cleanup**      | Temporary files are removed after processing completes       | `Promise.allSettled`, `fs.rm` |

---

## Project Structure

```
.
├── src/
│   ├── index.ts         # Express server
│   ├── worker.ts        # Worker thread for thumbnail generation
│   ├── mutex.ts         # Mutex abstraction
│   └── utils.ts         # Utility functions
├── tmp/                 # Temporary directory (gitignored)
├── package.json
└── README.md
```

---

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Or directly:

```bash
ts-node src/index.ts
```

---

## Test with CURL

```bash
curl -X POST http://localhost:3000/zip \
  -F "file=@./images.zip"
```

---

## Dependencies

- `express`
- `multer`
- `adm-zip`
- `sharp`
- `async-mutex`
- `worker_threads`
- `fs/promises`
