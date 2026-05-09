-- AlterTable
ALTER TABLE "ContractSignature" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "ContractSignature" ADD COLUMN "signatureData" TEXT;
ALTER TABLE "ContractSignature" ADD COLUMN "signatureType" TEXT;
ALTER TABLE "ContractSignature" ADD COLUMN "userAgent" TEXT;

-- CreateTable
CREATE TABLE "SigningToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractSignatureId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SigningToken_contractSignatureId_fkey" FOREIGN KEY ("contractSignatureId") REFERENCES "ContractSignature" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SigningToken_contractSignatureId_key" ON "SigningToken"("contractSignatureId");

-- CreateIndex
CREATE UNIQUE INDEX "SigningToken_token_key" ON "SigningToken"("token");

-- CreateIndex
CREATE INDEX "SigningToken_token_idx" ON "SigningToken"("token");
