import multer from "multer";
import path from "path";
import fs from "fs";

// Storage dinamis
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ambil nama modul dari route, misal /jenjang, /user
    const moduleName = req.baseUrl.split("/").pop(); // contoh: 'jenjang'
    const uploadPath = path.join("public", moduleName);

    // bikin folder kalau belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // kasih nama unik
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });

export const normalizeFilePath = (req, res, next) => {
  if (req.file) {
    req.file.path = req.file.path.replace(/\\/g, "/"); // jadi public/rps/nama_file.pdf
  }
  next();
};
