-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `certifications` JSON NULL,
    ADD COLUMN `coverPhoto` VARCHAR(191) NULL,
    ADD COLUMN `education` JSON NULL,
    ADD COLUMN `experience` JSON NULL,
    ADD COLUMN `jabatan` VARCHAR(191) NULL,
    ADD COLUMN `languages` JSON NULL,
    ADD COLUMN `perusahaan` VARCHAR(191) NULL;
