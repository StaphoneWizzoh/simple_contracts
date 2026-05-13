-- AlterTable
ALTER TABLE "SigningToken" ADD COLUMN "signingPath" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContractTemplate" (
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ContractTemplate" ("contentHtml", "contentJson", "contentText", "contractType", "createdAt", "createdByUserId", "description", "id", "isActive", "organizationId", "title", "updatedAt", "variables", "version") SELECT "contentHtml", "contentJson", "contentText", "contractType", "createdAt", "createdByUserId", "description", "id", "isActive", "organizationId", "title", "updatedAt", "variables", "version" FROM "ContractTemplate";
DROP TABLE "ContractTemplate";
ALTER TABLE "new_ContractTemplate" RENAME TO "ContractTemplate";
CREATE INDEX "ContractTemplate_organizationId_isActive_idx" ON "ContractTemplate"("organizationId", "isActive");
CREATE INDEX "ContractTemplate_createdByUserId_idx" ON "ContractTemplate"("createdByUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
