-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `triggeredBy` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `notifications_triggeredBy_idx` ON `notifications`(`triggeredBy`);

-- CreateIndex
CREATE INDEX `notifications_relatedId_relatedType_triggeredBy_idx` ON `notifications`(`relatedId`, `relatedType`, `triggeredBy`);
