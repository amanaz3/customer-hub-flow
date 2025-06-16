
# Getting Started

This guide will help you set up the development environment and get the Customer Management System running locally.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: For version control
- **Supabase Account**: For backend services

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd customer-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

The application uses Supabase for backend services. The configuration is already set up in `src/lib/supabase.ts`:

```typescript
const supabaseUrl = 'https://gddibkhyhcnejxthsyzu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## Database Setup

The database schema is automatically managed through Supabase. Key tables include:

- `profiles`: User profile information
- `customers`: Customer application data
- `documents`: Document metadata and file references
- `status_changes`: Audit trail for status changes
- `comments`: Customer application comments

## Authentication Setup

The system uses Supabase Auth with email/password authentication:

1. **User Registration**: Users can sign up with email/password
2. **Profile Creation**: Automatic profile creation on signup
3. **Role Assignment**: Default role is 'user', admins are assigned manually
4. **Session Management**: Handled by Supabase Auth

## First Time Setup

1. **Create Admin User**:
   - Sign up through the application
   - Manually update the user's role to 'admin' in Supabase dashboard
   - Access: `Supabase Dashboard > Authentication > Users > Edit User`

2. **Verify Permissions**:
   - Test customer creation as a user
   - Test admin functions (status updates, user management)
   - Verify file upload functionality

## Development Tips

### Hot Reloading
The development server supports hot module replacement for fast development cycles.

### TypeScript
The project uses strict TypeScript configuration. All components should be properly typed.

### Styling
- Use Tailwind CSS classes for styling
- Leverage Shadcn/UI components when possible
- Follow the existing design system

### State Management
- Use React Context for global state
- TanStack Query for server state management
- Local state with useState for component-specific state

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill process on port 5173
   npx kill-port 5173
   ```

2. **Supabase Connection Issues**:
   - Verify Supabase project is active
   - Check network connectivity
   - Verify API keys are correct

3. **Build Errors**:
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Getting Help

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Review [Component Documentation](./components.md)
- Consult [API Documentation](./api-documentation.md)

## Next Steps

After setting up the development environment:

1. Review the [Architecture Overview](./architecture.md)
2. Understand the [Database Schema](./database-schema.md)
3. Explore the [Component Library](./components.md)
4. Read the [Contributing Guidelines](./contributing.md)
