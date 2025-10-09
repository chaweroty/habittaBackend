-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `id_application` VARCHAR(191) NOT NULL,
    `id_author` VARCHAR(191) NOT NULL,
    `id_receiver` VARCHAR(191) NOT NULL,
    `rating` BOOLEAN NOT NULL,
    `comment` VARCHAR(191) NULL,
    `context_type` ENUM('normal', 'cancelledByTenant', 'cancelledByOwner', 'breachByTenant', 'breachByOwner', 'other') NOT NULL,
    `weight` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('pending', 'published', 'disabled', 'deleted') NOT NULL DEFAULT 'pending',
    `create_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
