import { CookieOptions } from 'express';
import { env, EnvConfig } from '../config/env';

export const REFRESH_COOKIE_NAME = 'bikroybd_refresh';

/**
 * Generates consistent, hardened cookie options for issuing or clearing the refresh token cookie.
 * Ensures HttpOnly, SameSite, Secure (in production or when explicitly enabled), and strict path scoping.
 */
export function getRefreshCookieOptions(expiresAt?: Date, config: EnvConfig = env): CookieOptions {
  const isSecure = config.COOKIE_SECURE !== undefined ? config.COOKIE_SECURE : config.NODE_ENV === 'production';

  const options: CookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: config.COOKIE_SAME_SITE,
    path: `${config.API_PREFIX}/auth`
  };

  if (config.COOKIE_DOMAIN && config.COOKIE_DOMAIN.trim().length > 0) {
    options.domain = config.COOKIE_DOMAIN.trim();
  }

  if (expiresAt) {
    options.expires = expiresAt;
  }

  return options;
}
