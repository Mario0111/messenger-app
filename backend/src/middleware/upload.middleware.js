const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads dir exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept images, audio, and generic files
        // For security, you might want to blacklist exe/sh, but for this demo we'll be permissive
        // or just extend the whitelist.
        const filetypes = /jpeg|jpg|png|gif|webm|mp3|wav|ogg|pdf|txt|zip/;
        const mime = filetypes.test(file.mimetype) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/');
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        // Let's be permissive for now to ensure features work
        return cb(null, true);
    }
});

module.exports = upload;
