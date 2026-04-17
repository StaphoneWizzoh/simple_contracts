-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'OTHER',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "counterpartyName" TEXT,
    "effectiveAt" DATETIME,
    "expiresAt" DATETIME,
    "terminatedAt" DATETIME,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "totalValueMinor" INTEGER,
    "currentVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contract_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ContractVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT,
    "contentHtml" TEXT NOT NULL,
    "contentJson" TEXT,
    "contentText" TEXT,
    "changeSummary" TEXT,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractVersion_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractParty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'COUNTERPARTY',
    "legalName" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "organization" TEXT,
    "signingOrder" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractParty_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractParty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractSignature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "contractVersionId" TEXT,
    "partyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" DATETIME,
    "signedAt" DATETIME,
    "declinedAt" DATETIME,
    "reason" TEXT,
    "signedByUserId" TEXT,
    CONSTRAINT "ContractSignature_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractSignature_contractVersionId_fkey" FOREIGN KEY ("contractVersionId") REFERENCES "ContractVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContractSignature_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "ContractParty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractSignature_signedByUserId_fkey" FOREIGN KEY ("signedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractAuditLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_currentVersionId_key" ON "Contract"("currentVersionId");

-- CreateIndex
CREATE INDEX "Contract_organizationId_status_idx" ON "Contract"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Contract_ownerUserId_idx" ON "Contract"("ownerUserId");

-- CreateIndex
CREATE INDEX "Contract_createdByUserId_idx" ON "Contract"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_organizationId_contractNumber_key" ON "Contract"("organizationId", "contractNumber");

-- CreateIndex
CREATE INDEX "ContractVersion_createdByUserId_idx" ON "ContractVersion"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractVersion_contractId_versionNumber_key" ON "ContractVersion"("contractId", "versionNumber");

-- CreateIndex
CREATE INDEX "ContractParty_contractId_role_idx" ON "ContractParty"("contractId", "role");

-- CreateIndex
CREATE INDEX "ContractParty_userId_idx" ON "ContractParty"("userId");

-- CreateIndex
CREATE INDEX "ContractSignature_contractId_status_idx" ON "ContractSignature"("contractId", "status");

-- CreateIndex
CREATE INDEX "ContractSignature_partyId_idx" ON "ContractSignature"("partyId");

-- CreateIndex
CREATE INDEX "ContractSignature_contractVersionId_idx" ON "ContractSignature"("contractVersionId");

-- CreateIndex
CREATE INDEX "ContractSignature_signedByUserId_idx" ON "ContractSignature"("signedByUserId");

-- CreateIndex
CREATE INDEX "ContractAuditLog_contractId_createdAt_idx" ON "ContractAuditLog"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "ContractAuditLog_actorUserId_idx" ON "ContractAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "ContractAuditLog_eventType_idx" ON "ContractAuditLog"("eventType");
