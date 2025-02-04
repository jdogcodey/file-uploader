/*
  Warnings:

  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_usersId_fkey";

-- DropTable
DROP TABLE "Users";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
