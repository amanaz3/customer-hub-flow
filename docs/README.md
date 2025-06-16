
# Customer Management System - Developer Documentation

Welcome to the Customer Management System developer documentation. This system is built with React, TypeScript, Tailwind CSS, and Supabase for backend services.

## Table of Contents

1. [Getting Started](./getting-started.md)
2. [Architecture Overview](./architecture.md)
3. [Database Schema](./database-schema.md)
4. [API Documentation](./api-documentation.md)
5. [Authentication & Security](./authentication.md)
6. [File Upload System](./file-upload.md)
7. [Status Management](./status-management.md)
8. [Component Library](./components.md)
9. [Deployment Guide](./deployment.md)
10. [Contributing Guidelines](./contributing.md)
11. [Troubleshooting](./troubleshooting.md)

## Quick Start

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Overview

This is a comprehensive customer management system designed for handling license applications with document management, status tracking, and role-based access control.

### Key Features

- **Customer Management**: Create, update, and track customer applications
- **Document Upload**: Secure file upload with categorization
- **Status Workflow**: Comprehensive status management with audit trail
- **Role-Based Access**: Admin and user roles with different permissions
- **Real-time Updates**: Live notifications and data synchronization
- **Security**: Row-level security and authentication

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Context, TanStack Query
- **Build Tool**: Vite
- **Deployment**: Lovable Platform

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Shadcn)
│   ├── Auth/           # Authentication components
│   ├── Customer/       # Customer-specific components
│   ├── Layout/         # Layout components
│   ├── Notifications/  # Notification system
│   └── Security/       # Security-related components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── lib/                # Third-party library configurations
```

## Environment Variables

Required environment variables are managed through Supabase configuration:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)

## Development Workflow

1. **Branch Strategy**: Feature branches from main
2. **Code Style**: ESLint + Prettier configuration
3. **Type Safety**: Strict TypeScript configuration
4. **Testing**: Component and integration tests
5. **CI/CD**: Automated builds and deployments

For detailed information, please refer to the specific documentation sections.
