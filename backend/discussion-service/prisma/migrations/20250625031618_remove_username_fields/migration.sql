/*
  Warnings:

  - You are about to drop the column `username` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Discussion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "username";

-- AlterTable
ALTER TABLE "Discussion" DROP COLUMN "username";
