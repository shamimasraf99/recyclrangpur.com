import { Router } from 'express';
import multer from 'multer';
import { MediaController } from '../../controllers/media.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { sendError } from '../../utils/apiResponse';

const router = Router();
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per image
    files: 5 // Max 5 images per request
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      const err: any = new Error(`Invalid MIME type: ${file.mimetype}`);
      err.code = 'INVALID_MIME_TYPE';
      return cb(err);
    }
    cb(null, true);
  }
});

router.post(
  '/upload',
  authenticate,
  requirePermission('listings:create'),
  (req, res, next) => {
    upload.array('images', 5)(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'FILE_TOO_LARGE', 'ছবির আকার সর্বোচ্চ ৫ মেগাবাইট হতে পারে / File exceeds 5MB limit', 413);
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(res, 'TOO_MANY_FILES', 'একসাথে সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে / Maximum 5 images allowed', 400);
        }
        if (err.code === 'INVALID_MIME_TYPE') {
          return sendError(res, 'INVALID_FILE_TYPE', 'শুধুমাত্র JPG, PNG বা WEBP ছবি আপলোড করা যাবে / Only JPG, PNG, or WEBP allowed', 415);
        }
        return next(err);
      }
      return next();
    });
  },
  MediaController.uploadImages
);

export default router;
