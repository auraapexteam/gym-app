import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate JWT using Supabase Auth getUser API
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Internal server authentication error' });
  }
}

/**
 * Middleware to restrict access based on user role.
 * Requires requireAuth to be run before this middleware.
 */
export function checkRole(allowedRoles: ('customer' | 'owner' | 'admin')[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return next(new AppError('Authentication required', 401));
      }

      // Query database for user profile and verified role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        return next(new AppError('User profile not found', 403));
      }

      if (!allowedRoles.includes(profile.role as any)) {
        return next(new AppError('Access denied: Insufficient privileges', 403));
      }

      req.user.role = profile.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}
