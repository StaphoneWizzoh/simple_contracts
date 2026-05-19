-- Phase 6: Search & Reporting
-- Adds performance indices for filtering/sorting and the SavedSearch model

-- Indices on Contract for search & filter performance
CREATE INDEX IF NOT EXISTS "Contract_contractType_idx" ON "Contract"("contractType");
CREATE INDEX IF NOT EXISTS "Contract_organizationId_expiresAt_idx" ON "Contract"("organizationId", "expiresAt");
CREATE INDEX IF NOT EXISTS "Contract_organizationId_effectiveAt_idx" ON "Contract"("organizationId", "effectiveAt");
CREATE INDEX IF NOT EXISTS "Contract_organizationId_createdAt_idx" ON "Contract"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Contract_organizationId_totalValueMinor_idx" ON "Contract"("organizationId", "totalValueMinor");
CREATE INDEX IF NOT EXISTS "Contract_organizationId_counterpartyName_idx" ON "Contract"("organizationId", "counterpartyName");

-- Index on ContractSignature for turnaround reporting
CREATE INDEX IF NOT EXISTS "ContractSignature_signedAt_idx" ON "ContractSignature"("signedAt");

-- SavedSearch: user-scoped named filter presets
CREATE TABLE "SavedSearch" (
    "id"             TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "filters"        TEXT NOT NULL,
    "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedSearch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
    CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SavedSearch_organizationId_userId_idx" ON "SavedSearch"("organizationId", "userId");
