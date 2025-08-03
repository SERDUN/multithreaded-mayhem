import { workerData } from 'worker_threads';
import sharp from 'sharp';
import { Mutex } from "../utils";

interface WorkerData {
    inputPath: string;
    outputPath: string;
    globalStatistics: SharedArrayBuffer;
    globalMutex: SharedArrayBuffer;
}

const {inputPath, outputPath, globalStatistics, globalMutex} = workerData as WorkerData;

const statistics = new Int32Array(globalStatistics);
const mutex = new Mutex(globalMutex);

(async () => {
    let success = false;

    try {
        await sharp(inputPath).resize({width: 150}).toFile(outputPath);
        success = true;
    } catch {
        success = false;
    }

    mutex.lock();

    if (success) {
        Atomics.add(statistics, 0, 1);
    } else {
        Atomics.add(statistics, 1, 1);
    }
    mutex.unlock();

    process.exit(0);
})();