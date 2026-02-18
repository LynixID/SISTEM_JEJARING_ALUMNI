-- AlterTable
ALTER TABLE `connections` ADD COLUMN `message` TEXT NULL;

-- CreateIndex
CREATE INDEX `connections_status_idx` ON `connections`(`status`);
