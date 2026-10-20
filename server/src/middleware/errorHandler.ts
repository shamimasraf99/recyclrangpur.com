import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[SERVER_ERROR]', err);
  }

  // Malformed JSON payload from express.json()
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    return sendError(res, 'MALFORMED_JSON', 'অনুরোধের পেলোড সঠিক JSON ফরম্যাটে নেই / Malformed JSON payload', 400);
  }

  // Payload too large from express.json()
  if (err.type === 'entity.too.large' || err.status === 413) {
    return sendError(res, 'PAYLOAD_TOO_LARGE', 'অনুরোধের আকার সীমা অতিক্রম করেছে / Request payload too large', 413);
  }

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'DUPLICATE_ENTRY', 'তথ্যটি ইতিমধ্যে বিদ্যমান রয়েছে / Duplicate record exists', 409);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(res, 'FOREIGN_KEY_VIOLATION', 'সম্পর্কিত আইডিটি পাওয়া যায়নি / Referenced entity not found', 400);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'FILE_TOO_LARGE', 'ছবির আকার সর্বোচ্চ ৫ মেগাবাইট হতে পারে / File exceeds 5MB limit', 413);
  }

  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 'TOO_MANY_FILES', 'একসাথে সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে / Maximum 5 images allowed', 400);
  }

  return sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production'
      ? 'সার্ভারে অভ্যন্তরীণ সমস্যা দেখা দিয়েছে / Internal server error'
      : err.message || 'Internal server error',
    500
  );
}
