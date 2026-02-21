/*
  Warnings:

  - You are about to drop the column `category` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `events` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `announcements_category_idx` ON `announcements`;

-- AlterTable
ALTER TABLE `announcements` DROP COLUMN `category`;

-- AlterTable
ALTER TABLE `events` DROP COLUMN `category`;
