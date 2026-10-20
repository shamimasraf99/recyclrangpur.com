import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { SessionModel } from '../models/session.model';
import { hashPassword, verifyPassword, generateSecureToken, hashToken } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '../utils/cookies';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { fullName, email, phoneNumber, password, preferredLanguage } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmailOrPhone(email);
      if (existingUser) {
        return sendError(res, 'USER_EXISTS', 'এই ইমেইল ঠিকানা দিয়ে ইতিমধ্যে একটি একাউন্ট রয়েছে', 409);
      }

      const existingPhone = await UserModel.findByEmailOrPhone(phoneNumber);
      if (existingPhone) {
        return sendError(res, 'PHONE_EXISTS', 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি একাউন্ট রয়েছে', 409);
      }

      const passwordHash = await hashPassword(password);
      const userId = await UserModel.create({
        fullName,
        email,
        phoneNumber,
        passwordHash,
        preferredLanguage
      });

      const user = await UserModel.findById(userId);
      if (!user) {
        return sendError(res, 'CREATION_FAILED', 'User creation failed', 500);
      }

      const roles = user.role_names ? user.role_names.split(',') : ['user'];
      const permissions = user.permission_codes ? user.permission_codes.split(',') : [];

      const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        roles,
        permissions
      });

      // Issue rotating refresh token
      const rawRefreshToken = generateSecureToken();
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await SessionModel.createSession({
        userId: user.id,
        tokenHash,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || null,
        expiresAt
      });

      res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, {
        ...getRefreshCookieOptions(expiresAt),
        httpOnly: true,
        sameSite: 'strict'
      });

      return sendSuccess(
        res,
        {
          user: {
            id: user.id,
            uuid: user.uuid,
            fullName: user.full_name,
            email: user.email,
            phoneNumber: user.phone_number,
            roles,
            permissions
          },
          accessToken
        },
        'রেজিস্ট্রেশন সফল হয়েছে',
        undefined,
        201
      );
    } catch (err: any) {
      console.error('[REGISTER_ERROR]', err);
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { identifier, password } = req.body;

      const user = await UserModel.findByEmailOrPhone(identifier);
      if (!user) {
        return sendError(res, 'INVALID_CREDENTIALS', 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড', 401);
      }

      if (user.is_suspended) {
        return sendError(res, 'ACCOUNT_SUSPENDED', 'আপনার একাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে', 403);
      }

      const isMatch = await verifyPassword(password, user.password_hash);
      if (!isMatch) {
        return sendError(res, 'INVALID_CREDENTIALS', 'ভুল ইমেইল/ফোন অথবা পাসওয়ার্ড', 401);
      }

      const roles = user.role_names ? user.role_names.split(',') : ['user'];
      const permissions = user.permission_codes ? user.permission_codes.split(',') : [];

      const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        roles,
        permissions
      });

      // Issue rotating refresh token
      const rawRefreshToken = generateSecureToken();
      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await SessionModel.createSession({
        userId: user.id,
        tokenHash,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || null,
        expiresAt
      });

      res.cookie(REFRESH_COOKIE_NAME, rawRefreshToken, getRefreshCookieOptions(expiresAt));

      return sendSuccess(res, {
        user: {
          id: user.id,
          uuid: user.uuid,
          fullName: user.full_name,
          email: user.email,
          phoneNumber: user.phone_number,
          avatarUrl: user.avatar_url,
          roles,
          permissions
        },
        accessToken
      }, 'লগইন সফল হয়েছে');
    } catch (err: any) {
      console.error('[LOGIN_ERROR]', err);
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.bikroybd_refresh;
      if (!refreshToken) {
        return sendError(res, 'UNAUTHORIZED', 'রিফ্রেশ টোকেন পাওয়া যায়নি', 401);
      }

      const tokenHash = hashToken(refreshToken);
      const rawSession = await SessionModel.findSessionAnyState(tokenHash);

      // Token Reuse Detection: if a previously revoked token is presented, revoke all user sessions
      if (rawSession && rawSession.is_revoked) {
        await SessionModel.revokeAllUserSessions(rawSession.user_id);
        res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
        return sendError(res, 'TOKEN_REUSE_DETECTED', 'নিরাপত্তা সতর্কতা: টোকেনটি ইতিমধ্যে ব্যবহৃত হয়েছে। সকল সেশন বাতিল করা হয়েছে।', 401);
      }

      const session = await SessionModel.findSession(tokenHash);

      if (!session) {
        res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
        return sendError(res, 'INVALID_SESSION', 'সেশন অবৈধ বা মেয়াদোত্তীর্ণ হয়েছে', 401);
      }

      const user = await UserModel.findById(session.user_id);
      if (!user || user.is_suspended) {
        return sendError(res, 'FORBIDDEN', 'ইউজার অনুপলব্ধ বা স্থগিত', 403);
      }

      // Rotate token
      await SessionModel.revokeSession(tokenHash);
      const newRefreshToken = generateSecureToken();
      const newTokenHash = hashToken(newRefreshToken);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await SessionModel.createSession({
        userId: user.id,
        tokenHash: newTokenHash,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || null,
        expiresAt
      });

      const roles = user.role_names ? user.role_names.split(',') : ['user'];
      const permissions = user.permission_codes ? user.permission_codes.split(',') : [];

      const newAccessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        roles,
        permissions
      });

      res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions(expiresAt));

      return sendSuccess(res, { accessToken: newAccessToken });
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.bikroybd_refresh;
      if (refreshToken) {
        const tokenHash = hashToken(refreshToken);
        await SessionModel.revokeSession(tokenHash);
      }
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      return sendSuccess(res, null, 'সফলভাবে লগআউট হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    return sendSuccess(res, req.user);
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'UNAUTHORIZED', 'Login required', 401);
      await UserModel.updateProfile(req.user.id, req.body);
      const updated = await UserModel.findById(req.user.id);
      return sendSuccess(res, updated, 'প্রোফাইল আপডেট হয়েছে');
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }
}
