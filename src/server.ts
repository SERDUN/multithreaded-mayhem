import express from 'express';
import http from "node:http";
import multer from 'multer';

const app = express();

app.use(express.json());

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

app.post('/zip', upload.single('file'), (req, res) => {
    console.log('Uploaded file:', req.file);
    res.json({message: 'File uploaded successfully', file: req.file});
});

const server = http.createServer(app);

server.listen(3000, () =>
    console.log(`API ready on http://localhost:3000`),
);
