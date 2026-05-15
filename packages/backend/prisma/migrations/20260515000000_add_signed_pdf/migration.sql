-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "signedPdfBytes" BLOB;
ALTER TABLE "Contract" ADD COLUMN "signedPdfGeneratedAt" DATETIME;
