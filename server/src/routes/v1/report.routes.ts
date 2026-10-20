import { Router } from 'express';
import { ReportController } from '../../controllers/report.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createReportSchema } from '../../../../shared/schemas/report.schema';

const router = Router();
router.post('/', authenticate, validate(createReportSchema), ReportController.createReport);
export default router;
