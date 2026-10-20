import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import locationRoutes from './location.routes';
import wishlistRoutes from './wishlist.routes';
import reportRoutes from './report.routes';
import moderationRoutes from './moderation.routes';
import adminRoutes from './admin.routes';
import sellerRoutes from './seller.routes';
import mediaRoutes from './media.routes';
import notificationRoutes from './notification.routes';
import { HealthController } from '../../controllers/health.controller';

const router = Router();

// Health & Readiness Check Endpoints
router.get('/health', HealthController.check);
router.get('/health/ready', HealthController.ready);

// Public Site Settings & Banners
import { AdminController } from '../../controllers/admin.controller';
router.get('/settings/public', AdminController.getPublicSettings);
router.get('/banners', AdminController.listBanners);

// Domain Routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/seller', sellerRoutes);
router.use('/media', mediaRoutes);
router.use('/notifications', notificationRoutes);
router.use('/categories', categoryRoutes);
router.use('/locations', locationRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/reports', reportRoutes);
router.use('/moderation', moderationRoutes);
router.use('/admin', adminRoutes);

export default router;
