/*
  Warnings:

  - Added the required column `belongs_to` to the `LegalDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url_document` to the `LegalDocument` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `legaldocument` DROP FOREIGN KEY `LegalDocument_id_user_fkey`;

-- DropIndex
DROP INDEX `LegalDocument_id_user_fkey` ON `legaldocument`;

-- AlterTable
ALTER TABLE `legaldocument` ADD COLUMN `belongs_to` ENUM('user', 'property', 'application') NOT NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `url_document` VARCHAR(191) NOT NULL,
    MODIFY `id_user` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Contract` (
    `id_contract` VARCHAR(191) NOT NULL,
    `id_application` VARCHAR(191) NOT NULL,
    `id_owner` VARCHAR(191) NOT NULL,
    `id_document` VARCHAR(191) NULL,
    `id_renter` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `rent_amount` DOUBLE NOT NULL,
    `payment_frequency` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_contract`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LegalDocument` ADD CONSTRAINT `LegalDocument_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_id_application_fkey` FOREIGN KEY (`id_application`) REFERENCES `Application`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_id_owner_fkey` FOREIGN KEY (`id_owner`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_id_document_fkey` FOREIGN KEY (`id_document`) REFERENCES `LegalDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_id_renter_fkey` FOREIGN KEY (`id_renter`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
