import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError.js';
import cloudinary from '../config/cloudinary.js';

// Ensure uploads folder exists
export const uploadDir = path.resolve('uploads');
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

export const storage = multer.diskStorage({
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

/**
 * Safely deletes a temporary uploaded file strictly contained within the controlled upload directory.
 * - Prevents parent traversal (../), deep traversal, and sibling directory bypasses.
 * - Avoids false positives from valid filenames that happen to start with '..'.
 * - Verifies real paths to prevent symlink traversal to external locations.
 * - If target is a symlink pointing inside uploads, unlinks the symlink itself rather than its target.
 * - Never deletes directories or files outside the configured upload directory.
 *
 * @param {string} filePath - Path of the uploaded file to delete.
 * @returns {boolean} - True if file or internal symlink was successfully deleted; false otherwise.
 */
export const safeDeleteUpload = (filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  try {
    const resolvedBase = path.resolve(uploadDir);
    const resolvedTarget = path.resolve(filePath);

    // Lexical containment validation using path.relative()
    const relative = path.relative(resolvedBase, resolvedTarget);
    if (!relative || path.isAbsolute(relative)) {
      return false;
    }

    // Ensure path does not escape base directory via parent traversal segments ('..')
    const segments = relative.split(/[/\\]/);
    if (segments.includes('..')) {
      console.warn(`[Security] Blocked file deletion outside allowed directory: ${filePath}`);
      return false;
    }

    // Check if the target exists
    if (!fs.existsSync(resolvedTarget)) {
      return false;
    }

    // Inspect target without following symlinks first
    const lstats = fs.lstatSync(resolvedTarget);
    if (lstats.isDirectory()) {
      console.warn(`[Security] Target is a directory, refusing deletion: ${filePath}`);
      return false;
    }

    // Resolve canonical real paths to prevent symlink escapes
    const realBase = fs.existsSync(resolvedBase) ? fs.realpathSync(resolvedBase) : resolvedBase;
    const realTarget = fs.realpathSync(resolvedTarget);
    const realRelative = path.relative(realBase, realTarget);

    if (!realRelative || path.isAbsolute(realRelative)) {
      return false;
    }

    const realSegments = realRelative.split(/[/\\]/);
    if (realSegments.includes('..')) {
      console.warn(`[Security] Blocked symlink traversal attempt: ${filePath}`);
      return false;
    }

    // If target is a symlink pointing inside uploadDir, unlink the symlink itself (resolvedTarget)
    // preserving the target file. If it is a regular file, unlinks the file.
    fs.unlinkSync(resolvedTarget);
    return true;
  } catch (err) {
    console.warn(`[File Cleanup Error]: ${err.message}`);
    return false;
  }
};

export const safeDeleteFile = safeDeleteUpload;

// Helper to upload to Cloudinary or use local static URL fallback
export const processFileUpload = async (file) => {
  if (!file || !file.path) {
    return {
      url: null,
      publicId: null,
      fileName: null,
    };
  }

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
      // Safely delete temporary local file within allowed upload directory
      safeDeleteUpload(file.path);
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

