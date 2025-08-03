const MAX_CONCURRENCY = 4;

let activeWorkers = 0;
const queue: (() => void)[] = [];

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

        if (activeWorkers < MAX_CONCURRENCY) {
            execute();
        } else {
            queue.push(execute);
        }
    });
}
