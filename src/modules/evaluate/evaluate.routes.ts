import { Router } from 'express';
import evaluateController from './evaluate.controller';
import { validate } from '../../middlewares/validate';
import { evaluateSchema, bulkEvaluateSchema } from './evaluate.validator';

const router = Router();

router.post('/', validate(evaluateSchema), evaluateController.evaluate);
router.post('/bulk', validate(bulkEvaluateSchema), evaluateController.bulkEvaluate);

export default router;