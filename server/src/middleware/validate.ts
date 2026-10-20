import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

export function validate(schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return sendError(res, 'VALIDATION_ERROR', 'প্রদত্ত তথ্যে ভুল রয়েছে / Validation error', 422, details);
      }
      return next(err);
    }
  };
}
