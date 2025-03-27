import multer from "multer";
import fs from "fs";
import path from "path";
const uploadPath = path.join(process.cwd(), "tmp", "uploads");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname); // Get file extension safely
        cb(null, `file${uniqueSuffix}${extension}`);
    }
});
export const upload = multer({ storage: storage });
