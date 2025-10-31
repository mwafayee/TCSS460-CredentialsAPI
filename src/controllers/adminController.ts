// src/controllers/adminController.ts
import { Request, Response } from 'express';
import { pool, sendSuccess, sendError } from '@utilities';
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

            if (ROLE_HIERARCHY[role] > ROLE_HIERARCHY[creatorRole]) {
                return sendError(res, 403,'You cannot create a user with a higher role than yours');
            }

            const result = await pool.query(
                `INSERT INTO Account 
                    (FirstName, LastName, Email, Username, Phone, Account_Role, Account_Status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'active')
                 RETURNING Account_ID, FirstName, LastName, Email, Username, Phone, Account_Role;`,
                [firstname, lastname, email, username, phone, ROLE_HIERARCHY[role]]
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

            const result = await pool.query(
                `UPDATE Account
                 SET FirstName = $1, LastName = $2, Email = $3, Username = $4, Phone = $5, Account_Role = $6, Updated_At = NOW()
                 WHERE Account_ID = $7
                 RETURNING Account_ID, FirstName, LastName, Email, Username, Phone, Account_Role;`,
                [firstname, lastname, email, username, phone, ROLE_HIERARCHY[role], id]
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
}
