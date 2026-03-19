-- AlterTable
ALTER TABLE `discussion_messages` ADD COLUMN `media` VARCHAR(191) NULL,
    ADD COLUMN `parentId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `discussion_threads` ADD COLUMN `image` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `discussion_messages_parentId_idx` ON `discussion_messages`(`parentId`);

-- AddForeignKey
ALTER TABLE `discussion_messages` ADD CONSTRAINT `discussion_messages_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `discussion_messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
