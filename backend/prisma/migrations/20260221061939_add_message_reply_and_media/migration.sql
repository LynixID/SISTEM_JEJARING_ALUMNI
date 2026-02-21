-- AlterTable
ALTER TABLE `messages` ADD COLUMN `media` VARCHAR(191) NULL,
    ADD COLUMN `parentId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `messages_parentId_idx` ON `messages`(`parentId`);

-- CreateIndex
CREATE INDEX `messages_createdAt_idx` ON `messages`(`createdAt`);

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
