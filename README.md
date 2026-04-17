# Simple Contracts - Full Stack Setup

A modern full-stack application built with:

- **Frontend**: React 18 + Vite + TypeScript + Redux Toolkit + RTK Query
- **Backend**: Nitro + Prisma + Better Auth
- **Database**: SQLite

## 📁 Project Structure

```
packages/
├── frontend/
│   ├── src/
│   │   ├── store/
│   │   │   ├── authApi.ts      # RTK Query API calls
│   │   │   └── store.ts        # Redux store config
│   │   ├── pages/              # Auth pages
│   │   ├── App.tsx
│   │   └── main.tsx            # Redux Provider setup
│   └── package.json
└── backend/
    ├── server/
    │   ├── routes/
    │   │   ├── auth/[...].ts   # Better Auth handler
    │   │   └── api/            # API routes
    │   └── auth.ts             # Better Auth config
    ├── prisma/
    │   └── schema.prisma       # Database schema
    └── package.json
```

## 🚀 Getting Started

### Installation

```bash
# Root workspace install
npm install

# Or individual workspace installs
cd packages/frontend && npm install
cd packages/backend && npm install
```

### Development Servers

```bash
# From root - runs both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Database Setup

```bash
cd packages/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio
npx prisma studio
```

## 🔐 Authentication Setup (Better Auth)

The backend is configured with Better Auth for email/password authentication.

### API Endpoints

- `POST /auth/sign-up` - Register new user
- `POST /auth/sign-in` - Login user
- `POST /auth/sign-out` - Logout user
- `GET /auth/session` - Get current session

### Example Request (from RTK Query)

```typescript
// src/store/authApi.ts already has these configured:
const { useLoginMutation, useSignupMutation } = authApi;

// Usage in component:
const [login, { isLoading }] = useLoginMutation();
await login({ email: "user@example.com", password: "password" }).unwrap();
```

## 📊 Redux & RTK Query

Redux Toolkit with RTK Query handles:

- **State Management**: Redux Toolkit for app state
- **API Calls**: RTK Query for efficient data fetching
- **Caching**: Automatic request caching
- **Hooks**: Pre-generated hooks for easy component integration

### Creating API Calls

Example in `src/store/authApi.ts`:

```typescript
export const authApi = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:3000/api",
        credentials: "include",
    }),
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (credentials) => ({
                url: "/auth/sign-in",
                method: "POST",
                body: credentials,
            }),
        }),
    }),
});

// Use in components:
const [login, { isLoading, error }] = useLoginMutation();
```

## 🗄️ Database Schema

The Prisma schema includes:

- **User**: User accounts with email authentication
- **Account**: OAuth/social login integration ready
- **Session**: Authentication sessions
- **VerificationToken**: Email verification tokens

## 🔧 Environment Variables

### Backend (.env)

```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="your-super-secret-key-change-in-production"
BETTER_AUTH_URL="http://localhost:3000"
```

### Frontend Configuration

Frontend API base URL configured in `src/store/authApi.ts`:

```typescript
baseUrl: 'http://localhost:3000/api',
credentials: 'include',
```

## 📦 Building for Production

```bash
# Root build (builds all workspaces)
npm run build

# Individual builds
cd packages/frontend && npm run build
cd packages/backend && npm run build
```

## 🤝 Contributing

1. TypeScript is enforced - all code should be properly typed
2. Store async operations in RTK Query, not local state
3. Use Redux hooks: `useAppDispatch`, `useAppSelector`
4. Keep API calls in separate slices/services

## 📚 Resources

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [RTK Query Guide](https://redux-toolkit.js.org/rtk-query/overview)
- [Better Auth Docs](https://better-auth.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Nitro Docs](https://nitro.unjs.io/)
- [Vite Docs](https://vitejs.dev/)
