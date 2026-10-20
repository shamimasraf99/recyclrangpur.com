import { Router } from 'express';
import { LocationController } from '../../controllers/location.controller';

const router = Router();
router.get('/divisions', LocationController.getDivisions);
router.get('/districts', LocationController.getDistricts);
router.get('/upazilas', LocationController.getUpazilas);
export default router;
