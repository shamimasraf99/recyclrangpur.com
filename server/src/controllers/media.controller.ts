import { Request, Response } from 'express';
import sharp from 'sharp';
import crypto from 'crypto';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { env } from '../config/env';

let cloudinary: any = null;
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET
    });
  } catch (e) {
    console.warn('[MEDIA] Cloudinary library init fallback');
  }
}

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export class MediaController {
  static async uploadImages(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return sendError(res, 'NO_FILES', 'কমপক্ষে ১টি ছবি নির্বাচন করুন / At least 1 image required', 400);
      }

      if (files.length > 5) {
        return sendError(res, 'TOO_MANY_FILES', 'একসাথে সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে / Maximum 5 images allowed', 400);
      }

      const results = [];

      for (const file of files) {
        if (file.size > MAX_FILE_BYTES || (file.buffer && file.buffer.length > MAX_FILE_BYTES)) {
          return sendError(res, 'FILE_TOO_LARGE', 'ছবির আকার সর্বোচ্চ ৫ মেগাবাইট হতে পারে / File exceeds 5MB limit', 413);
        }

        if (file.mimetype && !ALLOWED_MIMES.has(file.mimetype.toLowerCase())) {
          return sendError(
            res,
            'INVALID_FILE_TYPE',
            `অবৈধ ফাইলের ধরন (${file.mimetype})। শুধুমাত্র JPG, PNG বা WEBP গ্রহণযোগ্য`,
            415
          );
        }

        // Magic byte verification for JPEG, PNG, WEBP (prevents spoofed file extensions/MIME headers)
        const buffer = file.buffer;
        const isJpeg =
          buffer &&
          buffer.length > 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff;
        const isPng =
          buffer &&
          buffer.length > 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47;
        const isWebp =
          buffer &&
          buffer.length > 12 &&
          buffer.toString('ascii', 0, 4) === 'RIFF' &&
          buffer.toString('ascii', 8, 12) === 'WEBP';

        if (!isJpeg && !isPng && !isWebp) {
          return sendError(
            res,
            'INVALID_FILE_TYPE',
            `অবৈধ ফাইলের ধরন: ${file.originalname}। শুধুমাত্র বৈধ JPG, PNG বা WEBP ছবি গ্রহণযোগ্য`,
            415
          );
        }

        let optimizedBuffer: Buffer;
        let thumbnailBuffer: Buffer;

        try {
          // Process with Sharp: strip EXIF GPS location, guard against pixel bombs (max 25MP), auto-rotate, resize
          optimizedBuffer = await sharp(buffer, { limitInputPixels: 25_000_000 })
            .rotate()
            .resize({ width: 1280, height: 960, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

          thumbnailBuffer = await sharp(buffer, { limitInputPixels: 25_000_000 })
            .rotate()
            .resize({ width: 400, height: 300, fit: 'cover' })
            .webp({ quality: 75 })
            .toBuffer();
        } catch {
          return sendError(
            res,
            'INVALID_IMAGE_CONTENT',
            `ছবিটি ত্রুটিপূর্ণ বা প্রসেস করা সম্ভব হয়নি: ${file.originalname}`,
            415
          );
        }

        let uploadedToCloud = false;
        if (cloudinary) {
          try {
            const publicId = `bikroybd_${crypto.randomUUID()}`;
            const uploadResult = await new Promise<any>((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { public_id: publicId, folder: 'bikroybd_products', format: 'webp' },
                (err: any, result: any) => {
                  if (err) reject(err);
                  else resolve(result);
                }
              );
              stream.end(optimizedBuffer);
            });

            results.push({
              url: uploadResult.secure_url,
              thumbnailUrl: uploadResult.secure_url.replace('/upload/', '/upload/c_thumb,w_400,h_300/'),
              publicId: uploadResult.public_id
            });
            uploadedToCloud = true;
          } catch (cloudErr) {
            console.warn('[MEDIA] External storage service failed, falling back to local WebP encoding:', cloudErr);
          }
        }

        if (!uploadedToCloud) {
          // Local/fallback environment: encode as WebP Data URI
          const base64Url = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;
          const thumbUrl = `data:image/webp;base64,${thumbnailBuffer.toString('base64')}`;
          results.push({
            url: base64Url,
            thumbnailUrl: thumbUrl,
            publicId: `local_${crypto.randomUUID()}`
          });
        }
      }

      return sendSuccess(res, { images: results }, 'ছবি সফলভাবে প্রসেস ও আপলোড হয়েছে');
    } catch (err: any) {
      return sendError(res, 'UPLOAD_ERROR', err.message || 'Media processing error', 500);
    }
  }
}
