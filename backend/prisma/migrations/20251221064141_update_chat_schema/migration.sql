/*
  Warnings:

  - You are about to drop the column `receiverId` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `ChatMessage` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_senderId_fkey";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "sender" "Role" NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
