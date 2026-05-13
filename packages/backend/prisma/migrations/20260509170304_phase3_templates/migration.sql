-- CreateTable ContractTemplate
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'OTHER',
    "contentHtml" TEXT NOT NULL,
    "contentJson" TEXT,
    "contentText" TEXT,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE,
    CONSTRAINT "ContractTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT
);

-- CreateIndex
CREATE INDEX "ContractTemplate_organizationId_isActive_idx" ON "ContractTemplate"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "ContractTemplate_createdByUserId_idx" ON "ContractTemplate"("createdByUserId");
