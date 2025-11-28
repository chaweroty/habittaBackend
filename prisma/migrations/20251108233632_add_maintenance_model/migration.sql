-- AlterTable
ALTER TABLE `User` ADD COLUMN `lastName` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Maintenance` (
    `id_maintenance` VARCHAR(191) NOT NULL,
    `id_property` VARCHAR(191) NOT NULL,
    `id_owner` VARCHAR(191) NOT NULL,
    `id_tenant` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(1000) NULL,
    `status` ENUM('pending', 'accepted', 'rejected', 'scheduled', 'payment_pending', 'confirmed', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    `responsibility` ENUM('owner', 'tenant') NOT NULL DEFAULT 'owner',
    `cost_estimate` DOUBLE NULL,
    `scheduled_date` DATETIME(3) NULL,
    `confirmed_date` DATETIME(3) NULL,
    `completed_date` DATETIME(3) NULL,
    `attachments` JSON NULL,
    `created_by` ENUM('owner', 'tenant') NOT NULL,
    `id_payment` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_maintenance`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Maintenance` ADD CONSTRAINT `Maintenance_id_property_fkey` FOREIGN KEY (`id_property`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Maintenance` ADD CONSTRAINT `Maintenance_id_owner_fkey` FOREIGN KEY (`id_owner`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Maintenance` ADD CONSTRAINT `Maintenance_id_tenant_fkey` FOREIGN KEY (`id_tenant`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Maintenance` ADD CONSTRAINT `Maintenance_id_payment_fkey` FOREIGN KEY (`id_payment`) REFERENCES `Payment`(`id_pay`) ON DELETE SET NULL ON UPDATE CASCADE;
