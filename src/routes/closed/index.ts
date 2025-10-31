// src/routes/closed/index.ts
import express, { Router } from 'express';
import { AuthController, VerificationController } from '@controllers';
import { checkToken } from '@middleware';
import {
    validatePasswordChange,
    validatePhoneSend,
    validatePhoneVerify
} from '@middleware/validation';

const closedRoutes: Router = express.Router();

// All closed routes require authentication
closedRoutes.use(checkToken);

// ===== AUTHENTICATED AUTH ROUTES =====

/**
 * Change password (requires authentication and old password)
 * POST /auth/user/password/change
 */
closedRoutes.post('/auth/user/password/change', validatePasswordChange, AuthController.changePassword);

/**
 * Send SMS verification code
 * POST /auth/verify/phone/send
 */
closedRoutes.post('/auth/verify/phone/send', validatePhoneSend, VerificationController.sendSMSVerification);

/**
 * Verify SMS code
 * POST /auth/verify/phone/verify
 */
closedRoutes.post('/auth/verify/phone/verify', validatePhoneVerify, VerificationController.verifySMSCode);

/**
 * Send email verification
 * POST /auth/verify/email/send
 */
closedRoutes.post('/auth/verify/email/send', VerificationController.sendEmailVerification);

export { closedRoutes };
