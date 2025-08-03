import express from 'express';
import http from "node:http";
import multer from 'multer';

import path from "path";
import fs from "node:fs/promises";
import { Worker } from 'worker_threads';
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import { Mutex, UnzipUtil } from "./utils";

const workerPath = path.join(__dirname, 'worker/thumbnail.js');

const app = express();

app.use(express.json());

const zipService = new UnzipUtil();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    },
});

const upload = multer({storage});

app.post('/zip', upload.single('file'), async (req, res) => {
    const start = Date.now();

    console.log('Uploaded file:', req.file?.path);
    const requestId = nanoid();

    await zipService.extract(req.file?.path!, requestId);
    const extractPath = zipService.getExtractPath(requestId);

    // Get only JPG files from the extracted directory
    const files = await fs.readdir(extractPath);
    const images = files.filter(f => f.toLowerCase().endsWith('.jpg'));

    // Storage for statistics
    // [processed, skipped]
    const statBuffer = new SharedArrayBuffer(8);
    const statView = new Int32Array(statBuffer);

    const mutex = new Mutex();

    const TIMEOUT_MS = 5000;

    const tasks = images.map(file => {
        const inputPath = path.join(extractPath, file);
        const outputPath = path.join(extractPath, `thumb_${file}`);
        console.log(`Processing ${inputPath} -> ${outputPath}`);

        return new Promise<void>((resolve) => {
            const worker = new Worker(workerPath, {
                workerData: {
                    inputPath,
                    outputPath,
                    globalStatistics: statBuffer,
                    globalMutex: mutex.buffer,
                },
            });

            const timeout = setTimeout(() => {
                console.warn(`Worker timeout for ${file}, terminating...`);
                worker.terminate().then(() => {
                    mutex.lock();
                    Atomics.add(statView, 1, 1);
                    mutex.unlock();
                    resolve();
                });
            }, TIMEOUT_MS);

            worker.on('exit', () => {
                clearTimeout(timeout);
                resolve();
            });

            worker.on('error', (err) => {
                clearTimeout(timeout);
                console.error(`Worker error for ${file}:`, err);

                mutex.lock();
                Atomics.add(statView, 1, 1);
                mutex.unlock();
                resolve();
            });
        });
    });

    await Promise.all(tasks);

    const duration = Date.now() - start;

    await zipService.cleanup(requestId);
    res.json({
        processed: statView[0],
        skipped: statView[1],
        durationMs: duration
    });
});

const server = http.createServer(app);

server.listen(3000, () =>
    console.log(`API ready on http://localhost:3000`),
);
