# SimpleContracts

A multi-tenant SaaS contract management platform for organisations and businesses. Draft, review, sign, and manage contracts through a structured lifecycle with role-based access control, e-signatures, and a full audit trail.

---

## 📚 Documentation

Generated API documentation is available for each package. Run `npm run docs` from the project root to regenerate after code changes.

Two formats are produced per package:

| Package | GitHub (Markdown) | Hosted (HTML) |
|---|---|---|
| **Frontend** | [packages/frontend/docs/](./packages/frontend/docs/README.md) | _Replace with hosted URL_ |
| **Backend** | [packages/backend/docs/](./packages/backend/docs/README.md) | _Replace with hosted URL_ |

- **Markdown** (`docs/`) — rendered directly by GitHub, linked above.
- **HTML** (`docs/html/`) — full interactive site suitable for GitHub Pages, Netlify, or Vercel. Point the hosted URL placeholders above at your deployed site once set up.

> To deploy the HTML docs, push the `docs/html/` folder from either package to your static host of choice, or configure GitHub Pages to serve from that path.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript |
| **State / Data fetching** | Redux Toolkit, RTK Query |
| **Styling** | Tailwind CSS v4, Sonner (toasts) |
| **Rich text editor** | Tiptap v3 |
| **PDF export** | @react-pdf/renderer |
| **Component selects** | react-select |
| **Date handling** | dayjs |
| **Backend** | Nitro (h3), TypeScript |
| **Database ORM** | Prisma |
| **Database** | SQLite (dev) |
| **Authentication** | Better Auth |
| **Monorepo** | npm workspaces |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                   │
│  Vite dev server :5173  →  proxies /api and /auth         │
│                                                           │
│  Redux Store                                              │
│    ├── authApi      (RTK Query — /auth/*)                 │
│    ├── contractApi  (RTK Query — /api/contracts/*)        │
│    └── orgApi       (RTK Query — /api/org/*)              │
└──────────────────────────────┬───────────────────────────┘
                               │ HTTP (proxied in dev)
┌──────────────────────────────▼───────────────────────────┐
│                   Nitro Backend :3000                     │
│                                                           │
│  /auth/**       →  Better Auth handler                   │
│  /api/user      →  current session user                  │
│  /api/contracts →  contract CRUD + publish               │
│  /api/org/**    →  org, members, roles, invites          │
│  /api/invites   →  public invite accept flow             │
│                                                           │
│  Middleware:  getOrgContext / requirePermission           │
└──────────────────────────────┬───────────────────────────┘
                               │ Prisma Client
┌──────────────────────────────▼───────────────────────────┐
│                   SQLite Database                         │
│  User, Account, Session, Organization, OrgRole,          │
│  OrganizationMember, OrgInvite, Contract,                │
│  ContractVersion, ContractParty, ContractSignature,      │
│  ContractAuditLog                                        │
└──────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (workspaces support)

---

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd simple_contracts
npm install
```

### 2. Configure environment variables

Create `packages/backend/.env`:

```env
# Database
DATABASE_URL="file:./dev.db"

# Better Auth — generate a strong random secret for production
BETTER_AUTH_SECRET="change-me-to-a-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_TRUSTED_ORIGINS="http://localhost:5173"
```

### 3. Set up the database

```bash
# Apply all Prisma migrations
npm run db:migrate -w packages/backend

# (Optional) Open Prisma Studio to inspect data
npm run db:studio -w packages/backend
```

### 4. Run the development servers

```bash
# Runs backend (:3000) and frontend (:5173) concurrently
npm run dev

# Or individually:
npm run dev:backend
npm run dev:frontend
```

### 5. Verify everything is running

```bash
npm run health
```

---

## Project Structure

```
simple_contracts/
├── packages/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   └── migrations/         # Prisma migration history
│   │   ├── server/
│   │   │   ├── auth.ts             # Better Auth configuration
│   │   │   ├── db.ts               # Prisma client singleton
│   │   │   ├── routes/
│   │   │   │   ├── api/
│   │   │   │   │   ├── contracts/  # Contract CRUD endpoints
│   │   │   │   │   ├── org/        # Org, member, role, invite endpoints
│   │   │   │   │   └── invites/    # Public invite accept endpoints
│   │   │   │   └── auth/           # Better Auth catch-all handler
│   │   │   └── utils/
│   │   │       └── permissions.ts  # RBAC middleware (getOrgContext, requirePermission)
│   │   └── nitro.config.ts
│   │
│   └── frontend/
│       └── src/
│           ├── components/
│           │   ├── ui/             # Design system components (Button, Input, Select …)
│           │   ├── contracts/      # Contract editor + PDF document
│           │   └── ProtectedRoute.tsx
│           ├── config/routes/      # React Router v6 route configs
│           ├── lib/
│           │   ├── cn.ts           # Class name utility
│           │   └── dayjs.ts        # Date helpers (formatDate, fromNow …)
│           ├── pages/              # Page components (auth, contracts, org, invites)
│           └── store/
│               └── services/       # RTK Query API slices
│
├── TASKS.md                        # Phase-by-phase build roadmap
├── USER_TESTING.md                 # QA and client testing guide
└── README.md                       # This file
```

---

## Key Concepts

### Role-Based Access Control (RBAC)

Every user belongs to one organisation. Within that org they are assigned an `OrgRole` which carries a JSON array of permission keys:

| Permission key | Description |
|---|---|
| `create_contracts` | Draft and edit contracts |
| `create_templates` | Create and manage contract templates |
| `review_contracts` | Be assigned as a reviewer |
| `approve_contracts` | Approve or reject contracts |
| `send_for_signing` | Send a contract out for e-signature |
| `manage_users` | Invite, remove, and reassign members |
| `manage_roles` | Create and edit roles |
| `view_reports` | Access the reporting dashboard |
| `manage_org` | Edit organisation settings |

Four system roles are seeded for every new organisation: **Admin**, **Contract Manager**, **Contract Creator**, **Viewer**.

All API routes are guarded by `getOrgContext(event)` (membership check) or `requirePermission(event, permission)` (permission check). See [backend docs](./packages/backend/docs/README.md) for details.

### Contract Lifecycle

```
DRAFT → REVIEW → SENT_FOR_SIGNING → ACTIVE → EXPIRED
                                           ↘ TERMINATED
```

Status transitions are validated server-side. Backward transitions (except `REVIEW → DRAFT` on rejection) are blocked.

### Frontend Route Guards

`ProtectedRoute` wraps every authenticated page and enforces:
1. **Authentication** — redirects to `/auth/login` with a `from` state if not logged in
2. **Org membership** — redirects to `/org/onboarding` if the user has no organisation
3. **Permission** — shows an inline 403 screen if an optional `permission` prop is not satisfied

---

## API Routes Reference

### Authentication (`/auth/*`)

Handled by Better Auth. Key endpoints:

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/sign-up/email` | Register a new user |
| `POST` | `/auth/sign-in/email` | Log in |
| `POST` | `/auth/sign-out` | Log out |
| `GET` | `/auth/get-session` | Current session + user |

### Contracts (`/api/contracts/*`)

| Method | Path | Permission required | Description |
|---|---|---|---|
| `GET` | `/api/contracts` | org member | List all contracts in the org |
| `GET` | `/api/contracts/:id` | org member | Get a single contract |
| `POST` | `/api/contracts/drafts` | `create_contracts` | Save or update a draft |
| `POST` | `/api/contracts/publish` | `create_contracts` | Move draft → review |

### Organisation (`/api/org/*`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/org` | org member | Get org details + caller's permissions |
| `POST` | `/api/org` | auth only | Create an org (onboarding) |
| `PUT` | `/api/org` | `manage_org` | Update org name / legal name |
| `GET` | `/api/org/members` | org member | List all members |
| `PUT` | `/api/org/members/:id` | `manage_users` | Change a member's role |
| `DELETE` | `/api/org/members/:id` | `manage_users` | Remove a member |
| `GET` | `/api/org/roles` | org member | List all roles (with member counts) |
| `POST` | `/api/org/roles` | `manage_roles` | Create a custom role |
| `PUT` | `/api/org/roles/:id` | `manage_roles` | Update a role |
| `DELETE` | `/api/org/roles/:id` | `manage_roles` | Delete a custom role |
| `GET` | `/api/org/invites` | `manage_users` | List pending invites |
| `POST` | `/api/org/invites` | `manage_users` | Send an invite email/link |
| `DELETE` | `/api/org/invites/:id` | `manage_users` | Revoke an invite |

### Invites (public)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/invites/:token` | none | Validate invite token (returns details) |
| `POST` | `/api/invites/:token/accept` | required | Accept invite and join org |

---

## Design System

The frontend ships a component library at `src/components/ui/` built on Tailwind CSS v4 design tokens.

### Tokens (defined in `src/index.css` `@theme` block)

| Token group | Example class | Purpose |
|---|---|---|
| `brand-{50..950}` | `bg-brand-600` | Primary accent (indigo — swap to rebrand) |
| `status-{draft,review,signing,active,expired,terminated}` | `text-status-draft` | Contract lifecycle colours |
| `surface-{0,1,2,3}` | `bg-surface-1` | Background scale |
| `content-{primary,secondary,muted,disabled}` | `text-content-muted` | Text scale |

### Components

Import from `@/components/ui`:

```tsx
import { Button, Input, Select, Card, Badge, StatusBadge,
         FormField, PageShell, PageHeader, EmptyState } from "@/components/ui";
```

See [frontend docs](./packages/frontend/docs/README.md) for full component API.

---

## Generating Documentation

```bash
# Generate docs for both packages
npm run docs

# Or per package
npm run docs -w packages/frontend
npm run docs -w packages/backend
```

Output is written to `packages/frontend/docs/` and `packages/backend/docs/`. Commit these folders only if you are **not** using a CI-generated hosted docs site.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start both servers concurrently |
| `npm run dev:backend` | Backend only |
| `npm run dev:frontend` | Frontend only |
| `npm run build` | Production build for all packages |
| `npm run health` | Ping both backend and proxy health checks |
| `npm run docs` | Generate API docs for all packages |
| `npm run db:migrate -w packages/backend` | Run Prisma migrations |
| `npm run db:studio -w packages/backend` | Open Prisma Studio |

---

## Environment Variables

| Variable | Package | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | backend | ✅ | Prisma database connection string |
| `BETTER_AUTH_SECRET` | backend | ✅ | Session signing secret (≥ 32 chars in production) |
| `BETTER_AUTH_URL` | backend | ✅ | Backend base URL |
| `BETTER_AUTH_TRUSTED_ORIGINS` | backend | ✅ | Comma-separated list of allowed frontend origins |

---

## Production Build

```bash
npm run build
npm run preview -w packages/backend
```

Deploy `packages/frontend/dist/` to any static host. Configure it to rewrite all routes to `index.html` for SPA routing.

---

## Build Roadmap

See [TASKS.md](./TASKS.md) for the full phase-by-phase feature roadmap.

| Phase | Status | Description |
|---|---|---|
| 1 — Multi-tenancy & RBAC | ✅ Done | Org setup, roles, invites, route guards |
| 2 — Contract Lifecycle | 🔲 Next | Status machine, review & approval workflow |
| 3 — Templates | 🔲 Pending | Template CRUD, placeholder filling |
| 4 — E-Signatures | 🔲 Pending | Signatory management, secure signing links |
| 5 — PDF Export | ✅ Done | Contract PDF with content + signature block |
| 6 — Search & Reporting | 🔲 Pending | Full-text search, dashboard reports |

---

## Contributing

1. Branch off `develop` using the convention `feat/<short-description>` or `fix/<short-description>`
2. Keep PRs focused — one feature or fix per PR
3. Run `npx tsc --noEmit` in both packages before pushing
4. Update `TASKS.md` when completing a phase item
5. Add entries to `USER_TESTING.md` for any new user-facing flows
