-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "testScore" INTEGER;

-- AlterTable
ALTER TABLE "Scholarship" ADD COLUMN     "testMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "testQuestionId" TEXT;
