/*
  Warnings:

  - You are about to drop the column `classId` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `present` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `capacity` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `supervisor` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `class` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `day` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `teacher` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `student` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `birthday` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `bloodType` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `birthday` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `bloodType` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the `_SubjectToTeacher` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[accounts]` on the table `Parent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accounts]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accounts]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileLink` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nameOfPerson` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `socialAccountName` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `views` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accounts` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bonus` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spreadsheetLink` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `belongsTo` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `socialProfiles` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `views` to the `Lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accounts` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `img` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Parent` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `nameOfPerson` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `revenue` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `socialAccountName` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accounts` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accounts` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_classId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "_SubjectToTeacher" DROP CONSTRAINT "_SubjectToTeacher_A_fkey";

-- DropForeignKey
ALTER TABLE "_SubjectToTeacher" DROP CONSTRAINT "_SubjectToTeacher_B_fkey";

-- DropIndex
DROP INDEX "Class_name_key";

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "classId";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "title",
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "profileLink" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "date",
DROP COLUMN "lessonId",
DROP COLUMN "present",
ADD COLUMN     "nameOfPerson" TEXT NOT NULL,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "socialAccountName" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT,
ADD COLUMN     "views" INTEGER NOT NULL,
ALTER COLUMN "studentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "capacity",
DROP COLUMN "grade",
DROP COLUMN "supervisor",
ADD COLUMN     "accounts" TEXT NOT NULL,
ADD COLUMN     "bonus" TEXT NOT NULL,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "position" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "teacherId" TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "spreadsheetLink" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "class",
DROP COLUMN "day",
DROP COLUMN "endTime",
DROP COLUMN "name",
DROP COLUMN "startTime",
DROP COLUMN "teacher",
ADD COLUMN     "belongsTo" TEXT NOT NULL,
ADD COLUMN     "socialProfiles" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "views" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN     "accounts" TEXT NOT NULL,
ADD COLUMN     "img" TEXT NOT NULL,
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "sex" "UserSex" NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "name",
DROP COLUMN "score",
DROP COLUMN "student",
ADD COLUMN     "nameOfPerson" TEXT NOT NULL,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "revenue" INTEGER NOT NULL,
ADD COLUMN     "socialAccountName" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "birthday",
DROP COLUMN "bloodType",
ADD COLUMN     "accounts" TEXT NOT NULL,
ADD COLUMN     "platform" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "birthday",
DROP COLUMN "bloodType",
ADD COLUMN     "accounts" TEXT NOT NULL,
ADD COLUMN     "platform" TEXT NOT NULL;

-- DropTable
DROP TABLE "_SubjectToTeacher";

-- CreateIndex
CREATE UNIQUE INDEX "Parent_accounts_key" ON "Parent"("accounts");

-- CreateIndex
CREATE UNIQUE INDEX "Student_accounts_key" ON "Student"("accounts");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_accounts_key" ON "Teacher"("accounts");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
