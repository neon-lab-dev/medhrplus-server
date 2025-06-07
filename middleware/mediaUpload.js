const multer = require("multer");

// Define allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"];

// Configure storage
const storage = multer.memoryStorage();

// File filter functions
const validateMediaType = (allowedTypes) => (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                `Invalid file type for ${file.fieldname}. Allowed types: ${allowedTypes.join(", ")}`
            ),
            false
        );
    }
};

// Create multer upload middleware
const uploadConfig = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024,
    }
});

// Create middleware function for multiple file types
const handleMultiMediaUpload = (req, res, next) => {
    const uploadFields = uploadConfig.fields([
        {
            name: 'image',
            maxCount: 1
        },
        {
            name: 'video',
            maxCount: 1
        }
    ]);

    uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer error handling
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File size too large. Maximum size is 100MB"
                });
            }
            if (err.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({
                    success: false,
                    message: "Too many files uploaded or incorrect field name"
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message
            });
        } else if (err) {
            // Other errors
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Validate file types after successful upload
        if (req.files) {
            if (req.files.image) {
                const imageFile = req.files.image[0];
                if (!ALLOWED_IMAGE_TYPES.includes(imageFile.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`
                    });
                }
            }

            if (req.files.video) {
                const videoFile = req.files.video[0];
                if (!ALLOWED_VIDEO_TYPES.includes(videoFile.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid video type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(", ")}`
                    });
                }
            }
        }

        next();
    });
};

module.exports = handleMultiMediaUpload;