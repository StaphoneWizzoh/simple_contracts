# Contract Management App — Build Roadmap

> Target: SaaS contract management platform for organisations and businesses (Odoo-style).  
> Stack: React + Vite + Redux/RTK Query (frontend) · Nitro + Prisma + SQLite (backend) · Better Auth

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[~]` In progress
- `[-]` Deferred / nice-to-have

---

## Phase 1 — Multi-tenancy & Organisation Setup

### 1.1 Organisation Onboarding

- [x] Org creation flow on first signup (name, legal name) — `OrgOnboardingPage`
- [x] Invite members to org via email (generates time-limited token) — `POST /api/org/invites`
- [x] Accept invite flow — `/invites/:token` public page, requires login to accept
- [x] Org settings page — `/org/settings`
- [-] Logo upload (deferred — needs file storage)

### 1.2 Custom RBAC (Role-Based Access Control)

- [x] Predefined base permission set:
    - `create_contracts`, `create_templates`, `review_contracts`, `approve_contracts`
    - `send_for_signing`, `manage_users`, `manage_roles`, `view_reports`, `manage_org`
- [x] Role management UI (`/org/roles`) — create, edit, delete custom roles with permission checkboxes
- [x] Assign/change roles for org members (`/org/members`)
- [x] Permission guard middleware (`requirePermission`, `getOrgContext`) on all org/member/role/invite routes
- [x] Seed default roles per new org: Admin, Contract Manager, Contract Creator, Viewer
- [x] Permission guard on frontend routes — `ProtectedRoute` component (auth → login, no org → onboarding, no permission → 403 screen)
- [x] `requirePermission(CREATE_CONTRACTS)` on drafts + publish routes; `getOrgContext` on list + detail routes
- [x] Login page respects `from` redirect state set by `ProtectedRoute`

### 1.3 Database Changes

- [x] `OrgRole` model — org-scoped roles with JSON permission set, `isSystemRole` flag
- [x] `OrganizationMember.roleId` → FK to `OrgRole`
- [x] `OrgInvite` model — email, token, expiresAt, status, roleId, invitedByUserId
- [x] Migration: `20260419072522_add_rbac`

---

## Phase 2 — Contract Lifecycle & Workflow

### 2.1 Contract Status Machine

Full lifecycle: **Draft → Review → Sent for Signing → Active → Expired / Terminated**

- [x] Update `Contract.status` enum to: `DRAFT | REVIEW | SENT_FOR_SIGNING | ACTIVE | EXPIRED | TERMINATED`
- [x] Status transition validation on backend (cannot skip stages, cannot go backwards except to DRAFT from REVIEW)
- [x] `ACTIVE → SENT_FOR_SIGNING` recovery transition added for "Reopen for Signing" use case
- [x] Auto-expire contracts: background job/cron that sets `ACTIVE → EXPIRED` when `expiresAt` is past
- [x] Manual termination endpoint with reason field

### 2.2 Review & Approval Workflow

- [x] Contract review assignment — creator assigns one or more reviewers (org members with `review_contracts` permission)
- [x] Approval workflow settings per contract:
    - **Sequential** — approvers must approve in a defined order (1st then 2nd then 3rd)
    - **Simultaneous** — all approvers can act in any order; contract advances when all have approved
- [x] `ContractApproval` model:
    - `contractId`, `approverId` (userId), `order` (Int for sequential), `status` (PENDING | APPROVED | REJECTED), `comment`, `actedAt`
- [x] Reviewer/approver action UI — approve or reject with optional comment
- [x] Rejection flow — contract goes back to DRAFT with rejection comment logged
- [x] Audit log entries for every approval/rejection action

### 2.3 Contract Settings Panel

Per-contract settings the creator can configure:

- [x] Approval workflow type (sequential / simultaneous)
- [x] Signing order for signatories (sequential / simultaneous)
- [x] Signature type accepted (typed name / drawn / both)
- [x] Signing link expiry duration (e.g., 7 days, 14 days, 30 days)
- [x] Effective date and expiry date
- [x] Contract value and currency
- [x] Contract type (Service Agreement, NDA, Employment, etc. — configurable list)

---

## Phase 3 — Contract Templates 🟡 PARTIAL (2026-05-09)

### 3.1 Template System ✅

- [x] `ContractTemplate` model:
    - `id`, `organizationId`, `title`, `description`, `contentHtml`, `contentJson`, `contentText`, `contractType`, `createdByUserId`, `isActive`, `version`, `createdAt`, `updatedAt`
- [x] Variables stored as JSON in template (deferred editable form UI)
- [x] Template CRUD API endpoints (guarded by `create_templates` permission):
    - `GET /api/templates` — list active templates
    - `POST /api/templates` — create
    - `GET /api/templates/:id` — detail with parsed variables
    - `PUT /api/templates/:id` — update
    - `DELETE /api/templates/:id` — soft delete
- [x] Template management UI:
    - `/templates` — list page with empty state
    - `/templates/new` — create template
    - `/templates/:id` — edit template
    - Uses same TipTap editor as contracts
- [x] "Create contract from template" flow:
    - `POST /api/contracts/from-template/:templateId` — creates draft with pre-filled content
    - Frontend: `?templateId=` query param on `/contracts/new`
    - "Use" button on template cards
    - Contract opens in editor with template content ready to edit
- [ ] Template versioning — `version` field added but UI not implemented (nice-to-have)

---

## Phase 4 — E-Signature Workflow

### 4.1 Signatory Management

- [x] Add signatories to a contract (name, email, title, organisation, signing order)
- [x] Signatories do **not** need app accounts
- [x] Per-contract setting: sequential or simultaneous signing

### 4.2 Secure Signing Links

- [x] `SigningToken` model:
    - `id`, `contractSignatureId`, `token` (UUID, hashed in DB), `expiresAt`, `usedAt`
- [x] Generate unique signing link per signatory: `/sign/{token}`
- [x] Link expiry enforced server-side (duration set in contract settings)
- [x] Token single-use (invalidated after signing or declining)
- [x] Resend / regenerate signing link (old token invalidated)

### 4.3 Signing Experience (No Login Required)

- [x] Public signing page `/sign/:token`:
    - Verify token validity (not expired, not used)
    - Display full contract content (read-only)
    - Show signatory details
    - Signature capture — based on contract setting:
        - **Typed** — full legal name text input
        - **Drawn** — canvas-based signature pad (`react-signature-canvas`)
        - **Both** — signatory chooses
    - Consent checkbox ("I agree this is my legal signature")
    - "Sign" and "Decline" actions
- [x] On sign: capture and store:
    - Signature image/text
    - IP address
    - User agent / browser fingerprint
    - Timestamp (UTC)
    - Geolocation (if consented — optional)
- [x] Sequential signing: next signatory link only sent/activated after previous signs
- [x] Simultaneous signing: all links active at once
- [x] On all signatories signed: auto-transition contract to `ACTIVE`

### 4.4 Audit Trail

- [x] Audit events per contract:
    - Signatory added
    - Signing link generated
    - Signatory viewed link (IP, timestamp, user agent)
    - Signatory signed (IP, user agent, timestamp, signature type)
    - Signatory declined (with reason)
    - Contract auto-activated when all signed
- [x] Audit trail API endpoint (`GET /api/contracts/:id/audit`)
- [x] Audit trail UI component on contract detail page (`ContractAuditLogPanel` — chronological timeline with event icons, actor, and detail expansion)

---

## Phase 5 — PDF Generation & Export

### 5.1 PDF Export

- [x] Install `@react-pdf/renderer` in frontend
- [x] Contract PDF template (`ContractPdfDocument.tsx`):
    - Org name, contract number, status badge
    - Contract title, type, effective/expiry dates, counterparty, version, created/updated dates
    - Full contract content (HTML parsed to PDF elements via `htmlToPdfElements.tsx`)
    - Signature block (issuing party + counterparty)
    - Page numbers and generated timestamp in footer
- [x] "Download PDF" button on contract editor page (visible when editing existing contracts)
- [x] HTML-to-PDF parser supporting: headings, paragraphs, bold, italic, underline, strikethrough, code, blockquote, ordered & unordered lists, hr
- [x] Signature block: populated with actual signatories — typed name rendered in italic, drawn PNG rendered as image; unsigned/declined states shown with colour-coded boxes
- [x] Audit trail summary page in PDF — second page appended to the document with a full chronological event table
- [x] Signed contract PDF auto-generated and stored in DB on first load of an ACTIVE contract; served via `GET /api/contracts/:id/signed-pdf`; "Download Signed PDF" (emerald) button in UI

---

## Phase 6 — Search & Reporting

### 6.1 Contract Search & Filtering

- [ ] Full-text search on contract title and content (using `contentText` field)
- [ ] Filter by: status, contract type, counterparty, date range (created, effective, expiry), assigned reviewer/approver, value range
- [ ] Sort by: date created, date updated, expiry date, contract value, status
- [ ] Saved search / filter presets

### 6.2 Reporting Dashboard

Available reports (all exportable to PDF/CSV):

- [ ] **Contracts by Status** — count by status with trend over time
- [ ] **Expiring Soon** — contracts expiring in 30 / 60 / 90 days (configurable)
- [ ] **Contracts by Type** — breakdown by contract type
- [ ] **Contracts by Party** — all contracts with a specific counterparty
- [ ] **Signing Turnaround** — time from "sent for signing" to fully signed
- [ ] **Approval Turnaround** — time from review assignment to approval
- [ ] **Contracts by Creator / Owner** — per-user activity
- [ ] **Overdue Approvals** — contracts stuck in review/approval stage
- [ ] **Total Contract Value** — sum/average by status, type, date range
- [ ] **Renewal Pipeline** — contracts expiring in upcoming periods needing renewal action
- [ ] Report filters: date range, org member, contract type, status
- [ ] Export report to CSV and PDF

---

## Phase 7 — Recurring Contracts (Nice-to-Have)

- [-] `RecurringSchedule` model — frequency (monthly, quarterly, annually), next renewal date, auto-renew flag
- [-] Auto-generate renewal contract draft N days before expiry (configurable lead time)
- [-] Renewal notification to contract owner
- [-] Renewal dashboard widget

---

## Phase 8 — Notifications (Future)

- [-] In-app notification system (bell icon, notification list)
- [-] Email notifications for:
    - Assigned as reviewer/approver
    - Contract sent for signing (to signatory)
    - Signature received
    - Contract fully signed / activated
    - Contract expiring soon
    - Approval rejected
    - Invite to organisation

---

## Cross-Cutting Concerns

### Security

- [x] Rate limiting on signing endpoints (10 req / 60 s per IP on submit and decline)
- [ ] Rate limiting on invite endpoints
- [ ] CSRF protection on state-changing routes
- [x] Signing token stored as SHA-256 hash (never plaintext) in DB; plain token returned once and never re-queryable
- [x] All API routes verify org membership before data access
- [ ] Sensitive audit fields (IP, user agent) stored encrypted or access-controlled

### UX / UI

- [ ] Global navigation with org switcher (for users in multiple orgs)
- [ ] Contract detail page (view, timeline, settings, parties, signatures — all in one)
- [ ] Responsive design (mobile-friendly for signing page especially)
- [ ] Toast / notification feedback on all user actions
- [ ] Loading skeletons on data fetches
- [ ] Empty states (no contracts yet, no templates yet)

### Testing Checkpoints

- [ ] Unit tests: permission guard logic, status transition rules, token expiry logic
- [ ] Integration tests: full contract lifecycle API (draft → review → signing → active)
- [ ] E2E tests: signing flow via public link (no auth)
- [ ] Load test: PDF generation under concurrent requests

---

## Current State (Baseline)

| Area                               | Status                                        |
| ---------------------------------- | --------------------------------------------- |
| Auth (email/password login/signup) | Done                                          |
| Organisation auto-creation         | Done (basic)                                  |
| Contract CRUD (draft, list, view)  | Done                                          |
| Publish contract (DRAFT → REVIEW)  | Done                                          |
| Rich text editor (Tiptap)          | Done                                          |
| Contract versioning                | Done                                          |
| Audit log (basic)                  | Done                                          |
| RBAC                               | Done                                          |
| Templates                          | Partial (CRUD + create from template done)    |
| Approval workflow                  | Done                                          |
| E-signatures                       | Done                                          |
| PDF export                         | Done (basic — no signatories/audit trail yet) |
| Reporting                          | Not started                                   |

[https://www.bitrix24.com/articles/best-contract-management-software-in-2022.php]
