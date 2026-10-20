import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../../../../shared/schemas/auth.schema';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

router.get('/me', authenticate, AuthController.me);
router.put('/profile', authenticate, AuthController.updateProfile);

export default router;
