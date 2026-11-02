import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError.js';
import cloudinary from '../config/cloudinary.js';

// Ensure uploads folder exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `resource-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.zip'];

  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Unsupported file format. Please upload PDF, Word (.doc/.docx), PowerPoint (.ppt/.pptx), or text files.'
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit
  },
});

// Helper to upload to Cloudinary or use local static URL fallback
export const processFileUpload = async (file) => {
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes('your_');

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
        folder: 'lostlecture_academic_resources',
      });
      // Delete temporary local file
      fs.unlink(file.path, () => {});
      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.originalname,
      };
    } catch (err) {
      console.warn('[Cloudinary Upload Fallback] Using local file path:', err.message);
    }
  }

  // Local file serving fallback
  const localUrl = `/uploads/${path.basename(file.path)}`;
  return {
    url: localUrl,
    publicId: null,
    fileName: file.originalname,
  };
};

