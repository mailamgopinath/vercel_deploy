const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "..", "uploads", "employees");
fs.mkdirSync(uploadDirectory, { recursive: true });

const extensionsByMimeType = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};

const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDirectory,
        filename: (req, file, callback) => {
            callback(
                null,
                `${crypto.randomUUID()}${extensionsByMimeType[file.mimetype] || ""}`
            );
        }
    }),
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        if (!extensionsByMimeType[file.mimetype]) {
            return callback(new Error("Upload a JPEG, PNG, or WebP image."));
        }

        return callback(null, true);
    }
});

const uploadEmployeeImage = (req, res, next) => {
    upload.single("profileImage")(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                status: false,
                message:
                    error.code === "LIMIT_FILE_SIZE"
                        ? "Profile images must be 2 MB or smaller."
                        : error.message
            });
        }

        return next();
    });
};

module.exports = uploadEmployeeImage;
