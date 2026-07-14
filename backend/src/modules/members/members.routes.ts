import { Router } from 'express';
import { MemberController } from '@/modules/members/members.controller';
import {
  createMemberSchema,
  updateMemberSchema,
  listMembersSchema,
  memberIdSchema,
} from '@/modules/members/members.validation';
import { authenticate, requireGym, requirePermission, validate, asyncHandler } from '@/shared/middleware';
import { Permission } from '@/shared/rbac';

const router = Router();

// Every member route requires an authenticated, gym-scoped user.
router.use(authenticate, requireGym);

router.get(
  '/',
  requirePermission(Permission.MEMBER_READ),
  validate(listMembersSchema),
  asyncHandler(MemberController.list),
);

router.post(
  '/',
  requirePermission(Permission.MEMBER_CREATE),
  validate(createMemberSchema),
  asyncHandler(MemberController.create),
);

router.get(
  '/:id',
  requirePermission(Permission.MEMBER_READ),
  validate(memberIdSchema),
  asyncHandler(MemberController.getById),
);

router.patch(
  '/:id',
  requirePermission(Permission.MEMBER_UPDATE),
  validate(updateMemberSchema),
  asyncHandler(MemberController.update),
);

router.delete(
  '/:id',
  requirePermission(Permission.MEMBER_DELETE),
  validate(memberIdSchema),
  asyncHandler(MemberController.remove),
);

export default router;
