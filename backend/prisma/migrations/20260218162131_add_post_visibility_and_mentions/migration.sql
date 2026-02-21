-- AlterTable
ALTER TABLE `posts` ADD COLUMN `visibility` ENUM('PUBLIC', 'CONNECTIONS') NOT NULL DEFAULT 'PUBLIC',
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `post_mentions` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `post_mentions_postId_idx`(`postId`),
    INDEX `post_mentions_userId_idx`(`userId`),
    UNIQUE INDEX `post_mentions_postId_userId_key`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `posts_visibility_idx` ON `posts`(`visibility`);

-- AddForeignKey
ALTER TABLE `post_mentions` ADD CONSTRAINT `post_mentions_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_mentions` ADD CONSTRAINT `post_mentions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
