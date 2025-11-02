// src/core/middleware/adminAuth.ts
import { Response, NextFunction } from 'express';
import { IJwtRequest } from '@models';
import { sendError } from '@utilities';

/**
 * Role hierarchy numeric mapping
 * 1 - User
 * 2 - Moderator
 * 3 - Admin
 * 4 - SuperAdmin
 * 5 - Owner
 */
const ROLE_HIERARCHY = {
    User: 1,
    Moderator: 2,
    Admin: 3,
    SuperAdmin: 4,
    Owner: 5
};

/**
 * Ensure user has minimum required role
 */
export const requireRole = (minRole: keyof typeof ROLE_HIERARCHY) => {
    return (req: IJwtRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.claims || !req.claims.role) {
                return sendError(res, 401,'Missing authentication');
            }

            const userRole = req.claims.role;
            // Handle both numeric roles (from JWT) and string roles
            const userRank = typeof userRole === 'number' ? userRole : ROLE_HIERARCHY[userRole];
            const minRank = ROLE_HIERARCHY[minRole];

            if (!userRank || userRank < minRank) {
                return sendError(res, 403,'Access denied: insufficient privileges');
            }

            next();
        } catch (err) {
            console.error('AdminAuth middleware error:', err);
            sendError(res, 500,'Authorization check failed');
        }
    };
};

/**
 * Shortcut middleware for Admin+ access
 */
export const requireAdmin = requireRole('Admin');

/**
 * Shortcut middleware for Owner-only access
 */
export const requireOwner = requireRole('Owner');
