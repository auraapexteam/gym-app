import { ZodTypeAny } from 'zod';
import { asyncHandler } from '@/shared/middleware/async-handler';
import { ValidationError } from '@/shared/errors';

/**
 * Zod validation middleware. Validates and coerces `body`, `query` and
 * `params` before the request reaches the controller. Invalid requests never
 * reach business logic — they short-circuit with a 400 and structured details.
 *
 * Schemas are shaped as `z.object({ body, query, params })`; each section is
 * optional.
 */
export const validate = (schema: ZodTypeAny) =>
  asyncHandler(async (req, _res, next) => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        // Drop the leading section key ("body"/"query"/"params") for clarity.
        field: issue.path.slice(1).join('.') || issue.path.join('.'),
        message: issue.message,
      }));
      throw new ValidationError('Validation failed', details);
    }

    const parsed = result.data as {
      body?: unknown;
      query?: Record<string, unknown>;
      params?: Record<string, string>;
    };

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.query = parsed.query as typeof req.query;
    if (parsed.params !== undefined) req.params = parsed.params as typeof req.params;

    next();
  });
