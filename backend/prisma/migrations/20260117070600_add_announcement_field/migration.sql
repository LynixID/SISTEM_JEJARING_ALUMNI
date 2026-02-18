/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `announcements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `announcements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `announcements` ADD COLUMN `authorId` VARCHAR(191) NULL,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL,
    ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `events` ADD COLUMN `category` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `announcements_slug_key` ON `announcements`(`slug`);

-- CreateIndex
CREATE INDEX `announcements_slug_idx` ON `announcements`(`slug`);
