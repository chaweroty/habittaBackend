-- AlterTable
ALTER TABLE `user` ADD COLUMN `status` ENUM('Verified', 'Unverified', 'Pending') NOT NULL DEFAULT 'Unverified',
    ADD COLUMN `verificationCode` VARCHAR(191) NULL;
