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
- [ ] Org creation flow on first signup (name, legal name, logo upload)
- [ ] Invite members to org via email (generates time-limited invite token)
- [ ] Accept/decline invite flow (invitee lands on invite page, no account required initially)
- [ ] Org settings page (update name, logo, timezone, default currency)

### 1.2 Custom RBAC (Role-Based Access Control)
- [ ] Predefined base permission set:
  - `create_contracts` — create contracts from templates or scratch
  - `create_templates` — create and manage contract templates
  - `review_contracts` — be assigned as reviewer on contracts
  - `approve_contracts` — be assigned as approver on contracts
  - `send_for_signing` — send contracts out for signature
  - `manage_users` — invite/remove members, assign roles
  - `manage_roles` — create/edit/delete org roles
  - `view_reports` — access reporting dashboard
  - `manage_org` — org-level settings
- [ ] Role management UI (admin can create roles, assign permission checkboxes)
- [ ] Assign/change roles for org members
- [ ] Permission guard middleware on all API routes
- [ ] Permission guard components on all frontend actions/pages
- [ ] Seed default roles per new org:
  - **Org Admin** — all permissions
  - **Contract Manager** — create, review, approve, send, view reports
  - **Contract Creator** — create contracts only
  - **Viewer** — read-only

### 1.3 Database Changes Required
- [ ] `OrgRole` model — org-scoped roles with JSON permission set
- [ ] `OrgRolePermission` model or JSON field on `OrgRole`
- [ ] Update `OrganizationMember.role` to reference `OrgRole` FK instead of plain string
- [ ] `OrgInvite` model — email, token, expiresAt, status, roleId

---

## Phase 2 — Contract Lifecycle & Workflow

### 2.1 Contract Status Machine
Full lifecycle: **Draft → Review → Sent for Signing → Active → Expired / Terminated**

- [ ] Update `Contract.status` enum to: `DRAFT | REVIEW | SENT_FOR_SIGNING | ACTIVE | EXPIRED | TERMINATED`
- [ ] Status transition validation on backend (cannot skip stages, cannot go backwards except to DRAFT from REVIEW)
- [ ] Auto-expire contracts: background job/cron that sets `ACTIVE → EXPIRED` when `expiresAt` is past
- [ ] Manual termination endpoint with reason field

### 2.2 Review & Approval Workflow
- [ ] Contract review assignment — creator assigns one or more reviewers (org members with `review_contracts` permission)
- [ ] Approval workflow settings per contract:
  - **Sequential** — approvers must approve in a defined order (1st then 2nd then 3rd)
  - **Simultaneous** — all approvers can act in any order; contract advances when all have approved
- [ ] `ContractApproval` model:
  - `contractId`, `approverId` (userId), `order` (Int for sequential), `status` (PENDING | APPROVED | REJECTED), `comment`, `actedAt`
- [ ] Reviewer/approver action UI — approve or reject with optional comment
- [ ] Rejection flow — contract goes back to DRAFT with rejection comment logged
- [ ] Audit log entries for every approval/rejection action

### 2.3 Contract Settings Panel
Per-contract settings the creator can configure:
- [ ] Approval workflow type (sequential / simultaneous)
- [ ] Signing order for signatories (sequential / simultaneous)
- [ ] Signature type accepted (typed name / drawn / both)
- [ ] Signing link expiry duration (e.g., 7 days, 14 days, 30 days)
- [ ] Effective date and expiry date
- [ ] Contract value and currency
- [ ] Contract type (Service Agreement, NDA, Employment, etc. — configurable list)

---

## Phase 3 — Contract Templates

### 3.1 Template System
- [ ] `ContractTemplate` model:
  - `id`, `organizationId`, `title`, `description`, `contentHtml`, `contentJson`, `contentText`, `contractType`, `createdByUserId`, `isActive`, `createdAt`, `updatedAt`
- [ ] `TemplateVariable` model (or JSON in template):
  - Variable name, label, type (text | date | number | boolean), required flag, default value
- [ ] Template CRUD API endpoints (guarded by `create_templates` permission)
- [ ] Template management UI — list, create, edit, deactivate templates
- [ ] "Create contract from template" flow:
  - User picks a template
  - Document opens in editor with placeholder text (e.g., `{{client_name}}`) already in content
  - User edits placeholders directly in the rich-text editor
- [ ] Template versioning (track changes to templates over time)

---

## Phase 4 — E-Signature Workflow

### 4.1 Signatory Management
- [ ] Add signatories to a contract (name, email, title, organisation, signing order)
- [ ] Signatories do **not** need app accounts
- [ ] Per-contract setting: sequential or simultaneous signing

### 4.2 Secure Signing Links
- [ ] `SigningToken` model:
  - `id`, `contractSignatureId`, `token` (UUID, hashed in DB), `expiresAt`, `usedAt`, `ipAddress` (at creation)
- [ ] Generate unique signing link per signatory: `/sign/{token}`
- [ ] Link expiry enforced server-side (duration set in contract settings)
- [ ] Token single-use (invalidated after signing or declining)
- [ ] Resend / regenerate signing link (old token invalidated)

### 4.3 Signing Experience (No Login Required)
- [ ] Public signing page `/sign/:token`:
  - Verify token validity (not expired, not used)
  - Display full contract content (read-only)
  - Show signatory details
  - Signature capture — based on contract setting:
    - **Typed** — full legal name text input
    - **Drawn** — canvas-based signature pad (e.g., `react-signature-canvas`)
    - **Both** — signatory chooses
  - Consent checkbox ("I agree this is my legal signature")
  - "Sign" and "Decline" actions
- [ ] On sign: capture and store:
  - Signature image/text
  - IP address
  - User agent / browser fingerprint
  - Timestamp (UTC)
  - Geolocation (if consented — optional)
- [ ] Sequential signing: next signatory link only sent/activated after previous signs
- [ ] Simultaneous signing: all links active at once
- [ ] On all signatories signed: auto-transition contract to `ACTIVE`

### 4.4 Audit Trail
- [ ] Full audit trail per contract (contract timeline view):
  - Contract created
  - Version saved
  - Status changed (with actor)
  - Reviewer assigned / review submitted
  - Approver assigned / approved / rejected
  - Sent for signing
  - Signatory viewed link (IP, timestamp)
  - Signatory signed (IP, user agent, timestamp, signature data reference)
  - Signatory declined (with reason)
  - Contract activated / expired / terminated
- [ ] Audit trail API endpoint
- [ ] Audit trail UI component on contract detail page

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
- [ ] Signature block: populate with actual signatories once e-signature phase is built
- [ ] Audit trail summary page (add after Phase 4 — audit trail)
- [ ] Signed contract PDF stored/cached after all signatures collected

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
- [ ] Rate limiting on signing endpoints and invite endpoints
- [ ] CSRF protection on state-changing routes
- [ ] Signing token stored as hash (never plaintext) in DB
- [ ] All API routes verify org membership before data access
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

| Area | Status |
|---|---|
| Auth (email/password login/signup) | Done |
| Organisation auto-creation | Done (basic) |
| Contract CRUD (draft, list, view) | Done |
| Publish contract (DRAFT → REVIEW) | Done |
| Rich text editor (Tiptap) | Done |
| Contract versioning | Done |
| Audit log (basic) | Done |
| RBAC | Not started |
| Templates | Not started |
| Approval workflow | Not started |
| E-signatures | Not started |
| PDF export | Done (basic — no signatories/audit trail yet) |
| Reporting | Not started |
