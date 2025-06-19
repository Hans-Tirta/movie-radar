/*
  Warnings:

  - You are about to drop the column `genres` on the `Favorite` table. All the data in the column will be lost.
  - You are about to drop the column `overview` on the `Favorite` table. All the data in the column will be lost.
  - You are about to drop the column `posterPath` on the `Favorite` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Favorite` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[movieId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,movieId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Favorite" DROP COLUMN "genres",
DROP COLUMN "overview",
DROP COLUMN "posterPath",
DROP COLUMN "title",
ADD COLUMN     "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_movieId_key" ON "Favorite"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_movieId_key" ON "Favorite"("userId", "movieId");
