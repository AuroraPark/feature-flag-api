import { Router, RequestHandler } from 'express';
import flagController from './flag.controller';
import { validate, validateQuery } from '../../middlewares/validate';
import { createFlagSchema, updateFlagSchema, listFlagsQuerySchema } from './flag.validator';
import { listAuditQuerySchema } from '../audit/audit.validator';
import auditController from '../audit/audit.controller';

const router = Router();

router.post('/', validate(createFlagSchema), flagController.create as RequestHandler);
router.get('/', validateQuery(listFlagsQuerySchema), flagController.findAll as RequestHandler);
router.get('/:key', flagController.findByKey as RequestHandler);
router.patch('/:key', validate(updateFlagSchema), flagController.update as RequestHandler);
router.post('/:key/toggle', flagController.toggle as RequestHandler);
router.delete('/:key', flagController.delete as RequestHandler);

router.get(
    '/:key/audit',
    validateQuery(listAuditQuerySchema),
    auditController.findByFlag.bind(auditController) as unknown as RequestHandler
);


export default router;