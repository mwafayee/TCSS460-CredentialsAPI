# TCSS-460-auth-squared Template

**Identity and Access Management (IAM) API - Student Starter Template**
_Authentication × Authorization = Auth²_

## Overview

This is the **student starter template** for the Auth² (Auth Squared) project - a comprehensive Identity and Access Management (IAM) API built with Node.js, Express, TypeScript, and PostgreSQL. This template provides the foundational structure and basic authentication features, while leaving key components for you to implement as part of your learning experience.

**Course**: TCSS 460 - Software Engineering
**Institution**: University of Washington Tacoma
**Level**: Senior-level undergraduate computer science

## What's Included

This template provides:

### ✅ Working Features
- **Project Structure**: Complete TypeScript/Node.js/Express setup with path aliases
- **Database Schema**: Full PostgreSQL schema with 4 tables (Account, Account_Credential, Email_Verification, Phone_Verification)
- **Core Utilities**: Password hashing, JWT generation, email service, database connection
- **JWT Middleware**: Token validation (`checkToken`) - fully functional
- **Basic Controllers**: Authentication and verification controllers (without validation)
- **Documentation Routes**: Serve educational markdown docs as HTML
- **Test Infrastructure**: Jest + Supertest setup with example utility tests
- **Development Tools**: TypeScript, ESLint, Prettier, nodemon, Docker Compose
- **Educational Documentation**: Complete guides in `docs-2.0/` directory

### 📝 Routes (Without Validation)
**Public Routes** (Open):
- `POST /auth/login` - User login
- `POST /auth/register` - New user registration
- `POST /auth/password/reset-request` - Request password reset
- `POST /auth/password/reset` - Reset password with token
- `GET /auth/verify/carriers` - List SMS carriers
- `GET /auth/verify/email/confirm?token=xxx` - Verify email
- `GET /jwt_test` - API health check
- `GET /doc` - Documentation index
- `GET /doc/:filename` - Rendered markdown docs

**Protected Routes** (Closed - Requires JWT):
- `POST /auth/user/password/change` - Change password
- `POST /auth/verify/phone/send` - Send SMS verification
- `POST /auth/verify/phone/verify` - Verify SMS code
- `POST /auth/verify/email/send` - Send email verification

## What You Need to Implement

### 🎯 Your Learning Objectives

#### 1. Input Validation (Primary Goal)
**File**: `src/core/middleware/validation.ts`

The validation middleware file has been gutted. You need to implement express-validator validation chains for:

- `validateLogin` - Email and password validation
- `validateRegister` - Complete user registration validation
- `validatePasswordResetRequest` - Email validation
- `validatePasswordReset` - Token and new password validation
- `validatePasswordChange` - Old and new password validation
- `validatePhoneSend` - Carrier validation
- `validatePhoneVerify` - 6-digit code validation
- `validateEmailToken` - Token parameter validation
- `validateUserIdParam` - User ID validation
- `passwordStrength` (optional) - Strong password requirements
- `validatePagination` - Page and limit validation

**Learning Focus**:
- Request validation with express-validator
- Security best practices (input sanitization)
- Error handling and user feedback
- Data type validation and constraints

#### 2. Admin API (Advanced Feature)
**Files to Create**:
- `src/controllers/adminController.ts`
- `src/core/middleware/adminAuth.ts`
- `src/routes/admin/index.ts`

**Endpoints to Implement**:
- `POST /admin/users/create` - Create user with specified role
- `GET /admin/users` - List users (with pagination, filters)
- `GET /admin/users/search` - Search users
- `GET /admin/users/:id` - Get user details
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Soft delete user
- `PUT /admin/users/:id/password` - Admin password reset
- `PUT /admin/users/:id/role` - Change user role
- `GET /admin/users/stats/dashboard` - Dashboard statistics

**Learning Focus**:
- Role-based access control (RBAC)
- Role hierarchy enforcement (users can only manage lower/equal roles)
- Advanced SQL queries (filtering, pagination, search)
- Admin middleware and authorization checks
- Soft delete patterns

## Role Hierarchy

Your admin implementation should enforce this hierarchy:

- **1 - User**: Basic access
- **2 - Moderator**: User management capabilities
- **3 - Admin**: Full user CRUD, can create roles ≤ 3
- **4 - SuperAdmin**: System administration, can create roles ≤ 4
- **5 - Owner**: Complete control

**Rule**: Admins can only create/modify users with roles less than or equal to their own role.

## Getting Started

### Prerequisites

```bash
node --version  # v22.14.0 recommended
npm --version   # v10+ recommended
```

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.test .env
# Edit .env with your database credentials and JWT secret

# Start PostgreSQL with Docker
docker-compose up -d

# Initialize database schema
psql -U your_user -d your_database -f data/init.sql

# Run in development mode
npm run dev
```

### Development Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Environment Variables

Required in `.env`:
```bash
# Server
PORT=8000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_squared_db
DB_USER=your_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRATION=14d

# Email (for verification)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Twilio (optional - for SMS)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

## Database Schema

### Tables

**Account** - Main user table
```sql
Account_ID, FirstName, LastName, Username (unique),
Email (unique), Email_Verified, Phone (unique),
Phone_Verified, Account_Role, Account_Status,
Created_At, Updated_At
```

**Account_Credential** - Password storage
```sql
Credential_ID, Account_ID (FK), Salted_Hash, Salt
```

**Email_Verification** - Email verification tokens
```sql
Verification_ID, Account_ID (FK), Email,
Verification_Token (unique), Token_Expires,
Verified, Created_At
```

**Phone_Verification** - SMS verification codes
```sql
Verification_ID, Account_ID (FK), Phone,
Verification_Code, Code_Expires, Attempts,
Verified, Created_At
```

## API Documentation

- **Swagger UI**: http://localhost:8000/api-docs
- **Educational Docs**: http://localhost:8000/doc
- **Postman Collection**: Available in `docs/postman-collection.json`

## Testing

The template includes example tests for utilities. You should add tests for your validation and admin implementations:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- validationUtils.test.ts

# Generate coverage report
npm test -- --coverage
```

## TypeScript Path Aliases

The project uses path aliases for clean imports:

```typescript
import { pool, sendSuccess, sendError } from '@utilities';
import { checkToken, requireAdmin } from '@middleware';
import { AuthController, AdminController } from '@controllers';
import { IJwtRequest, UserRole, RoleName } from '@models';
```

**Available Aliases**:
- `@core/*` → `src/core/*`
- `@routes/*` → `src/routes/*`
- `@controllers` → `src/controllers/index`
- `@utilities` → `src/core/utilities/index`
- `@middleware` → `src/core/middleware/index`
- `@models` → `src/core/models/index`
- `@db` → `src/core/utilities/database`
- `@auth` → `src/core/utilities/credentialingUtils`

## Security Features

This template demonstrates important security practices:

- **SHA256 password hashing** with unique salts per user
- **Parameterized SQL queries** (SQL injection prevention)
- **Timing-safe password comparison**
- **JWT tokens** with configurable expiration
- **Email verification** tokens (48-hour expiry)
- **SMS verification** codes (15-minute expiry, attempt limiting)
- **Role-based access control** (RBAC)

## Educational Resources

Check out the comprehensive guides in `docs-2.0/`:

- Authentication Patterns
- JWT Token Implementation
- Password Hashing Best Practices
- SQL Injection Prevention
- Role-Based Access Control
- Testing Strategies
- And more!

## Project Structure

```
template/
├── src/
│   ├── app.ts                     # Express app configuration
│   ├── index.ts                   # Server entry point
│   ├── routes/
│   │   ├── open/                  # Public routes
│   │   ├── closed/                # Protected routes
│   │   └── admin/                 # ⚠️ TODO: Implement admin routes
│   ├── controllers/
│   │   ├── authController.ts      # Authentication logic
│   │   ├── verificationController.ts
│   │   └── adminController.ts     # ⚠️ TODO: Implement admin controller
│   ├── core/
│   │   ├── middleware/
│   │   │   ├── jwt.ts            # ✅ JWT validation (working)
│   │   │   ├── validation.ts     # ⚠️ TODO: Implement validation chains
│   │   │   └── adminAuth.ts      # ⚠️ TODO: Implement admin middleware
│   │   ├── utilities/            # ✅ All utilities working
│   │   └── models/               # TypeScript interfaces
│   └── test/                      # Test setup
├── data/
│   ├── init.sql                   # Database schema
│   └── heroku.sql                # Heroku deployment schema
├── docs/
│   └── swagger.yaml              # API documentation
├── docs-2.0/                     # Educational documentation
├── ai.prof/                      # AI assistant instructions
└── .claude/                      # Claude Code commands
```

## Contributing

This is a student learning template. Focus on:

1. Understanding the existing code patterns
2. Implementing validation following the examples
3. Building the admin API with proper authorization
4. Writing tests for your implementations
5. Documenting your code clearly

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: http://localhost:8000/doc (when running)
- **API Docs**: http://localhost:8000/api-docs (Swagger UI)
- **Course Resources**: Check Canvas for additional materials

---

**Remember**: This is an educational project. Focus on learning the concepts of authentication, authorization, validation, and security best practices. The goal is understanding, not production optimization.

Good luck! 🚀
