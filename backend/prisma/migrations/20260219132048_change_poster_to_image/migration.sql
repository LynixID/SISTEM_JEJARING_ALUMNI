/*
  Warnings:

  - You are about to drop the column `poster` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `events` DROP COLUMN `poster`,
    ADD COLUMN `image` VARCHAR(191) NULL;
