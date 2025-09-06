# Environment Setup Guide

## 🔐 Secure Environment Configuration

This guide will help you set up the required environment variables for the M1 Villa Management System while keeping sensitive information secure.

## 📋 Prerequisites

Before setting up environment variables, ensure you have:
- Node.js 18+ and npm 8+
- PostgreSQL 14+ running
- Clerk account for authentication
- Azure account for SharePoint integration (optional)

## 🚀 Quick Setup

### 1. Backend Environment Setup

Copy the example environment file and configure it:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your actual values:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ils_m1_villa_management"

# Server Configuration
PORT=4001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-very-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your-clerk-secret-key-here
CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key-here

# Azure/SharePoint Configuration (Optional)
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id
SHAREPOINT_SITE_URL=https://your-org.sharepoint.com/sites/your-site
SHAREPOINT_DRIVE_ID=your-sharepoint-drive-id

# Email Configuration (Optional)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
```

### 2. Frontend Environment Setup

Copy the example environment file and configure it:

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` with your actual values:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_API_VERSION=v1

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key-here
CLERK_SECRET_KEY=sk_test_your-clerk-secret-key-here
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev

# Environment Identification
SERVICE_NAME=M1_VILLA_MANAGEMENT
SERVICE_VERSION=1.0.0
SERVICE_BACKEND=POSTGRESQL
```

## 🔑 Getting Required Credentials

### Clerk Authentication Setup

1. **Create Clerk Account**: Visit [clerk.com](https://clerk.com) and create an account
2. **Create Application**: Create a new application in Clerk dashboard
3. **Get Keys**: Copy the publishable key and secret key from the API Keys section
4. **Configure Domain**: Note your Clerk domain (e.g., `your-app.clerk.accounts.dev`)

### PostgreSQL Database Setup

1. **Install PostgreSQL**: Follow [PostgreSQL installation guide](https://www.postgresql.org/download/)
2. **Create Database**: Create a new database named `ils_m1_villa_management`
3. **Create User**: Create a database user with appropriate permissions
4. **Connection String**: Format as `postgresql://username:password@host:port/database`

### SharePoint Integration (Optional)

1. **Azure App Registration**: Create an app registration in Azure Portal
2. **Configure Permissions**: Add SharePoint permissions to your app
3. **Get Credentials**: Note the client ID, client secret, and tenant ID
4. **SharePoint Site**: Get your SharePoint site URL and drive ID

## 🛡️ Security Best Practices

### Environment File Security

- **Never commit** `.env` files to version control
- **Use strong secrets**: Generate secure random strings for JWT and encryption keys
- **Rotate credentials** regularly, especially in production
- **Use different credentials** for development, staging, and production environments

### Key Generation

Generate secure keys using these commands:

```bash
# Generate a secure JWT secret (32 characters)
openssl rand -base64 32

# Generate an encryption key (32 characters)
openssl rand -hex 32

# Generate a UUID for various purposes
uuidgen
```

### Production Environment

For production deployment:

1. **Use environment-specific files**:
   - `backend/.env.production`
   - `frontend/.env.production.local`

2. **Secure credential storage**:
   - Use Azure Key Vault, AWS Secrets Manager, or similar
   - Configure CI/CD to inject secrets securely

3. **Database security**:
   - Use connection pooling
   - Configure SSL/TLS for database connections
   - Use read-only users for analytics queries

## 📁 File Structure

Your project should have these environment files:

```
M1-PostgreSQL-Standalone/
├── backend/
│   ├── .env.example          # ✅ Tracked in git
│   └── .env                  # ❌ NOT tracked in git
└── frontend/
    ├── .env.example          # ✅ Tracked in git
    ├── .env.local.postgres.example  # ✅ Tracked in git
    └── .env.local            # ❌ NOT tracked in git
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Verify PostgreSQL is running
   - Check connection string format
   - Ensure database exists and user has permissions

2. **Clerk Authentication Errors**:
   - Verify publishable key starts with `pk_test_` or `pk_live_`
   - Check secret key starts with `sk_test_` or `sk_live_`
   - Ensure domain matches your Clerk application

3. **API Connection Issues**:
   - Verify `NEXT_PUBLIC_API_URL` points to running backend
   - Check CORS configuration in backend
   - Ensure backend server is running on correct port

### Environment Validation

You can validate your environment setup by running:

```bash
# Check backend environment
cd backend && npm run env:check

# Check frontend environment  
cd frontend && npm run env:check
```

## 🚨 Important Security Notes

- **This file is tracked in git** - it contains no sensitive information
- **Your actual .env files are ignored** - they will not be committed to git
- **Review .gitignore** - ensure all sensitive files are properly excluded
- **Use example files** - when sharing the project, recipients should copy from .example files

## 📞 Support

If you need help with environment setup:
1. Check the troubleshooting section above
2. Review the project README.md
3. Contact the development team
