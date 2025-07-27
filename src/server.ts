import express from 'express';
import http from "node:http";
import multer from 'multer';
import { UnzipUtil } from "./utils";
import { nanoid } from "nanoid";

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
    console.log('Uploaded file:', req.file?.path);
    const requestId = nanoid();

    await zipService.extract(req.file?.path!, requestId);
    await zipService.cleanup(requestId);
    res.json({message: 'File uploaded successfully', file: req.file});
});

const server = http.createServer(app);

server.listen(3000, () =>
    console.log(`API ready on http://localhost:3000`),
);
