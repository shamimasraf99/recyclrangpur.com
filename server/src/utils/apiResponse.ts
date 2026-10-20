import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  meta?: any,
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any[]
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    }
  });
}
