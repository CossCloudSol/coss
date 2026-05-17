/*
  Warnings:

  - You are about to drop the column `contactName` on the `CorporateLead` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `CorporateLead` table. All the data in the column will be lost.
  - Added the required column `contactPerson` to the `CorporateLead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeCount` to the `CorporateLead` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingDomain` to the `CorporateLead` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `CorporateLead` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CorporateLead" DROP COLUMN "contactName",
DROP COLUMN "message",
ADD COLUMN     "contactPerson" TEXT NOT NULL,
ADD COLUMN     "employeeCount" TEXT NOT NULL,
ADD COLUMN     "trainingDomain" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
