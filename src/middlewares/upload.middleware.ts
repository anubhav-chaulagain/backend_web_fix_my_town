import multer from "multer";
import uuid from "uuid";
import path from "path";
import fs from "fs";
import { Request} from "express";
import { HttpError } from "../errors/http-error";

// Ensure the uploads directory exists
// __dirname = current directory of this file
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) { //cb- callback
        cb(null, uploadDir); // error, destination path
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${uuid.v4()}${ext}`;
        cb(null, filename);
    }
});
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new HttpError(400, 'Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
}

const upload = multer(
    {
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
    }
)

export const uploads = {
    single: (fieldName: string) => upload.single(fieldName),
    array: (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount),
    fields: (fields: { name: string; maxCount?: number }[]) => upload.fields(fields)
}