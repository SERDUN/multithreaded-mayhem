export class Mutex {
    private lockShared: Int32Array;
    public readonly buffer: SharedArrayBuffer;

    constructor(buffer: SharedArrayBuffer = new SharedArrayBuffer(4)) {
        this.buffer = buffer;
        this.lockShared = new Int32Array(this.buffer);
    }

    lock() {
        while (true) {
            if (Atomics.compareExchange(this.lockShared, 0, 0, 1) === 0) return;
            Atomics.wait(this.lockShared, 0, 1);
        }
    }

    unlock() {
        Atomics.store(this.lockShared, 0, 0);
        Atomics.notify(this.lockShared, 0);
    }
}
