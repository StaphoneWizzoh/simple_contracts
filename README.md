# SimpleContracts

A multi-tenant SaaS contract management platform for organisations and businesses. Draft, review, approve, sign, and manage contracts through a structured lifecycle with role-based access control, e-signatures, and a full audit trail.

---

## 📚 Documentation

Generated API documentation is available for each package. Run `npm run docs` from the project root to regenerate after code changes.

| Package | GitHub (Markdown) | Hosted (HTML) |
|---|---|---|
| **Frontend** | [packages/frontend/docs/](./packages/frontend/docs/README.md) | _Replace with hosted URL_ |
| **Backend** | [packages/backend/docs/](./docs/README.md) | _Replace with hosted URL_ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript |
| **State / Data fetching** | Redux Toolkit, RTK Query |
| **Styling** | Tailwind CSS v4, Sonner (toasts) |
| **Rich text editor** | Tiptap v3 |
| **PDF export** | @react-pdf/renderer |
| **Component selects** | react-select |
| **Date handling** | dayjs |
| **Backend** | Nitro 2 (h3), TypeScript |
| **Database ORM** | Prisma 5 |
| **Database** | SQLite (dev) |
| **Authentication** | Better Auth 1.6 |
| **Monorepo** | npm workspaces |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                      │
│  Vite dev server :5173  →  proxies /api and /auth             │
│                                                               │
│  Redux Store                                                  │
│    ├── authApi      (RTK Query — /auth/*)                     │
│    ├── contractApi  (RTK Query — /api/contracts/*)            │
│    └── orgApi       (RTK Query — /api/org/*)                  │
└──────────────────────────────┬────────────────────────────────┘
                               │ HTTP (proxied in dev)
┌──────────────────────────────▼────────────────────────────────┐
│                    Nitro Backend :3000                         │
│                                                               │
│  /auth/**                →  Better Auth handler               │
│  /api/contracts          →  list + CRUD                       │
│  /api/contracts/:id      →  detail + settings                 │
│  /api/contracts/:id/*    →  lifecycle actions (see routes)    │
│  /api/org/**             →  org, members, roles, invites      │
│  /api/invites/**         →  public invite accept flow         │
│  /api/sign/**            →  public signing endpoints          │
│  /sign/:token            →  public signing page (no login)    │
│                                                               │
│  Plugins (run at startup):                                    │
│    expire-contracts      →  hourly auto-expire cron           │
│                                                               │
│  Middleware:  getOrgContext / requirePermission               │
│  Utilities:  assertTransition (status machine), rateLimit     │
└──────────────────────────────┬────────────────────────────────┘
                               │ Prisma Client
┌──────────────────────────────▼────────────────────────────────┐
│                      SQLite Database                           │
│  User, Account, Session, Organization, OrgRole,               │
│  OrganizationMember, OrgInvite, Contract, ContractVersion,    │
│  ContractParty, ContractSignature, SigningToken,               │
│  ContractAuditLog, ContractApproval                           │
└───────────────────────────────────────────────────────────────┘
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
│   │   │   ├── schema.prisma            # Database schema (single source of truth)
│   │   │   └── migrations/              # Prisma migration history
│   │   └── server/
│   │       ├── auth.ts                  # Better Auth configuration
│   │       ├── db.ts                    # Prisma client singleton
│   │       ├── plugins/
│   │       │   └── expire-contracts.ts  # Hourly auto-expire for ACTIVE contracts
│   │       ├── utils/
│   │       │   ├── permissions.ts       # RBAC: getOrgContext, requirePermission
│   │       │   └── contractStatus.ts    # Status machine: assertTransition
│   │       └── routes/api/
│   │           ├── contracts/
│   │           │   ├── index.get.ts     # List all org contracts
│   │           │   ├── [id].get.ts      # Contract detail + settings
│   │           │   ├── drafts.post.ts   # Save/update a draft
│   │           │   ├── publish.post.ts  # DRAFT → REVIEW
│   │           │   └── [id]/
│   │           │       ├── approvals.get.ts       # List approvers + status
│   │           │       ├── audit.get.ts           # Full audit trail
│   │           │       ├── reviewers.post.ts      # Assign approvers
│   │           │       ├── approve.post.ts        # Approver acts: APPROVED
│   │           │       ├── reject.post.ts         # Approver acts: REJECTED → DRAFT
│   │           │       ├── send-for-signing.post.ts  # REVIEW → SENT_FOR_SIGNING
│   │           │       ├── terminate.post.ts      # ACTIVE → TERMINATED
│   │           │       ├── settings.patch.ts      # Update contract settings
│   │           │       ├── signatories.get.ts     # List signatories
│   │           │       ├── signatories.post.ts    # Add a signatory
│   │           │       └── signatories/[partyId]/
│   │           │           ├── invite.post.ts     # Generate signing link
│   │           │           └── [partyId].delete.ts
│   │           ├── sign/
│   │           │   └── [token]/
│   │           │       ├── [token].get.ts         # Validate token + record VIEWED
│   │           │       ├── submit.post.ts         # Submit signature → auto-activate
│   │           │       └── decline.post.ts        # Decline with reason
│   │           └── org/                 # Org, member, role, invite endpoints
│   │
│   └── frontend/src/
│       ├── components/
│       │   ├── ui/                      # Design system (Button, Input, Badge …)
│       │   ├── contracts/
│       │   │   ├── ContractEditor.tsx         # TipTap rich-text editor
│       │   │   ├── ContractPdfDocument.tsx    # @react-pdf/renderer template
│       │   │   ├── ContractSettingsPanel.tsx  # Type/dates/value/workflow settings
│       │   │   └── ContractApprovalPanel.tsx  # Reviewer assignment + approve/reject UI
│       │   └── ProtectedRoute.tsx
│       ├── config/routes/               # File-split React Router v6 route configs
│       ├── pages/
│       │   ├── contracts/
│       │   │   ├── ContractsPage.tsx    # Contract list with status badges
│       │   │   └── ContractEditorPage.tsx  # Status-aware editor/viewer page
│       │   ├── signing/
│       │   │   └── SigningPage.tsx      # Public signing page (no login required)
│       │   ├── org/                     # Onboarding, Settings, Members, Roles
│       │   ├── auth/                    # Login, Signup
│       │   └── invites/                 # Accept invite page
│       └── store/services/
│           ├── contractApi.ts           # All contract RTK Query endpoints + types
│           ├── orgApi.ts                # Org/members/roles/invites RTK Query
│           ├── signingApi.ts            # Public signing RTK Query (no auth)
│           └── authApi.ts              # Auth RTK Query
│
├── TASKS.md                             # Phase-by-phase build roadmap
└── README.md                            # This file
```

---

## Key Concepts

### Role-Based Access Control (RBAC)

Every user belongs to one organisation. Within that org they are assigned an `OrgRole` which carries a JSON array of permission keys:

| Permission key | Description |
|---|---|
| `create_contracts` | Draft, edit, and submit contracts for review |
| `create_templates` | Create and manage contract templates |
| `review_contracts` | Be assigned as a contract reviewer |
| `approve_contracts` | Approve or reject contracts; assign reviewers |
| `send_for_signing` | Send approved contracts out for e-signature |
| `manage_users` | Invite, remove, and reassign members |
| `manage_roles` | Create and edit custom roles |
| `view_reports` | Access the reporting dashboard |
| `manage_org` | Edit organisation settings; terminate active contracts |

Four system roles are seeded for every new organisation: **Admin**, **Contract Manager**, **Contract Creator**, **Viewer**.

All API routes are guarded by `getOrgContext(event)` (membership check) or `requirePermission(event, permission)` (permission + membership check).

### Contract Lifecycle

Contracts flow through a strict state machine. Backward transitions (except rejection) are blocked server-side by `assertTransition()`.

```
                    ┌─── rejection ───┐
                    ▼                 │
DRAFT  →  REVIEW  →  SENT_FOR_SIGNING  →  ACTIVE  →  EXPIRED (auto, hourly)
                                                  ↘  TERMINATED (manual)
```

| Transition | Triggered by | Permission required |
|---|---|---|
| `DRAFT → REVIEW` | "Submit for Review" | `create_contracts` |
| `REVIEW → DRAFT` | Approval rejection | assigned approver or `approve_contracts` |
| `REVIEW → SENT_FOR_SIGNING` | "Send for Signing" | `send_for_signing` (all approvals must be done) |
| `SENT_FOR_SIGNING → ACTIVE` | All signatories sign | _Phase 4 — automated_ |
| `ACTIVE → EXPIRED` | Hourly background job | automatic (when `expiresAt` is past) |
| `ACTIVE → TERMINATED` | Manual termination | `manage_org` |

### Review & Approval Workflow

When a contract is in `REVIEW` status, users with `approve_contracts` can assign approvers from org members. Two workflow modes are supported:

- **Simultaneous** — all assigned approvers can act in any order
- **Sequential** — approvers must act in the assigned order (0, 1, 2…); an approver is blocked until everyone before them has approved

Once all approvals are complete (or if none were required), a user with `send_for_signing` can advance the contract to `SENT_FOR_SIGNING`. Any rejection by an assigned approver immediately moves the contract back to `DRAFT` and cancels all other pending approvals.

### Contract Settings

Per-contract settings can be configured in `DRAFT` or `REVIEW` status:

| Setting | Values |
|---|---|
| Contract type | NDA, Service Agreement, Employment, Consulting, Lease, Purchase, Partnership, Other |
| Effective date | Date |
| Expiry date | Date — triggers auto-expire when passed |
| Contract value | Decimal amount + currency code |
| Approval workflow | Simultaneous / Sequential |
| Signing order | Simultaneous / Sequential |
| Signature type | Typed / Drawn / Either |
| Signing link expiry | 7 / 14 / 30 / 60 days |

### E-Signature Flow

1. Add signatories to a contract — name, email, title, org, signing order (no app account needed)
2. Send contract for signing (`REVIEW → SENT_FOR_SIGNING`)
3. Generate a signing link per signatory — `POST /api/contracts/:id/signatories/:partyId/invite`
   - Token is a random UUID stored as SHA-256 hash in `SigningToken`; the plain token appears only in the response URL
4. Signatory opens `/sign/:token` (public, no login) — views contract, chooses typed or drawn signature, gives legal consent
5. Sequential mode: a signatory can only sign after all predecessors (lower `signingOrder`) have signed
6. When all signatories have signed, the contract auto-transitions to `ACTIVE`
7. Every step (viewed, signed, declined, activated) is written to `ContractAuditLog`

### Frontend Route Guards

`ProtectedRoute` wraps every authenticated page and enforces:
1. **Authentication** — redirects to `/auth/login` with a `from` state if not logged in
2. **Org membership** — redirects to `/org/onboarding` if the user has no organisation
3. **Permission** — shows an inline 403 screen if an optional `permission` prop is not satisfied

---

## API Routes Reference

### Authentication (`/auth/*`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/sign-up/email` | Register a new user |
| `POST` | `/auth/sign-in/email` | Log in |
| `POST` | `/auth/sign-out` | Log out |
| `GET` | `/auth/get-session` | Current session + user |

### Contracts (`/api/contracts/*`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/contracts` | org member | List all contracts in the org |
| `GET` | `/api/contracts/:id` | org member | Full contract detail + settings |
| `POST` | `/api/contracts/drafts` | `create_contracts` | Save or update a draft |
| `POST` | `/api/contracts/publish` | `create_contracts` | Move `DRAFT → REVIEW` |
| `PATCH` | `/api/contracts/:id/settings` | `create_contracts` | Update contract type, dates, value, workflow settings |
| `GET` | `/api/contracts/:id/approvals` | org member | List assigned approvers and their status |
| `GET` | `/api/contracts/:id/audit` | org member | Full chronological audit trail |
| `POST` | `/api/contracts/:id/reviewers` | `approve_contracts` | Assign/replace approvers + set workflow mode |
| `POST` | `/api/contracts/:id/approve` | assigned approver | Submit an approval (with optional comment) |
| `POST` | `/api/contracts/:id/reject` | assigned approver or `approve_contracts` | Reject → contract returns to `DRAFT` |
| `POST` | `/api/contracts/:id/send-for-signing` | `send_for_signing` | Advance `REVIEW → SENT_FOR_SIGNING` |
| `POST` | `/api/contracts/:id/terminate` | `manage_org` | Terminate an active contract with optional reason |

### Organisation (`/api/org/*`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/org` | org member | Org details + caller's permissions |
| `POST` | `/api/org` | auth only | Create an org (onboarding) |
| `PUT` | `/api/org` | `manage_org` | Update org name / legal name |
| `GET` | `/api/org/members` | org member | List all members |
| `PUT` | `/api/org/members/:id` | `manage_users` | Change a member's role |
| `DELETE` | `/api/org/members/:id` | `manage_users` | Remove a member |
| `GET` | `/api/org/roles` | org member | List all roles |
| `POST` | `/api/org/roles` | `manage_roles` | Create a custom role |
| `PUT` | `/api/org/roles/:id` | `manage_roles` | Update a role |
| `DELETE` | `/api/org/roles/:id` | `manage_roles` | Delete a custom role |
| `GET` | `/api/org/invites` | `manage_users` | List pending invites |
| `POST` | `/api/org/invites` | `manage_users` | Send an invite |
| `DELETE` | `/api/org/invites/:id` | `manage_users` | Revoke an invite |

### Signatories & Signing (`/api/contracts/:id/signatories/*`, `/api/sign/*`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/contracts/:id/signatories` | org member | List signatories for a contract |
| `POST` | `/api/contracts/:id/signatories` | `send_for_signing` | Add a signatory (name, email, title, org, order) |
| `DELETE` | `/api/contracts/:id/signatories/:partyId` | `send_for_signing` | Remove a signatory |
| `POST` | `/api/contracts/:id/signatories/:partyId/invite` | `send_for_signing` | Generate/regenerate signing link |
| `GET` | `/api/sign/:token` | none | Validate token, return contract + signatory (records VIEWED) |
| `POST` | `/api/sign/:token/submit` | none | Submit signature data (typed text or drawn PNG) |
| `POST` | `/api/sign/:token/decline` | none | Decline to sign with optional reason |

### Invites (public)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/invites/:token` | none | Validate invite token (returns org + role details) |
| `POST` | `/api/invites/:token/accept` | required | Accept invite and join org |

---

## Database Schema

Key models and their purpose:

| Model | Purpose |
|---|---|
| `User` | Auth identity (managed by Better Auth) |
| `Organization` | Top-level tenant |
| `OrgRole` | Org-scoped role with JSON permissions array |
| `OrganizationMember` | User ↔ Org membership with assigned role |
| `OrgInvite` | Time-limited email invite tokens |
| `Contract` | Core contract record — status, settings, ownership |
| `ContractVersion` | Immutable content snapshots (HTML + text + JSON) |
| `ContractParty` | External signatories (no app account required) |
| `ContractSignature` | Per-party signing status, signature data, IP, user agent |
| `SigningToken` | SHA-256-hashed single-use token with expiry per signature |
| `ContractApproval` | Per-approver approval record (order, status, comment) |
| `ContractAuditLog` | Immutable event log for every contract action |

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start both servers concurrently |
| `npm run dev:backend` | Backend only (port 3000) |
| `npm run dev:frontend` | Frontend only (port 5173) |
| `npm run build` | Production build for all packages |
| `npm run health` | Ping both backend and proxy health checks |
| `npm run docs` | Generate API docs for all packages |
| `npm run db:migrate -w packages/backend` | Apply Prisma migrations |
| `npm run db:studio -w packages/backend` | Open Prisma Studio |

---

## Environment Variables

| Variable | Package | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | backend | ✅ | Prisma connection string (`file:./dev.db` for SQLite) |
| `BETTER_AUTH_SECRET` | backend | ✅ | Session signing secret (≥ 32 chars in production) |
| `BETTER_AUTH_URL` | backend | ✅ | Backend base URL |
| `BETTER_AUTH_TRUSTED_ORIGINS` | backend | ✅ | Comma-separated allowed frontend origins |

---

## Production Build

```bash
npm run build
```

Deploy `packages/frontend/dist/` to any static host. Configure it to rewrite all routes to `index.html` for SPA routing. The backend output is in `packages/backend/.output/`.

---

## Build Roadmap

See [TASKS.md](./TASKS.md) for the full phase-by-phase feature roadmap.

| Phase | Status | Description |
|---|---|---|
| 1 — Multi-tenancy & RBAC | ✅ Done | Org setup, custom roles, invite flow, route guards |
| 2 — Contract Lifecycle & Workflow | ✅ Done | Status machine, approval workflow, settings panel, auto-expire |
| 3 — Contract Templates | 🟡 Partial | Template CRUD ✅, "create from template" ✅, variable versioning pending |
| 4 — E-Signatures | ✅ Done | Signatory management, secure signing links, public signing page, auto-activation |
| 5 — PDF Export | 🟡 Partial | Contract PDF done; signature block + audit summary page pending |
| 6 — Search & Reporting | 🔲 Pending | Full-text search, dashboard reports, CSV/PDF export |
| 7 — Recurring Contracts | ⏭ Deferred | Auto-renewal scheduling (nice-to-have) |
| 8 — Notifications | ⏭ Deferred | In-app + email notifications (nice-to-have) |

---

## Contributing

1. Branch off `develop` using `feat/<short-description>` or `fix/<short-description>`
2. Keep PRs focused — one feature or fix per PR
3. Run `npx tsc --noEmit` in both packages before pushing
4. Update `TASKS.md` checkboxes when completing phase items
5. Run `npm run db:migrate -w packages/backend` after any schema changes and commit the generated migration file
