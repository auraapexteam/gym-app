/**
 * Docs router — serves Swagger UI at /docs and the raw OpenAPI JSON at /docs/openapi.json.
 *
 * Mounted in app.ts before the main API router (no auth required — the spec
 * is publicly accessible like any published API documentation).
 */
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { getOpenApiSpec } from './openapi';

const docsRouter = Router();

// Cache the generated spec so it's only built once per process boot.
let cachedSpec: ReturnType<typeof getOpenApiSpec> | null = null;
const spec = () => {
  if (!cachedSpec) cachedSpec = getOpenApiSpec();
  return cachedSpec;
};

/** Raw OpenAPI JSON — useful for import into Postman, Insomnia, or sdk generators. */
docsRouter.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(spec());
});

/** Swagger UI interactive docs. */
docsRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    // Pass a function so Swagger UI always fetches the cached spec
    swaggerOptions: { url: '/docs/openapi.json' },
    customSiteTitle: 'Aura Apex API Docs',
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css',
    customfavIcon: 'https://cdn.prod.website-files.com/65b5e1b0b3ca5ec8a40b1f22/65b5e4dfcaecd8d8745c1ee0_favicon.ico',
  }),
);

export { docsRouter };
