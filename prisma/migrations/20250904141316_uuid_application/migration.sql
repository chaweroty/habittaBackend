/*
  Warnings:

  - The primary key for the `application` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `imageproperty` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `legaldocument` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `property` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `subscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `application` DROP FOREIGN KEY `Application_id_property_fkey`;

-- DropForeignKey
ALTER TABLE `application` DROP FOREIGN KEY `Application_id_renter_fkey`;

-- DropForeignKey
ALTER TABLE `imageproperty` DROP FOREIGN KEY `ImageProperty_id_property_fkey`;

-- DropForeignKey
ALTER TABLE `legaldocument` DROP FOREIGN KEY `LegalDocument_id_application_fkey`;

-- DropForeignKey
ALTER TABLE `legaldocument` DROP FOREIGN KEY `LegalDocument_id_property_fkey`;

-- DropForeignKey
ALTER TABLE `legaldocument` DROP FOREIGN KEY `LegalDocument_id_user_fkey`;

-- DropForeignKey
ALTER TABLE `property` DROP FOREIGN KEY `Property_id_owner_fkey`;

-- DropForeignKey
ALTER TABLE `subscription` DROP FOREIGN KEY `Subscription_id_owner_fkey`;

-- DropForeignKey
ALTER TABLE `subscription` DROP FOREIGN KEY `Subscription_id_property_fkey`;

-- DropIndex
DROP INDEX `Application_id_property_fkey` ON `application`;

-- DropIndex
DROP INDEX `Application_id_renter_fkey` ON `application`;

-- DropIndex
DROP INDEX `ImageProperty_id_property_fkey` ON `imageproperty`;

-- DropIndex
DROP INDEX `LegalDocument_id_application_fkey` ON `legaldocument`;

-- DropIndex
DROP INDEX `LegalDocument_id_property_fkey` ON `legaldocument`;

-- DropIndex
DROP INDEX `LegalDocument_id_user_fkey` ON `legaldocument`;

-- DropIndex
DROP INDEX `Property_id_owner_fkey` ON `property`;

-- DropIndex
DROP INDEX `Subscription_id_owner_fkey` ON `subscription`;

-- AlterTable
ALTER TABLE `application` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `id_renter` VARCHAR(191) NOT NULL,
    MODIFY `id_property` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `imageproperty` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `id_property` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `legaldocument` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `id_user` VARCHAR(191) NOT NULL,
    MODIFY `id_property` VARCHAR(191) NULL,
    MODIFY `id_application` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `property` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `id_owner` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `subscription` DROP PRIMARY KEY,
    MODIFY `id_subscription` VARCHAR(191) NOT NULL,
    MODIFY `id_owner` VARCHAR(191) NOT NULL,
    MODIFY `id_property` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id_subscription`);

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_id_owner_fkey` FOREIGN KEY (`id_owner`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_id_owner_fkey` FOREIGN KEY (`id_owner`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_id_property_fkey` FOREIGN KEY (`id_property`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImageProperty` ADD CONSTRAINT `ImageProperty_id_property_fkey` FOREIGN KEY (`id_property`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_id_renter_fkey` FOREIGN KEY (`id_renter`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_id_property_fkey` FOREIGN KEY (`id_property`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegalDocument` ADD CONSTRAINT `LegalDocument_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegalDocument` ADD CONSTRAINT `LegalDocument_id_property_fkey` FOREIGN KEY (`id_property`) REFERENCES `Property`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LegalDocument` ADD CONSTRAINT `LegalDocument_id_application_fkey` FOREIGN KEY (`id_application`) REFERENCES `Application`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
