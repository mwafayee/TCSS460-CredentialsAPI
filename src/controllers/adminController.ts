// src/controllers/adminController.ts
import { Request, Response } from 'express';
import { pool, sendSuccess, sendError } from '@utilities';
import { generateSaltedHash } from '@auth';
import { IJwtRequest } from '@models';

/**
 * Role hierarchy mapping
 * 1 - User
 * 2 - Moderator
 * 3 - Admin
 * 4 - SuperAdmin
 * 5 - Owner
 */
const ROLE_HIERARCHY: Record<string, number> = {
    User: 1,
    Moderator: 2,
    Admin: 3,
    SuperAdmin: 4,
    Owner: 5
};

/**
 * AdminController
 * Contains endpoints for administrative user management
 */
export class AdminController {
    /**
     * Create new user (admin-level)
     * Allows admin or higher to create accounts with equal or lower role
     */
    static async createUser(req: IJwtRequest, res: Response) {
        try {
            const { firstname, lastname, email, username, phone, role } = req.body;
            const creatorRole = req.claims.role; // from JWT middleware

            // Handle numeric role from JWT
            const creatorRank = typeof creatorRole === 'number' ? creatorRole : ROLE_HIERARCHY[creatorRole];
            const targetRank = typeof role === 'number' ? role : ROLE_HIERARCHY[role];

            if (targetRank > creatorRank) {
                return sendError(res, 403,'You cannot create a user with a higher role than yours');
            }

            const result = await pool.query(
                `INSERT INTO Account
                    (FirstName, LastName, Email, Username, Phone, Account_Role, Account_Status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'active')
                 RETURNING Account_ID, FirstName, LastName, Email, Username, Phone, Account_Role;`,
                [firstname, lastname, email, username, phone, targetRank]
            );

            sendSuccess(res, {
                message: 'User created successfully',
                user: result.rows[0]
            });
        } catch (error) {
            console.error('Admin createUser error:', error);
            sendError(res, 500,'Failed to create user');
        }
    }

    /**
     * Get all users with pagination
     */
    static async listUsers(req: IJwtRequest, res: Response) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const users = await pool.query(
                `SELECT Account_ID, FirstName, LastName, Email, Username, Phone, Account_Role, Account_Status 
                 FROM Account
                 ORDER BY Account_ID ASC
                 LIMIT $1 OFFSET $2;`,
                [limit, offset]
            );

            sendSuccess(res, {
                page,
                limit,
                count: users.rowCount,
                users: users.rows
            });
        } catch (error) {
            console.error('Admin listUsers error:', error);
            sendError(res, 500,'Failed to fetch users');
        }
    }

    /**
     * Get single user by ID
     */
    static async getUserById(req: IJwtRequest, res: Response) {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `SELECT Account_ID, FirstName, LastName, Email, Username, Phone, Account_Role, Account_Status
                 FROM Account WHERE Account_ID = $1;`,
                [id]
            );

            if (result.rowCount === 0) return sendError(res, 404, 'User not found');

            sendSuccess(res, result.rows[0]);
        } catch (error) {
            console.error('Admin getUserById error:', error);
            sendError(res, 500,'Failed to get user details');
        }
    }

    /**
     * Update user info
     */
    static async updateUser(req: IJwtRequest, res: Response) {
        try {
            const { id } = req.params;
            const { firstname, lastname, email, username, phone, role } = req.body;

            // Handle numeric role
            const roleValue = typeof role === 'number' ? role : ROLE_HIERARCHY[role];

            const result = await pool.query(
                `UPDATE Account
                 SET FirstName = $1, LastName = $2, Email = $3, Username = $4, Phone = $5, Account_Role = $6, Updated_At = NOW()
                 WHERE Account_ID = $7
                 RETURNING Account_ID, FirstName, LastName, Email, Username, Phone, Account_Role;`,
                [firstname, lastname, email, username, phone, roleValue, id]
            );

            if (result.rowCount === 0) return sendError(res, 404,'User not found');

            sendSuccess(res, {
                message: 'User updated successfully',
                user: result.rows[0]
            });
        } catch (error) {
            console.error('Admin updateUser error:', error);
            sendError(res, 500,'Failed to update user');
        }
    }

    /**
     * Soft delete a user (set status to inactive)
     */
    static async deleteUser(req: IJwtRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await pool.query(
                `UPDATE Account SET Account_Status = 'inactive', Updated_At = NOW() WHERE Account_ID = $1 RETURNING Account_ID;`,
                [id]
            );

            if (result.rowCount === 0) return sendError(res, 404,'User not found');

            sendSuccess(res, { message: 'User deleted successfully' });
        } catch (error) {
            console.error('Admin deleteUser error:', error);
            sendError(res, 500,'Failed to delete user');
        }
    }

    /**
     * Dashboard stats (example)
     */
    static async getDashboardStats(req: IJwtRequest, res: Response) {
        try {
            const result = await pool.query(`
                SELECT
                    COUNT(*) AS total_users,
                    COUNT(*) FILTER (WHERE Account_Status = 'active') AS active_users,
                    COUNT(*) FILTER (WHERE Account_Status = 'inactive') AS inactive_users
                FROM Account;
            `);

            sendSuccess(res, {
                message: 'Dashboard statistics fetched',
                stats: result.rows[0]
            });
        } catch (error) {
            console.error('Admin dashboard error:', error);
            sendError(res, 500,'Failed to fetch dashboard stats');
        }
    }

    /**
     * Search users by name, email, or username
     * Supports pagination and filtering
     */
    static async searchUsers(req: IJwtRequest, res: Response) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const searchTerm = req.query.q as string || '';
            const status = req.query.status as string;
            const role = req.query.role as string;

            let query = `
                SELECT Account_ID, FirstName, LastName, Email, Username, Phone, Account_Role, Account_Status
                FROM Account
                WHERE 1=1
            `;
            const params: any[] = [];
            let paramCount = 1;

            // Add search term filter
            if (searchTerm) {
                query += ` AND (
                    FirstName ILIKE $${paramCount} OR
                    LastName ILIKE $${paramCount} OR
                    Email ILIKE $${paramCount} OR
                    Username ILIKE $${paramCount}
                )`;
                params.push(`%${searchTerm}%`);
                paramCount++;
            }

            // Add status filter
            if (status) {
                query += ` AND Account_Status = $${paramCount}`;
                params.push(status);
                paramCount++;
            }

            // Add role filter
            if (role) {
                const roleValue = typeof role === 'number' ? role : ROLE_HIERARCHY[role];
                query += ` AND Account_Role = $${paramCount}`;
                params.push(roleValue);
                paramCount++;
            }

            query += ` ORDER BY Account_ID ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            sendSuccess(res, {
                page,
                limit,
                count: result.rowCount,
                searchTerm,
                users: result.rows
            });
        } catch (error) {
            console.error('Admin searchUsers error:', error);
            sendError(res, 500, 'Failed to search users');
        }
    }

    /**
     * Admin password reset - reset any user's password
     * Does not require old password verification
     */
    static async resetUserPassword(req: IJwtRequest, res: Response) {
        try {
            const { id } = req.params;
            const { password } = req.body;

            if (!password) {
                return sendError(res, 400, 'Password is required');
            }

            // Check if user exists
            const userCheck = await pool.query(
                'SELECT Account_ID FROM Account WHERE Account_ID = $1',
                [id]
            );

            if (userCheck.rowCount === 0) {
                return sendError(res, 404, 'User not found');
            }

            // Generate new salt and hash
            const { salt, hash } = await generateSaltedHash(password);

            // Update or insert credential
            await pool.query(
                `INSERT INTO Account_Credential (Account_ID, Salted_Hash, Salt)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (Account_ID)
                 DO UPDATE SET Salted_Hash = $2, Salt = $3`,
                [id, hash, salt]
            );

            sendSuccess(res, { message: 'Password reset successfully' });
        } catch (error) {
            console.error('Admin resetUserPassword error:', error);
            sendError(res, 500, 'Failed to reset password');
        }
    }

    /**
     * Change user's role
     * Admin can only assign roles less than or equal to their own
     */
    static async changeUserRole(req: IJwtRequest, res: Response) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const adminRole = req.claims.role;

            if (!role) {
                return sendError(res, 400, 'Role is required');
            }

            // Handle numeric role from JWT
            const adminRank = typeof adminRole === 'number' ? adminRole : ROLE_HIERARCHY[adminRole];
            const targetRank = typeof role === 'number' ? role : ROLE_HIERARCHY[role];

            if (!targetRank || targetRank < 1 || targetRank > 5) {
                return sendError(res, 400, 'Invalid role specified');
            }

            // Check permission - admin cannot assign roles higher than their own
            if (targetRank > adminRank) {
                return sendError(res, 403, 'You cannot assign a role higher than your own');
            }

            // Update user role
            const result = await pool.query(
                `UPDATE Account
                 SET Account_Role = $1, Updated_At = NOW()
                 WHERE Account_ID = $2
                 RETURNING Account_ID, FirstName, LastName, Email, Username, Account_Role`,
                [targetRank, id]
            );

            if (result.rowCount === 0) {
                return sendError(res, 404, 'User not found');
            }

            sendSuccess(res, {
                message: 'User role updated successfully',
                user: result.rows[0]
            });
        } catch (error) {
            console.error('Admin changeUserRole error:', error);
            sendError(res, 500, 'Failed to change user role');
        }
    }
}
