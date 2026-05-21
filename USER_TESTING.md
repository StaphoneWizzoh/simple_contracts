# SimpleContracts — Testing Guide

> This document covers both **user testing** (QA, demos, internal review) and **developer testing** (unit/integration tests, test infrastructure).
> Each section lists the user journey, expected outcomes, and edge cases to verify.

---

## How to Use This Guide

### For QA / User Testing
- Work through each scenario in order — they build on each other.
- Mark each item `[x]` when confirmed working, `[!]` if a bug is found.
- Record any bugs with: **what you did → what happened → what you expected**.
- Reset state between test runs where indicated (see **Reset** notes).

### For Developers / Unit Testing
- See **Developer Testing & Automated Tests** section below for running and writing tests.
- All new backend features should have unit/integration tests before merging.

---

## Developer Testing & Automated Tests

### Quick Start

```bash
# From repo root or packages/backend/
npm run test:migrate -w packages/backend  # One-time: init test database
npm test -w packages/backend              # Run all tests
npm run test:watch -w packages/backend    # Watch mode
npm run test:coverage -w packages/backend # Coverage report
```

### Test Infrastructure

The backend uses **Vitest** with a real SQLite test database. Tests verify behavior through public APIs, not implementation details.

**Key files:**
- `server/tests/setup.ts` — H3 shims, testPrisma instance, auth mocks
- `server/tests/fixtures.ts` — `createTestFixture()` helper (creates org + user + contract in one call)
- `server/tests/contractGuards.test.ts` — 13 tests for `requireContractAccess` + `requireApprovalAction`
- `server/tests/auditLog.test.ts` — 6 tests for `logContractEvent` with typed events

### Adding Tests

**Pattern: Red → Green → Refactor (Vertical Slices)**

```typescript
// 1. Write one failing test
it("returns { ctx, contract } when valid", async () => {
  (auth.api.getSession as any).mockResolvedValue({
    user: { id: fixture.userId },
  });

  const event = createMockEvent(fixture.userId);
  const result = await requireContractAccess(event, fixture.contractId);

  expect(result.ctx.userId).toBe(fixture.userId);
});

// 2. Write minimal code to pass
export async function requireContractAccess(event, contractId) {
  const ctx = await getOrgContext(event);
  // ... minimal implementation
}

// 3. Next test, repeat
```

**Tips:**
- Use `createTestFixture()` in `beforeEach` — never duplicate seed logic
- Modify fixture inline if needed; restore state after test (see `contractGuards.test.ts` for examples)
- Test error paths: throw 401/403/404/422 as appropriate
- Use real database, not mocks — queries must actually work

### Test Statistics

| Module | Tests | What's Covered |
|---|---|---|
| **contractGuards** | 13 | Auth, permissions, contract ownership, approval workflows, SEQUENTIAL validation |
| **auditLog** | 6 | Event serialization, transaction rollback, event detail structure |
| **Total** | **19** | Permission logic, event service, workflow validation |

All tests green. No test failures in CI.

---

---

## Phase 1 — Auth, Org Onboarding & RBAC

### Prerequisites
- App running locally (`npm run dev` from project root)
- Fresh browser session (no cookies) or incognito window
- Access to two different email addresses for multi-user tests

---

### 1.1 — Sign Up

**Journey:** New user creates an account.

| # | Step | Expected Result |
|---|---|---|
| 1 | Visit `/` | Landing page shown with Login and Register buttons |
| 2 | Click **Register** | Redirected to `/auth/signup` |
| 3 | Fill in Full Name, Email, Password and submit | Toast: "Account created! Please log in." → redirected to `/auth/login` |
| 4 | Submit with a missing field | Form validation prevents submission (browser-native required field) |
| 5 | Submit with an already-registered email | Toast shows an error message |

---

### 1.2 — Log In

**Journey:** Existing user logs in.

| # | Step | Expected Result |
|---|---|---|
| 1 | Visit `/auth/login` | Login form shown |
| 2 | Enter correct credentials and submit | Redirected to `/contracts` (or the page you were trying to visit) |
| 3 | Enter wrong password | Toast: "Invalid email or password." |
| 4 | After login, visit `/` | Dashboard home shown (not the marketing page) |

---

### 1.3 — Org Onboarding

**Journey:** Freshly registered user sets up their organisation.

> **Reset:** Use a brand-new account that has never set up an org.

| # | Step | Expected Result |
|---|---|---|
| 1 | Log in with a new account | Redirected to `/contracts` (no contracts yet, empty state shown) |
| 2 | Visit `/org/onboarding` directly | Onboarding form shown (org name + legal name) |
| 3 | Submit with only Organisation name filled in | Toast: "Organisation created successfully" → redirected to `/contracts` |
| 4 | Visit `/org/settings` | Org name and legal name shown; form is editable |
| 5 | Submit onboarding form without a name | Button is disabled — cannot submit |
| 6 | Log out and log back in, visit `/` | Dashboard shows the org name under your name |

---

### 1.4 — Dashboard Home (Logged In)

**Journey:** Logged-in user visits the home page.

| # | Step | Expected Result |
|---|---|---|
| 1 | Visit `/` while logged in | Dashboard shown (not marketing page) |
| 2 | Check the welcome banner | Shows user's name, org name, legal name (if set) |
| 3 | Check the stats row | Shows correct counts for Total / Drafts / In Review / Executed |
| 4 | Click a stat card | Navigates to `/contracts` |
| 5 | Check "Recent Contracts" | Shows up to 5 most recent contracts |
| 6 | Check "Quick Actions" panel | Shows actions appropriate to the user's permissions |
| 7 | Click **Logout** in the navbar | Redirected to `/` — marketing page shown (not dashboard) |

---

### 1.5 — Org Settings

**Journey:** Admin user updates the organisation name.

| # | Step | Expected Result |
|---|---|---|
| 1 | Navigate to `/org/settings` | Settings page shown with current org name and legal name |
| 2 | Change the org name and click **Save Changes** | Toast: "Organisation updated." |
| 3 | Reload the page | Updated name persists |
| 4 | Navigate using the tab bar (Members, Roles) | Pages load correctly |

---

### 1.6 — Members Management

**Journey:** Admin invites a new member, the member accepts, admin changes their role.

> **Requires:** Two email addresses / two browser sessions (or incognito window).

| # | Step | Expected Result |
|---|---|---|
| 1 | Navigate to `/org/members` | Current members list shown |
| 2 | Fill in the invite form (email + role) and submit | Toast: "Invite sent to email@example.com" + invite link field appears |
| 3 | Copy the invite link | Toast: "Link copied!" |
| 4 | Open the invite link in a second browser session (or incognito) | Invite details page shown: org name, role, expiry |
| 5 | While not logged in on that session, click **Accept** | Prompted to log in first |
| 6 | Log in (or sign up) and return to the invite link | Accept button shown |
| 7 | Click **Accept & Join** | Toast: "Welcome to [Org Name]!" → redirected to `/contracts` |
| 8 | Back in the Admin session, refresh `/org/members` | New member appears in the list |
| 9 | Change the new member's role via the dropdown | Toast: "Role updated for [name]." |
| 10 | Click **Revoke** on a pending invite | Toast: "Invite for email@example.com revoked." |
| 11 | Click **Remove** on a member | Confirmation dialog → Toast: "[name] has been removed." |

**Edge cases:**
- Invite an already-invited email (pending) → existing invite should be replaced / error toast
- Try to remove yourself → should be blocked by the backend (you cannot remove yourself)
- Accept an expired invite → "Invite Unavailable" shown with error message

---

### 1.7 — Roles & Permissions

**Journey:** Admin creates a custom role with specific permissions, assigns it to a member.

| # | Step | Expected Result |
|---|---|---|
| 1 | Navigate to `/org/roles` | Four system roles shown: Admin, Contract Manager, Contract Creator, Viewer |
| 2 | Click **+ Create custom role** | Create panel opens on the right |
| 3 | Enter a name, description, and check 2–3 permissions | — |
| 4 | Click **Create** | Toast: "Role '[name]' created." — new role appears in the list |
| 5 | Click **Edit** on the new role | Edit panel opens with current values pre-filled |
| 6 | Change a permission and click **Update** | Toast: "Role '[name]' updated." |
| 7 | Try to delete a system role (Admin, Viewer, etc.) | Delete button is hidden for system roles |
| 8 | Delete the custom role you created | Confirmation dialog → Toast: "Role '[name]' deleted." |
| 9 | Try to delete a role that has members assigned | Toast: error — role cannot be deleted while members are assigned |

---

### 1.8 — Route Guards & Permissions

**Journey:** Verify that protected routes are inaccessible without the correct auth or permissions.

| # | Step | Expected Result |
|---|---|---|
| 1 | Log out and visit `/contracts` | Redirected to `/auth/login` |
| 2 | Log out and visit `/org/settings` | Redirected to `/auth/login` |
| 3 | Log in as a **Viewer** (no permissions) and visit `/contracts/new` | 403 "Access Denied" screen shown |
| 4 | As Viewer, visit `/contracts` | Contracts list loads (list does not require extra permission) |
| 5 | Log in as a user with no org | Redirected to `/org/onboarding` when visiting protected org routes |
| 6 | After login, check that the `from` redirect works | If you were sent to login from `/org/settings`, you land back there after logging in |

---

## Phase 5 — PDF Export

> **Prerequisite:** At least one saved contract with content.

| # | Step | Expected Result |
|---|---|---|
| 1 | Open an existing contract at `/contracts/:id` | "Download PDF" button visible in the top-right action bar |
| 2 | Click **Download PDF** | Button shows "Preparing PDF…" briefly, then file download starts |
| 3 | Open the downloaded PDF | Contains: contract number, title, status, counterparty, dates, version, description, full contract content, signature block, footer with timestamp and page numbers |
| 4 | Verify rich text formatting in the PDF | Headings, bold, italic, underline, lists, blockquotes, and code all render correctly |
| 5 | Verify the PDF for a contract with no counterparty | Fields show blank / not present — no crash |
| 6 | Click **Download PDF** immediately after editing content (before saving) | PDF reflects the unsaved editor content, not the last saved version |

---

## Phase 2 — Contract Lifecycle (Pending)

> Not yet implemented. Test scenarios below are placeholders for when Phase 2 ships.

### 2.1 — Status Transitions

| # | Scenario | Expected |
|---|---|---|
| 1 | Create a contract → Save Draft | Status: `DRAFT` |
| 2 | Submit for review | Status: `REVIEW` |
| 3 | Approve contract | Status: `SENT_FOR_SIGNING` |
| 4 | All signatories sign | Status: `ACTIVE` |
| 5 | Contract expires (`expiresAt` past) | Status auto-changes to `EXPIRED` |
| 6 | Manually terminate an active contract | Status: `TERMINATED`, reason recorded |
| 7 | Try to skip from DRAFT to ACTIVE | Backend blocks: invalid transition |
| 8 | Reject a contract in REVIEW | Status: back to `DRAFT`, rejection comment logged |

### 2.2 — Review & Approval Workflow
- Assign reviewer(s) to a contract
- Reviewer sees their assigned contracts
- Sequential approval: second approver cannot act until first has approved
- Simultaneous approval: all approvers can act in any order
- Rejection sends contract back to DRAFT with comment

---

## Phase 3 — Templates (Pending)

| # | Scenario | Expected |
|---|---|---|
| 1 | Create a contract template | Saved with placeholders like `{{client_name}}` |
| 2 | Create contract from template | Editor opens with placeholder content pre-filled |
| 3 | Fill in placeholders directly in the editor | Contract body updates in real time |
| 4 | Deactivate a template | Hidden from "create from template" picker |
| 5 | User without `create_templates` permission | Cannot access template management UI |

---

## Phase 4 — E-Signatures (Pending)

| # | Scenario | Expected |
|---|---|---|
| 1 | Add signatory to a contract (name, email, title) | Signatory listed on contract |
| 2 | Send contract for signing | Each signatory receives a unique secure link |
| 3 | Open signing link (no login required) | Contract shown read-only; signature capture shown |
| 4 | Sign with typed name | Signature stored with name, IP, timestamp, user-agent |
| 5 | Sign with drawn signature | Signature image stored |
| 6 | Open an expired signing link | "Link expired" message shown |
| 7 | Try to use a signing link twice | "Link already used" message shown |
| 8 | Sequential signing: link 2 inactive until signatory 1 signs | Second signatory cannot open their link until first signs |
| 9 | All signatories sign | Contract status auto-transitions to `ACTIVE` |
| 10 | Decline to sign | Contract status stays in `SENT_FOR_SIGNING`, decline reason recorded |
| 11 | Resend / regenerate link | Old link invalidated; new link sent |

---

## Phase 6 — Search & Reporting (Pending)

| # | Scenario | Expected |
|---|---|---|
| 1 | Search contracts by title keyword | Matching contracts returned |
| 2 | Filter by status | Only contracts with that status shown |
| 3 | Filter by date range | Contracts outside the range excluded |
| 4 | Sort by expiry date ascending | Soonest-to-expire contracts at top |
| 5 | View "Expiring Soon" report (30 / 60 / 90 days) | Correct contracts listed per threshold |
| 6 | Export report to CSV | Valid CSV file downloaded |
| 7 | Export report to PDF | Valid PDF downloaded with report data |

---

## Cross-Cutting Checks

These should be verified after each phase.

### Toasts / Feedback
- Every mutation (create, update, delete) shows a success or error toast
- Toasts are readable (dark background, correct colour: green = success, red = error)
- Toasts dismiss automatically after a few seconds

### Navigation
- Browser back/forward works on all pages
- Navigating away from an unsaved contract editor does not silently discard work (future: add unsaved-changes warning)

### Responsive Design
- All pages usable on a 375 px wide screen (iPhone SE size)
- Signing page especially must work on mobile (future: critical for external signatories)

### Security
- A user from Org A cannot access contracts belonging to Org B (test by inspecting API responses)
- Signing links expire and become single-use (Phase 4)
- Invite tokens are single-use and time-limited

---

## Bug Reporting Template

When filing a bug, use this format:

```
**Page / Feature:** e.g. Members page — Invite form
**Steps to reproduce:**
1. ...
2. ...
3. ...
**Expected result:** ...
**Actual result:** ...
**Browser + OS:** e.g. Chrome 124 / macOS
**Screenshot / recording:** (attach if possible)
```
