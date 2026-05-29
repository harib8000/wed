import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight CSRF guard for non-GET requests.
 * Since all API calls use Authorization headers and JSON content-type,
 * simple request header checks are sufficient (OWASP stateless CSRF defense).
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  
  const contentType = req.headers['content-type'] ?? '';
  const xRequestedWith = req.headers['x-requested-with'];
  
  // Allow JSON requests (API clients always send JSON)
  if (contentType.startsWith('application/json')) {
    next();
    return;
  }
  
  // Allow multipart (file uploads)
  if (contentType.startsWith('multipart/form-data')) {
    next();
    return;
  }

  // Webhook endpoints (no CSRF needed — they use signature verification)
  if (req.path.includes('/webhook')) {
    next();
    return;
  }

  // Require X-Requested-With for other content types
  if (!xRequestedWith) {
    res.status(403).json({ success: false, error: { code: 'CSRF_VIOLATION', message: 'Missing X-Requested-With header' } });
    return;
  }

  next();
}
