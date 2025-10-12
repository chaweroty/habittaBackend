/*
  Warnings:

  - The primary key for the `subscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_subscription` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `subscription` table. All the data in the column will be lost.
  - The required column `id` was added to the `Subscription` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `id_plan` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_price` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subscription` DROP PRIMARY KEY,
    DROP COLUMN `id_subscription`,
    DROP COLUMN `type`,
    ADD COLUMN `auto_renew` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD COLUMN `id_plan` VARCHAR(191) NOT NULL,
    ADD COLUMN `plan_price` DOUBLE NOT NULL,
    ADD COLUMN `status` ENUM('active', 'inactive', 'cancelled', 'expired', 'pending_payment') NOT NULL DEFAULT 'pending_payment',
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `Plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `duration_months` INTEGER NOT NULL,
    `features` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id_pay` VARCHAR(191) NOT NULL,
    `id_payer` VARCHAR(191) NOT NULL,
    `id_receiver` VARCHAR(191) NULL,
    `related_type` ENUM('rent', 'subscription', 'maintenance', 'other') NOT NULL,
    `id_related` VARCHAR(191) NOT NULL,
    `concept` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'COP',
    `method` ENUM('card', 'transfer', 'cash', 'other') NOT NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `due_date` DATETIME(3) NULL,
    `reference_code` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('pending', 'completed', 'failed', 'refunded', 'lated') NOT NULL,

    PRIMARY KEY (`id_pay`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_id_plan_fkey` FOREIGN KEY (`id_plan`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_id_payer_fkey` FOREIGN KEY (`id_payer`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_id_receiver_fkey` FOREIGN KEY (`id_receiver`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
