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
CREATE TABLE `Property` (
    `id` VARCHAR(191) NOT NULL,
    `id_owner` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `rooms` INTEGER NOT NULL,
    `bathrooms` INTEGER NOT NULL,
    `area` DOUBLE NOT NULL,
    `services` VARCHAR(191) NOT NULL,
    `publication_status` VARCHAR(191) NOT NULL,
    `publication_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id_subscription` VARCHAR(191) NOT NULL,
    `id_owner` VARCHAR(191) NOT NULL,
    `id_property` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `start_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `final_date` DATETIME(3) NULL,

    UNIQUE INDEX `Subscription_id_property_key`(`id_property`),
    PRIMARY KEY (`id_subscription`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImageProperty` (
    `id` VARCHAR(191) NOT NULL,
    `id_property` VARCHAR(191) NOT NULL,
    `url_image` VARCHAR(191) NOT NULL,

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

-- CreateTable
CREATE TABLE `LegalDocument` (
    `id` VARCHAR(191) NOT NULL,
    `id_user` VARCHAR(191) NOT NULL,
    `id_property` VARCHAR(191) NULL,
    `id_application` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `upload_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
