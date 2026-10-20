import { Router } from 'express';
import { WishlistController } from '../../controllers/wishlist.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', WishlistController.getWishlist);
router.post('/:productId', WishlistController.addWishlist);
router.delete('/:productId', WishlistController.removeWishlist);

export default router;
