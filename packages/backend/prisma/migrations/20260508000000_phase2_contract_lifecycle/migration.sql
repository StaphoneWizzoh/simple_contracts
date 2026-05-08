-- Phase 2: Contract Lifecycle & Workflow
-- Add workflow settings to Contract table
ALTER TABLE "Contract" ADD COLUMN "terminationReason" TEXT;
ALTER TABLE "Contract" ADD COLUMN "approvalWorkflow" TEXT NOT NULL DEFAULT 'SIMULTANEOUS';
ALTER TABLE "Contract" ADD COLUMN "signingWorkflow" TEXT NOT NULL DEFAULT 'SIMULTANEOUS';
ALTER TABLE "Contract" ADD COLUMN "signatureType" TEXT NOT NULL DEFAULT 'BOTH';
ALTER TABLE "Contract" ADD COLUMN "signingLinkExpiryDays" INTEGER NOT NULL DEFAULT 14;

-- CreateTable: ContractApproval
CREATE TABLE "ContractApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "actedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractApproval_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractApproval_contractId_approverId_key" ON "ContractApproval"("contractId", "approverId");
CREATE INDEX "ContractApproval_contractId_status_idx" ON "ContractApproval"("contractId", "status");
CREATE INDEX "ContractApproval_approverId_idx" ON "ContractApproval"("approverId");
