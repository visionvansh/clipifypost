/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Announcement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Announcement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Announcement_userId_key" ON "Announcement"("userId");
