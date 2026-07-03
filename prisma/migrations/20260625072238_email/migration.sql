/*
  Warnings:

  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - Added the required column `email` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "USERROLE" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "user" DROP COLUMN "name",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "role" "USERROLE" NOT NULL DEFAULT 'USER';
