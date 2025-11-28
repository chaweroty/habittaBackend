-- AlterTable
ALTER TABLE `Application` ADD COLUMN `end_date` DATETIME(3) NULL,
    ADD COLUMN `paymentFrequency` ENUM('monthly', 'quarterly', 'biannual', 'annual') NULL,
    ADD COLUMN `rentAmount` DOUBLE NULL,
    ADD COLUMN `start_date` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `NotificationToken` (
    `id` VARCHAR(191) NOT NULL,
    `id_user` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `role_user` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `NotificationToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NotificationToken` ADD CONSTRAINT `NotificationToken_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
