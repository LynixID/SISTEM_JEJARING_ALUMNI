-- AlterTable
ALTER TABLE `users` ADD COLUMN `isSuspended` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `suspendReason` TEXT NULL,
    ADD COLUMN `suspendedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `targetType` ENUM('POST', 'COMMENT', 'USER') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `reason` ENUM('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'INAPPROPRIATE_CONTENT', 'FALSE_INFORMATION', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
    `adminNote` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reports_status_idx`(`status`),
    INDEX `reports_targetType_idx`(`targetType`),
    INDEX `reports_targetId_idx`(`targetId`),
    INDEX `reports_reporterId_idx`(`reporterId`),
    INDEX `reports_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
