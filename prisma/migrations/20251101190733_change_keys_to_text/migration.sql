-- AlterTable
ALTER TABLE `legaldocument` MODIFY `description` VARCHAR(500) NULL,
    MODIFY `notes` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `plan` MODIFY `features` VARCHAR(500) NOT NULL;

-- AlterTable
ALTER TABLE `property` MODIFY `services` VARCHAR(2000) NOT NULL;

-- AlterTable
ALTER TABLE `review` MODIFY `comment` VARCHAR(500) NULL;
