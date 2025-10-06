/*
  Warnings:

  - You are about to drop the `application` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `application` DROP FOREIGN KEY `Application_id_property_fkey`;

-- DropIndex
DROP INDEX `LegalDocument_id_application_fkey` ON `LegalDocument`;

-- DropIndex
DROP INDEX `LegalDocument_id_user_fkey` ON `LegalDocument`;

-- DropIndex
DROP INDEX `Property_id_owner_fkey` ON `Property`;

-- DropIndex
DROP INDEX `Subscription_id_owner_fkey` ON `Subscription`;

-- DropTable
DROP TABLE `application`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `status` ENUM('Verified', 'Unverified', 'Pending') NOT NULL DEFAULT 'Unverified',
    `verificationCode` VARCHAR(191) NULL,
    `pushToken` VARCHAR(191) NULL DEFAULT '',
    `creation_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` VARCHAR(191) NOT NULL,
    `id_renter` VARCHAR(191) NOT NULL,
    `id_property` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `application_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_id_owner_fkey` FOREIGN KEY (`id_owner`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_id_owner_fkey` FOREIGN KEY (`id_owner`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_id_renter_fkey` FOREIGN KEY (`id_renter`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_id_property_fkey` FOREIGN KEY (`id_property`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegalDocument` ADD CONSTRAINT `LegalDocument_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegalDocument` ADD CONSTRAINT `LegalDocument_id_application_fkey` FOREIGN KEY (`id_application`) REFERENCES `Application`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
