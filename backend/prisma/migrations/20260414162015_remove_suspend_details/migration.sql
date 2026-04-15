/*
  Warnings:

  - You are about to drop the column `suspendReason` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `suspendedAt` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `suspendReason`,
    DROP COLUMN `suspendedAt`;
