// src/core/middleware/validation.ts
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { SMS_GATEWAYS } from '@models';

/**
 * Middleware to handle validation errors
 * Add this after validation rules to check for errors
 */
export const handleValidationErrors = (request: Request, response: Response, next: NextFunction) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return response.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.type === 'field' ? err.path : undefined,
                message: err.msg
            }))
        });
    }
    next();
};

// ============================================
// AUTH VALIDATION
// ============================================

/**
 * Login validation
 * - Email: required, valid email format, normalized
 * - Password: required
 */
export const validateLogin = [
    body('email')
        .exists().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .exists().withMessage('Password is required')
        .isLength({ min: 1 }).withMessage('Password cannot be empty'),
    handleValidationErrors
];

/**
 * Public registration validation (no role field allowed)
 * - firstname: required, 1-100 characters
 * - lastname: required, 1-100 characters
 * - email: required, valid email format, normalized
 * - username: required, 3-50 characters, alphanumeric with underscore/hyphen
 * - password: required, 8-128 characters
 * - phone: required, at least 10 digits
 * NOTE: No role validation - public registration always creates basic users
 */
export const validateRegister = [
    body('firstname')
        .exists().withMessage('First name is required')
        .isLength({ min: 1, max: 100 }).withMessage('First name must be 1–100 characters'),
    body('lastname')
        .exists().withMessage('Last name is required')
        .isLength({ min: 1, max: 100 }).withMessage('Last name must be 1–100 characters'),
    body('email')
        .exists().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('username')
        .exists().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
    body('password')
        .exists().withMessage('Password is required')
        .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters'),
    body('phone')
        .exists().withMessage('Phone number is required')
        .isLength({ min: 10 }).withMessage('Phone must have at least 10 digits'),
    handleValidationErrors
];

// ============================================
// PASSWORD VALIDATION
// ============================================

/**
 * Password reset request validation
 * - Email: required, valid email format, normalized
 */
export const validatePasswordResetRequest = [
    body('email')
        .exists().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    handleValidationErrors
];

/**
 * Password reset validation (with token)
 * - token: required, trimmed
 * - password: required, 8-128 characters
 */
export const validatePasswordReset = [
    body('token')
        .exists().withMessage('Token is required')
        .trim(),
    body('password')
        .exists().withMessage('Password is required')
        .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters'),
    handleValidationErrors
];

/**
 * Password change validation (for authenticated users)
 * - oldPassword: required
 * - newPassword: required, 8-128 characters, different from old password
 */
export const validatePasswordChange = [
    body('oldPassword')
        .exists().withMessage('Old password is required'),
    body('newPassword')
        .exists().withMessage('New password is required')
        .isLength({ min: 8, max: 128 }).withMessage('New password must be 8–128 characters')
        .custom((value, { req }) => value !== req.body.oldPassword)
        .withMessage('New password must be different from old password'),
    handleValidationErrors
];

// ============================================
// VERIFICATION VALIDATION
// ============================================

/**
 * Phone verification send validation
 * - carrier: optional, must be valid SMS gateway from SMS_GATEWAYS
 */
export const validatePhoneSend = [
    body('carrier')
        .optional()
        .isIn(Object.keys(SMS_GATEWAYS)).withMessage('Invalid carrier'),
    handleValidationErrors
];

/**
 * Phone verification code validation
 * - code: required, trimmed, exactly 6 digits
 */
export const validatePhoneVerify = [
    body('code')
        .exists().withMessage('Verification code is required')
        .trim()
        .isLength({ min: 6, max: 6 }).withMessage('Code must be exactly 6 digits')
        .isNumeric().withMessage('Code must contain only digits'),
    handleValidationErrors
];

/**
 * Email verification token validation (query param)
 * - token: required parameter, trimmed
 */
export const validateEmailToken = [
    query('token')
        .exists().withMessage('Token is required')
        .trim(),
    handleValidationErrors
];

// ============================================
// USER/PARAMS VALIDATION
// ============================================

/**
 * Validate user ID in params matches JWT claims
 * Use this for routes where users can only access their own resources
 * - id: required, integer
 */
export const validateUserIdParam = [
    param('id')
        .exists().withMessage('User ID is required')
        .isInt().withMessage('User ID must be an integer'),
    handleValidationErrors
];

// ============================================
// CUSTOM VALIDATORS (OPTIONAL)
// ============================================

/**
 * Custom password strength validator (optional, more strict)
 * Add to password fields if you want stronger validation
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */
export const passwordStrength = body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Must contain at least one number')
    .matches(/[@$!%*?&]/).withMessage('Must contain at least one special character');

/**
 * Sanitize and validate pagination parameters
 * - page: optional, positive integer
 * - limit: optional, integer between 1 and 100
 */
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
    handleValidationErrors
];
