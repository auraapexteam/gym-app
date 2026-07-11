/**
 * Base class for all application errors.
 *
 * Operational errors (expected: validation, not-found, business-rule failures)
 * carry a stable machine-readable `code` and a client-safe `message`.
 * The global error handler converts any thrown AppError into the standard
 * failure response shape. Never throw a raw `Error` from application code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — malformed request that failed schema validation. */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

/** 400 — a generic bad request not covered by schema validation. */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(message, 400, code, true);
  }
}

/** 401 — the caller is not authenticated. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code, true);
  }
}

/** 403 — authenticated but not permitted (role / permission / tenant / ownership). */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(message, 403, code, true);
  }
}

/** 404 — the requested resource does not exist (or is soft-deleted). */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code, true);
  }
}

/** 409 — the request conflicts with current state (e.g. duplicate). */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, 409, code, true);
  }
}

/** 422 — a valid request that violates a business rule. */
export class BusinessRuleError extends AppError {
  constructor(message = 'Business rule violation', code = 'BUSINESS_RULE_ERROR') {
    super(message, 422, code, true);
  }
}

/** 429 — rate limit exceeded. */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code = 'RATE_LIMITED') {
    super(message, 429, code, true);
  }
}

/** 402/422 — a payment-specific failure. */
export class PaymentError extends AppError {
  constructor(message = 'Payment failed', code = 'PAYMENT_ERROR') {
    super(message, 422, code, true);
  }
}

/** 503 — a required downstream dependency is unavailable. */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code, true);
  }
}
