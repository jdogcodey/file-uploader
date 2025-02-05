/*
  Warnings:

  - You are about to drop the column `name` on the `Document` table. All the data in the column will be lost.
  - Added the required column `originalName` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `savedName` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "name",
ADD COLUMN     "originalName" VARCHAR(255) NOT NULL,
ADD COLUMN     "savedName" VARCHAR(255) NOT NULL;
