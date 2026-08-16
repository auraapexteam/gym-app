/**
 * Aura Apex – OpenAPI 3.1 specification builder.
 *
 * Every endpoint, request shape, response shape, error code, and role
 * permission is registered here. The frontend team should never need to
 * read backend source code to understand the API.
 */
import { OpenApiGeneratorV31, OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend zod with .openapi() method
extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ─── Reusable schemas ──────────────────────────────────────────────────────

const UuidSchema = z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

const PaginationQuery = z.object({
  page:   z.string().optional().openapi({ example: '1' }),
  limit:  z.string().optional().openapi({ example: '20' }),
  sort:   z.string().optional().openapi({ example: 'created_at' }),
  order:  z.enum(['asc', 'desc']).optional().openapi({ example: 'desc' }),
  search: z.string().optional(),
}).openapi('PaginationQuery');

const PaginatedMeta = z.object({
  page:  z.number(),
  limit: z.number(),
  total: z.number(),
}).openapi('PaginatedMeta');

const SuccessEnvelope = (dataSchema: z.ZodTypeAny, name: string) =>
  z.object({ success: z.literal(true), data: dataSchema }).openapi(name);

const ErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
  error:   z.object({ code: z.string(), details: z.unknown().optional() }),
}).openapi('ErrorResponse');

// ─── Register security schemes ─────────────────────────────────────────────

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Supabase access token returned by /auth/login or /auth/register',
});

// ─── Common error responses ────────────────────────────────────────────────

const errorResponses = {
  400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponse } } },
  401: { description: 'Unauthenticated',   content: { 'application/json': { schema: ErrorResponse } } },
  403: { description: 'Forbidden — insufficient role', content: { 'application/json': { schema: ErrorResponse } } },
  404: { description: 'Resource not found', content: { 'application/json': { schema: ErrorResponse } } },
  409: { description: 'Conflict (duplicate record)', content: { 'application/json': { schema: ErrorResponse } } },
  422: { description: 'Unprocessable entity', content: { 'application/json': { schema: ErrorResponse } } },
  429: { description: 'Rate limit exceeded',  content: { 'application/json': { schema: ErrorResponse } } },
  500: { description: 'Internal server error', content: { 'application/json': { schema: ErrorResponse } } },
};

const auth = [{ BearerAuth: [] }];

// ─── Domain schemas ────────────────────────────────────────────────────────

const ProfileSchema = registry.register('Profile', z.object({
  id:        UuidSchema,
  email:     z.string().email(),
  fullName:  z.string().nullable(),
  phone:     z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role:      z.enum(['customer', 'owner', 'staff', 'trainer', 'super_admin']),
  gymId:     UuidSchema.nullable(),
  status:    z.enum(['active', 'inactive', 'suspended', 'pending']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Profile'));

const SessionSchema = registry.register('Session', z.object({
  accessToken:  z.string(),
  refreshToken: z.string(),
  expiresAt:    z.number(),
}).openapi('Session'));

const GymSchema = registry.register('Gym', z.object({
  id:          UuidSchema,
  name:        z.string(),
  slug:        z.string().nullable(),
  email:       z.string().nullable(),
  phone:       z.string().nullable(),
  address:     z.string().nullable(),
  description: z.string().nullable(),
  logoUrl:     z.string().nullable(),
  status:      z.enum(['active', 'suspended', 'pending']),
  timings:     z.record(z.string(), z.unknown()),
  weeklyOff:   z.array(z.string()),
  settings:    z.record(z.string(), z.unknown()),
  ownerId:     UuidSchema.nullable(),
  createdAt:   z.string().datetime(),
  updatedAt:   z.string().datetime(),
}).openapi('Gym'));

const MemberSchema = registry.register('Member', z.object({
  id:               UuidSchema,
  gymId:            UuidSchema,
  profileId:        UuidSchema.nullable(),
  fullName:         z.string(),
  email:            z.string().nullable(),
  phone:            z.string().nullable(),
  gender:           z.enum(['male', 'female', 'other']).nullable(),
  status:           z.enum(['active', 'inactive', 'suspended']),
  joinedAt:         z.string().datetime(),
  createdAt:        z.string().datetime(),
  updatedAt:        z.string().datetime(),
}).openapi('Member'));

const PlanSchema = registry.register('Plan', z.object({
  id:           UuidSchema,
  gymId:        UuidSchema,
  name:         z.string(),
  description:  z.string().nullable(),
  price:        z.number(),
  durationDays: z.number(),
  features:     z.array(z.string()),
  isActive:     z.boolean(),
  createdAt:    z.string().datetime(),
  updatedAt:    z.string().datetime(),
}).openapi('Plan'));

const SubscriptionSchema = registry.register('Subscription', z.object({
  id:         UuidSchema,
  gymId:      UuidSchema,
  memberId:   UuidSchema,
  planId:     UuidSchema,
  status:     z.enum(['pending', 'active', 'expired', 'cancelled']),
  startDate:  z.string().datetime().nullable(),
  endDate:    z.string().datetime().nullable(),
  autoRenew:  z.boolean(),
  createdAt:  z.string().datetime(),
  updatedAt:  z.string().datetime(),
}).openapi('Subscription'));

const PaymentSchema = registry.register('Payment', z.object({
  id:                UuidSchema,
  gymId:             UuidSchema,
  subscriptionId:    UuidSchema.nullable(),
  memberId:          UuidSchema.nullable(),
  amount:            z.number(),
  currency:          z.string(),
  status:            z.enum(['created', 'pending', 'success', 'failed', 'refunded']),
  method:            z.enum(['card', 'upi', 'netbanking', 'wallet', 'cash', 'other']).nullable(),
  razorpayOrderId:   z.string().nullable(),
  razorpayPaymentId: z.string().nullable(),
  paidAt:            z.string().datetime().nullable(),
  createdAt:         z.string().datetime(),
  updatedAt:         z.string().datetime(),
}).openapi('Payment'));

const AttendanceSchema = registry.register('Attendance', z.object({
  id:             UuidSchema,
  gymId:          UuidSchema,
  memberId:       UuidSchema,
  method:         z.enum(['qr', 'manual']),
  status:         z.enum(['success', 'failed']),
  attendanceDate: z.string(),
  checkedInAt:    z.string().datetime(),
  checkedOutAt:   z.string().datetime().nullable(),
  createdAt:      z.string().datetime(),
}).openapi('Attendance'));

const TrainerSchema = registry.register('Trainer', z.object({
  id:             UuidSchema,
  gymId:          UuidSchema,
  profileId:      UuidSchema.nullable(),
  fullName:       z.string(),
  specialization: z.string().nullable(),
  bio:            z.string().nullable(),
  phone:          z.string().nullable(),
  email:          z.string().nullable(),
  imageUrl:       z.string().nullable(),
  status:         z.enum(['active', 'inactive']),
  createdAt:      z.string().datetime(),
  updatedAt:      z.string().datetime(),
}).openapi('Trainer'));

const EquipmentSchema = registry.register('Equipment', z.object({
  id:             UuidSchema,
  gymId:          UuidSchema,
  name:           z.string(),
  category:       z.string().nullable(),
  description:    z.string().nullable(),
  quantity:       z.number(),
  condition:      z.enum(['excellent', 'good', 'fair', 'poor']),
  status:         z.enum(['operational', 'maintenance', 'retired']),
  imageUrl:       z.string().nullable(),
  purchasedAt:    z.string().nullable(),
  createdAt:      z.string().datetime(),
  updatedAt:      z.string().datetime(),
}).openapi('Equipment'));

const NotificationSchema = registry.register('Notification', z.object({
  id:          UuidSchema,
  gymId:       UuidSchema.nullable(),
  recipientId: UuidSchema,
  title:       z.string(),
  body:        z.string().nullable(),
  type:        z.enum(['info', 'payment', 'membership', 'attendance', 'system', 'promotion']),
  isRead:      z.boolean(),
  readAt:      z.string().datetime().nullable(),
  createdAt:   z.string().datetime(),
}).openapi('Notification'));

const AuditLogSchema = registry.register('AuditLog', z.object({
  id:           UuidSchema,
  actorId:      UuidSchema.nullable(),
  actorRole:    z.string().nullable(),
  gymId:        UuidSchema.nullable(),
  action:       z.string(),
  resourceType: z.string(),
  resourceId:   UuidSchema.nullable(),
  result:       z.string(),
  ipAddress:    z.string().nullable(),
  createdAt:    z.string().datetime(),
}).openapi('AuditLog'));

const SavedGymSchema = registry.register('SavedGym', z.object({
  id:           UuidSchema,
  name:         z.string(),
  slug:         z.string().nullable().optional(),
  address:      z.string().nullable().optional(),
  description:  z.string().nullable().optional(),
  logoUrl:      z.string().nullable().optional(),
  imageUrl:     z.string().nullable().optional(),
  rating:       z.number().optional(),
  monthlyPrice: z.number().nullable().optional(),
  timings:      z.record(z.string(), z.unknown()).optional(),
  weeklyOff:    z.array(z.string()).optional(),
  status:       z.enum(['active', 'suspended', 'pending']).optional(),
  savedAt:      z.string().optional(),
}).openapi('SavedGym'));

const WorkoutLogSchema = registry.register('WorkoutLog', z.object({
  id:             UuidSchema,
  workoutName:    z.string(),
  category:       z.string(),
  durationMin:    z.number(),
  caloriesBurned: z.number(),
  exercisesCount: z.number(),
  exercises:      z.array(z.object({
    name:     z.string(),
    sets:     z.number().optional(),
    reps:     z.number().optional(),
    weightKg: z.number().optional(),
    notes:    z.string().optional(),
  })),
  logDate:        z.string(),
  createdAt:      z.string().datetime(),
  updatedAt:      z.string().datetime(),
}).openapi('WorkoutLog'));

// ─── Auth routes ────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post', path: '/auth/register', tags: ['Auth'],
  summary: 'Self-service customer registration',
  request: { body: { content: { 'application/json': { schema: z.object({
    email:    z.string().email(),
    password: z.string().min(8),
    fullName: z.string(),
    phone:    z.string().optional(),
  }) } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: SuccessEnvelope(z.object({ session: SessionSchema, profile: ProfileSchema }), 'AuthResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/auth/login', tags: ['Auth'],
  summary: 'Email/password login',
  request: { body: { content: { 'application/json': { schema: z.object({
    email:    z.string().email(),
    password: z.string(),
  }) } } } },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ session: SessionSchema, profile: ProfileSchema }), 'LoginResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/auth/phone-otp', tags: ['Auth'],
  summary: 'Trigger SMS OTP code generation for mobile login',
  request: { body: { content: { 'application/json': { schema: z.object({
    phone: z.string().min(8).openapi({ example: '+919876543210' }),
  }) } } } },
  responses: {
    200: { description: 'OTP dispatched', content: { 'application/json': { schema: z.object({ success: z.literal(true), message: z.string() }) } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/auth/verify-otp', tags: ['Auth'],
  summary: 'Verify SMS OTP code and return session tokens + user profile',
  request: { body: { content: { 'application/json': { schema: z.object({
    phone: z.string().min(8).openapi({ example: '+919876543210' }),
    code:  z.string().min(4).openapi({ example: '123456' }),
  }) } } } },
  responses: {
    200: { description: 'Verification successful', content: { 'application/json': { schema: SuccessEnvelope(z.object({ session: SessionSchema, profile: ProfileSchema }), 'PhoneOtpVerifyResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/auth/logout', tags: ['Auth'],
  summary: 'Revoke the current session',
  security: auth,
  responses: { 200: { description: 'Logged out' }, ...errorResponses },
});

registry.registerPath({
  method: 'post', path: '/auth/forgot-password', tags: ['Auth'],
  summary: 'Send a password-reset email (always 200 to prevent enumeration)',
  request: { body: { content: { 'application/json': { schema: z.object({ email: z.string().email() }) } } } },
  responses: { 200: { description: 'Email dispatched if account exists' }, ...errorResponses },
});

registry.registerPath({
  method: 'post', path: '/auth/reset-password', tags: ['Auth'],
  summary: 'Complete password reset with recovery token',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ password: z.string().min(8) }) } } } },
  responses: { 200: { description: 'Password updated' }, ...errorResponses },
});

registry.registerPath({
  method: 'get', path: '/auth/profile', tags: ['Auth'],
  summary: 'Get the authenticated user\'s profile',
  security: auth,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(ProfileSchema, 'ProfileResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'patch', path: '/auth/profile', tags: ['Auth'],
  summary: 'Update the authenticated user\'s profile',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    fullName:  z.string().optional(),
    phone:     z.string().optional(),
    avatarUrl: z.string().optional(),
  }) } } } },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(ProfileSchema, 'ProfileUpdateResult') } } },
    ...errorResponses,
  },
});

// ─── Gym routes ─────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/gyms/directory', tags: ['Gym'],
  summary: 'Public directory of active partner gyms with search and pagination',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(GymSchema), ...PaginatedMeta.shape }), 'GymDirectoryResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/gyms/saved', tags: ['Gym'],
  summary: 'List partner gyms bookmarked/saved by authenticated user',
  security: auth,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.array(SavedGymSchema), 'SavedGymListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/gyms/{id}/bookmark', tags: ['Gym'],
  summary: 'Toggle bookmark status for a gym (saves if not saved, removes if saved)',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'Bookmark toggled', content: { 'application/json': { schema: SuccessEnvelope(z.object({ isSaved: z.boolean(), gymId: UuidSchema }), 'BookmarkToggleResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/gyms/me', tags: ['Gym'],
  summary: 'Get the authenticated owner\'s gym (owner/staff only)',
  security: auth,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(GymSchema, 'GymResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'patch', path: '/gyms/me', tags: ['Gym'],
  summary: 'Update gym details (owner only)',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    name:        z.string().optional(),
    email:       z.string().email().optional(),
    phone:       z.string().optional(),
    address:     z.string().optional(),
    description: z.string().optional(),
    logoUrl:     z.string().optional(),
  }) } } } },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(GymSchema, 'GymUpdateResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/gyms/{id}/public', tags: ['Gym'],
  summary: 'Public gym profile (no auth required)',
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(GymSchema, 'PublicGymResult') } } },
    ...errorResponses,
  },
});

// ─── Members routes ──────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/members', tags: ['Members'],
  summary: 'List gym members (owner/staff)',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(MemberSchema), ...PaginatedMeta.shape }), 'MemberListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/members', tags: ['Members'],
  summary: 'Create a walk-in member (owner/staff)',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    fullName:   z.string(),
    email:      z.string().email().optional(),
    phone:      z.string().optional(),
    gender:     z.enum(['male', 'female', 'other']).optional(),
    dateOfBirth: z.string().optional(),
  }) } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: SuccessEnvelope(MemberSchema, 'MemberCreateResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/members/{id}', tags: ['Members'],
  summary: 'Get a member by ID',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(MemberSchema, 'MemberGetResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'patch', path: '/members/{id}', tags: ['Members'],
  summary: 'Update a member',
  security: auth,
  request: { params: z.object({ id: UuidSchema }), body: { content: { 'application/json': { schema: z.object({ fullName: z.string().optional(), phone: z.string().optional(), status: z.enum(['active','inactive','suspended']).optional() }) } } } },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(MemberSchema, 'MemberUpdateResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'delete', path: '/members/{id}', tags: ['Members'],
  summary: 'Soft-delete a member',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: { 200: { description: 'Deleted' }, ...errorResponses },
});

// ─── Plans routes ────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/plans', tags: ['Plans'],
  summary: 'List membership plans',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(PlanSchema), ...PaginatedMeta.shape }), 'PlanListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/plans', tags: ['Plans'],
  summary: 'Create a membership plan (owner)',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    name:         z.string(),
    description:  z.string().optional(),
    price:        z.number().positive(),
    durationDays: z.number().int().positive(),
    features:     z.array(z.string()).optional(),
  }) } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: SuccessEnvelope(PlanSchema, 'PlanCreateResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/plans/{id}', tags: ['Plans'],
  summary: 'Get a plan by ID',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(PlanSchema, 'PlanGetResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'patch', path: '/plans/{id}', tags: ['Plans'],
  summary: 'Update a plan',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(PlanSchema, 'PlanUpdateResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'delete', path: '/plans/{id}', tags: ['Plans'],
  summary: 'Soft-delete a plan',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: { 200: { description: 'Deleted' }, ...errorResponses },
});

// ─── Subscriptions routes ────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/subscriptions', tags: ['Subscriptions'],
  summary: 'List subscriptions for the gym (owner/staff)',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(SubscriptionSchema), ...PaginatedMeta.shape }), 'SubscriptionListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/subscriptions/manual', tags: ['Subscriptions'],
  summary: 'Create a manual (cash/offline) subscription (owner/staff)',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    memberId: UuidSchema,
    planId:   UuidSchema,
    method:   z.enum(['cash', 'other']).optional(),
  }) } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: SuccessEnvelope(SubscriptionSchema, 'ManualSubscriptionResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/subscriptions/{id}', tags: ['Subscriptions'],
  summary: 'Get a subscription by ID',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(SubscriptionSchema, 'SubscriptionGetResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/subscriptions/me', tags: ['Subscriptions'],
  summary: 'List all active and historical subscriptions for the authenticated customer',
  security: auth,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.array(SubscriptionSchema), 'CustomerSubscriptionsResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/subscriptions/{id}/cancel', tags: ['Subscriptions'],
  summary: 'Cancel an active subscription (Customer self-service or Gym staff/owner)',
  description: 'Allows regular customers to cancel their own membership, or gym staff/owners to manage member cancellations.',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'Cancelled', content: { 'application/json': { schema: SuccessEnvelope(SubscriptionSchema, 'SubscriptionCancelResult') } } },
    ...errorResponses,
  },
});

// ─── Payments routes ─────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/payments', tags: ['Payments'],
  summary: 'List payments for the gym',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(PaymentSchema), ...PaginatedMeta.shape }), 'PaymentListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/payments/order', tags: ['Payments'],
  summary: 'Create a Razorpay order for online checkout (customer)',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ planId: UuidSchema, memberId: UuidSchema }) } } } },
  responses: {
    201: { description: 'Order created', content: { 'application/json': { schema: SuccessEnvelope(z.object({ orderId: z.string(), amount: z.number(), currency: z.string() }), 'PaymentOrderResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/payments/verify', tags: ['Payments'],
  summary: 'Verify a Razorpay payment signature and activate subscription',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    razorpayOrderId:   z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
  }) } } } },
  responses: {
    200: { description: 'Payment verified and subscription activated', content: { 'application/json': { schema: SuccessEnvelope(PaymentSchema, 'PaymentVerifyResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/payments/{id}/refund', tags: ['Payments'],
  summary: 'Refund a successful payment (owner)',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'Refunded', content: { 'application/json': { schema: SuccessEnvelope(PaymentSchema, 'PaymentRefundResult') } } },
    ...errorResponses,
  },
});

// ─── Attendance routes ───────────────────────────────────────────────────────

registry.registerPath({
  method: 'post', path: '/attendance/manual', tags: ['Attendance'],
  summary: 'Record a manual check-in for a member (staff/owner). Returns 409 if already checked in today.',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ memberId: UuidSchema }) } } } },
  responses: {
    201: { description: 'Checked in', content: { 'application/json': { schema: SuccessEnvelope(AttendanceSchema, 'AttendanceResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/attendance/check-in', tags: ['Attendance'],
  summary: 'Customer self check-in via QR token',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ token: z.string().min(1) }) } } } },
  responses: {
    201: { description: 'Checked in', content: { 'application/json': { schema: SuccessEnvelope(AttendanceSchema, 'QrAttendanceResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/attendance', tags: ['Attendance'],
  summary: 'List attendance records (owner/staff)',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(AttendanceSchema), ...PaginatedMeta.shape }), 'AttendanceListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/attendance/stats', tags: ['Attendance'],
  summary: 'Attendance stats for the gym',
  security: auth,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ today: z.number(), last7Days: z.number(), last30Days: z.number() }), 'AttendanceStats') } } },
    ...errorResponses,
  },
});

// ─── QR routes ───────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/qr/active', tags: ['QR'],
  summary: 'Get the active QR code for the gym',
  security: auth,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ id: UuidSchema, token: z.string(), label: z.string().nullable() }), 'QrResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/qr/rotate', tags: ['QR'],
  summary: 'Rotate the gym QR code (revoke current, issue new)',
  security: auth,
  responses: {
    200: { description: 'New QR issued', content: { 'application/json': { schema: SuccessEnvelope(z.object({ id: UuidSchema, token: z.string() }), 'QrRotateResult') } } },
    ...errorResponses,
  },
});

// ─── Trainers routes ─────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/trainers', tags: ['Trainers'],
  summary: 'List trainers',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(TrainerSchema), ...PaginatedMeta.shape }), 'TrainerListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/trainers', tags: ['Trainers'],
  summary: 'Add a trainer (creates auth account if email+password provided)',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    fullName:       z.string(),
    email:          z.string().email().optional(),
    password:       z.string().optional(),
    specialization: z.string().optional(),
    bio:            z.string().optional(),
    phone:          z.string().optional(),
  }) } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: SuccessEnvelope(TrainerSchema, 'TrainerCreateResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/trainers/{id}', tags: ['Trainers'],
  summary: 'Get trainer by ID',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(TrainerSchema, 'TrainerGetResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'delete', path: '/trainers/{id}', tags: ['Trainers'],
  summary: 'Remove a trainer',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: { 200: { description: 'Removed' }, ...errorResponses },
});

// ─── Equipment routes ─────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/equipment', tags: ['Equipment'],
  summary: 'List equipment',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(EquipmentSchema), ...PaginatedMeta.shape }), 'EquipmentListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/equipment', tags: ['Equipment'],
  summary: 'Add equipment',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    name:        z.string(),
    category:    z.string().optional(),
    quantity:    z.number().int().positive().optional(),
    condition:   z.enum(['excellent','good','fair','poor']).optional(),
    status:      z.enum(['operational','maintenance','retired']).optional(),
  }) } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: SuccessEnvelope(EquipmentSchema, 'EquipmentCreateResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'patch', path: '/equipment/{id}', tags: ['Equipment'],
  summary: 'Update equipment',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(EquipmentSchema, 'EquipmentUpdateResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'delete', path: '/equipment/{id}', tags: ['Equipment'],
  summary: 'Remove equipment',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: { 200: { description: 'Removed' }, ...errorResponses },
});

// ─── Notifications routes ──────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/notifications', tags: ['Notifications'],
  summary: 'List notifications for the authenticated user',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(NotificationSchema), ...PaginatedMeta.shape }), 'NotificationListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'patch', path: '/notifications/{id}/read', tags: ['Notifications'],
  summary: 'Mark a notification as read',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'Marked read', content: { 'application/json': { schema: SuccessEnvelope(NotificationSchema, 'NotificationReadResult') } } },
    ...errorResponses,
  },
});

// ─── Analytics routes ──────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/analytics/revenue', tags: ['Analytics'],
  summary: 'Daily revenue for the gym',
  security: auth,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.array(z.object({ date: z.string(), total: z.number(), count: z.number() })), 'RevenueResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/analytics/attendance', tags: ['Analytics'],
  summary: 'Daily attendance trend for the gym',
  security: auth,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.array(z.object({ date: z.string(), checkIns: z.number() })), 'AttendanceTrendResult') } } },
    ...errorResponses,
  },
});

// ─── Admin routes ──────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/admin/gyms', tags: ['Admin'],
  summary: 'List all gyms (super_admin)',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(GymSchema), ...PaginatedMeta.shape }), 'AdminGymListResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/admin/gyms', tags: ['Admin'],
  summary: 'Onboard a new gym with optional owner (super_admin). Fully transactional — rolled back on failure.',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    name:    z.string(),
    slug:    z.string().optional(),
    email:   z.string().email().optional(),
    phone:   z.string().optional(),
    address: z.string().optional(),
    owner: z.object({
      email:    z.string().email(),
      password: z.string().min(8),
      fullName: z.string(),
    }).optional(),
  }) } } } },
  responses: {
    201: { description: 'Gym onboarded', content: { 'application/json': { schema: SuccessEnvelope(z.object({ gym: GymSchema, owner: ProfileSchema.nullable() }), 'OnboardResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/admin/gyms/{id}/suspend', tags: ['Admin'],
  summary: 'Suspend a gym (super_admin)',
  security: auth,
  request: { params: z.object({ id: UuidSchema }) },
  responses: {
    200: { description: 'Suspended', content: { 'application/json': { schema: SuccessEnvelope(GymSchema, 'AdminSuspendResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'get', path: '/admin/audit-logs', tags: ['Admin'],
  summary: 'Paginated audit log (super_admin)',
  security: auth,
  request: { query: PaginationQuery },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({ items: z.array(AuditLogSchema), ...PaginatedMeta.shape }), 'AuditLogResult') } } },
    ...errorResponses,
  },
});

// ─── Workouts routes ─────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/workouts/history', tags: ['Workouts'],
  summary: 'Get chronological workout exercise history for the authenticated customer',
  security: auth,
  request: { query: z.object({ limit: z.string().optional(), offset: z.string().optional() }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.array(WorkoutLogSchema), 'WorkoutHistoryResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/workouts', tags: ['Workouts'],
  summary: 'Log a detailed workout session with exercise breakdowns',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({
    workoutName:    z.string(),
    category:       z.string(),
    durationMin:    z.number(),
    caloriesBurned: z.number().optional(),
    exercisesCount: z.number().optional(),
    exercises:      z.array(z.object({
      name:     z.string(),
      sets:     z.number().optional(),
      reps:     z.number().optional(),
      weightKg: z.number().optional(),
      notes:    z.string().optional(),
    })).optional(),
    logDate:        z.string().optional(),
  }) } } } },
  responses: {
    201: { description: 'Workout logged', content: { 'application/json': { schema: SuccessEnvelope(WorkoutLogSchema, 'WorkoutLogResult') } } },
    ...errorResponses,
  },
});

// ─── Progress routes ─────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get', path: '/progress/month', tags: ['Progress'],
  summary: 'Get aggregated monthly progress metrics (weight, water, protein, steps, photo logs)',
  security: auth,
  request: { query: z.object({ year: z.string().optional(), month: z.string().optional() }) },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: SuccessEnvelope(z.object({
      weightLogs:  z.array(z.unknown()),
      waterLogs:   z.array(z.unknown()),
      proteinLogs: z.array(z.unknown()),
      stepsLogs:   z.array(z.unknown()),
      imageLogs:   z.array(z.unknown()),
    }), 'MonthProgressResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/progress/weight', tags: ['Progress'],
  summary: 'Log daily body weight',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ weight: z.number(), logDate: z.string().optional() }) } } } },
  responses: {
    200: { description: 'Logged', content: { 'application/json': { schema: SuccessEnvelope(z.unknown(), 'WeightLogResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/progress/water', tags: ['Progress'],
  summary: 'Log daily water intake (ml)',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ amountMl: z.number(), logDate: z.string().optional() }) } } } },
  responses: {
    200: { description: 'Logged', content: { 'application/json': { schema: SuccessEnvelope(z.unknown(), 'WaterLogResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/progress/protein', tags: ['Progress'],
  summary: 'Log daily protein intake (g)',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ amountG: z.number(), logDate: z.string().optional() }) } } } },
  responses: {
    200: { description: 'Logged', content: { 'application/json': { schema: SuccessEnvelope(z.unknown(), 'ProteinLogResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/progress/steps', tags: ['Progress'],
  summary: 'Log daily step count',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ steps: z.number(), logDate: z.string().optional() }) } } } },
  responses: {
    200: { description: 'Logged', content: { 'application/json': { schema: SuccessEnvelope(z.unknown(), 'StepsLogResult') } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: 'post', path: '/progress/image', tags: ['Progress'],
  summary: 'Log daily progress photo URL',
  security: auth,
  request: { body: { content: { 'application/json': { schema: z.object({ imageUrl: z.string().url(), logDate: z.string().optional() }) } } } },
  responses: {
    200: { description: 'Logged', content: { 'application/json': { schema: SuccessEnvelope(z.unknown(), 'ImageProgressResult') } } },
    ...errorResponses,
  },
});

// ─── Webhook (unauthenticated) ─────────────────────────────────────────────

registry.registerPath({
  method: 'post', path: '/webhooks/razorpay', tags: ['Webhooks'],
  summary: 'Razorpay webhook receiver — HMAC-verified, idempotent. DO NOT call from frontend.',
  description: [
    'Receives Razorpay payment events (`payment.captured`, `order.paid`, `payment.failed`).',
    'Requires the `x-razorpay-signature` header. Events are stored in `payment_events` and processed idempotently.',
    'Always returns 200 to acknowledge receipt; processing errors are logged internally.',
  ].join('\n\n'),
  request: {
    headers: z.object({ 'x-razorpay-signature': z.string() }),
    body: { content: { 'application/json': { schema: z.object({ id: z.string(), event: z.string(), payload: z.record(z.string(), z.unknown()) }) } } },
  },
  responses: {
    200: { description: 'Event acknowledged' },
    400: { description: 'Invalid signature or payload', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

// ─── Build the spec ────────────────────────────────────────────────────────

export function getOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Aura Apex API',
      version: '1.0.0',
      description: [
        '## Aura Apex – Multi-tenant SaaS Gym Management API',
        '',
        'All authenticated routes require a **Bearer token** in the `Authorization` header.',
        'Tokens are obtained from `/auth/login` or `/auth/register`.',
        '',
        '### Roles',
        '| Role | Description |',
        '|------|-------------|',
        '| `customer` | Gym member — can check in via QR, view own profile/progress |',
        '| `staff` | Gym staff — can manage members, record attendance, view analytics |',
        '| `owner` | Gym owner — full access to their gym\'s data |',
        '| `trainer` | Trainer — limited read access |',
        '| `super_admin` | Platform admin — cross-tenant access, onboarding |',
        '',
        '### Pagination',
        'Paginated endpoints accept `?page=1&limit=20&sort=created_at&order=desc`.',
        'Responses include `{ items, page, limit, total }`.',
        '',
        '### Error Format',
        '```json',
        '{ "success": false, "message": "...", "error": { "code": "SNAKE_CASE_CODE" } }',
        '```',
      ].join('\n'),
      contact: { name: 'Aura Apex Backend', email: 'admin@aura-apex.com' },
    },
    servers: [
      { url: 'https://gym-app-xtru.onrender.com/api/v1', description: 'Production' },
      { url: 'http://localhost:3000/api/v1', description: 'Local dev' },
    ],
    tags: [
      { name: 'Auth',          description: 'Authentication — register, login, phone OTP, profile, password reset' },
      { name: 'Gym',           description: 'Gym profile, timings, settings, staff, bookmarks, join requests' },
      { name: 'Members',       description: 'Gym member management' },
      { name: 'Plans',         description: 'Membership plan catalogue' },
      { name: 'Subscriptions', description: 'Membership lifecycle — manual, customer self-cancellation, checkout' },
      { name: 'Payments',      description: 'Payment records, Razorpay orders, refunds' },
      { name: 'Attendance',    description: 'QR and manual check-ins, daily stats' },
      { name: 'QR',            description: 'Gym QR code management' },
      { name: 'Trainers',      description: 'Trainer profiles and assignments' },
      { name: 'Equipment',     description: 'Gym equipment inventory' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Analytics',     description: 'Revenue and attendance reporting' },
      { name: 'Admin',         description: 'Super-admin — cross-tenant gym management, audit logs' },
      { name: 'Workouts',      description: 'Customer workout routines and exercise history' },
      { name: 'Progress',      description: 'Customer daily biometric and fitness metrics' },
      { name: 'Webhooks',      description: 'Razorpay event receiver — server-to-server only' },
    ],
  });
}

