import * as os from "node:os";

let maxConcurrency: number = os.availableParallelism?.() ?? os.cpus().length;

let activeWorkers = 0;
const queue: (() => void)[] = [];

export function setConcurrencyLimit(forceConcurrency: number) {
    if (forceConcurrency > 0) {
        maxConcurrency = forceConcurrency;
        console.log(`MAX_CONCURRENCY manually set to: ${maxConcurrency}`);
    }
}

export function runWithConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        const execute = () => {
            activeWorkers++;

            fn()
                .then(resolve)
                .catch(reject)
                .finally(() => {
                    activeWorkers--;
                    if (queue.length > 0) {
                        const next = queue.shift();
                        next?.();
                    }
                });
        };

        if (activeWorkers < maxConcurrency) {
            execute();
        } else {
            queue.push(execute);
        }
    });
}
