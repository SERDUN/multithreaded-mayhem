import path from 'path';
import fs from 'node:fs/promises';
import AdmZip from 'adm-zip';

export class UnzipUtil {
    constructor(private readonly baseTmpDir: string = '/tmp') {
    }

    async extract(zipPath: string, requestId: string): Promise<void> {
        const tmpDir = this.getDirPath(requestId);
        console.log(`Extracting ${tmpDir}`);

        await this.createTmpDir(tmpDir);
        await this.extractZip(zipPath, tmpDir);
    }

    async cleanup(requestId: string): Promise<void> {
        const tmpDir = this.getDirPath(requestId);
        await this.removeDir(tmpDir);
    }

    private getDirPath(requestId: string): string {
        return path.join(process.cwd(), 'tmp', requestId);
    }

    private async createTmpDir(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, {recursive: true});
            console.log("Directory created:", dirPath);
        } catch (err) {
            console.error("Failed to create directory:", err);
        }
    }

    private async extractZip(zipPath: string, outputDir: string): Promise<void> {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(outputDir, true);
    }

    private async removeDir(dirPath: string): Promise<void> {
        await fs.rm(dirPath, {recursive: true, force: true});
        console.log(`Removed temp dir ${dirPath}`);
    }
}
