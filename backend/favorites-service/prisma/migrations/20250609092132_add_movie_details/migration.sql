-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "adult" BOOLEAN DEFAULT false,
ADD COLUMN     "genres" TEXT,
ADD COLUMN     "overview" TEXT,
ADD COLUMN     "popularity" DOUBLE PRECISION,
ADD COLUMN     "voteAverage" DOUBLE PRECISION,
ADD COLUMN     "voteCount" INTEGER;
