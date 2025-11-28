-- AlterTable
ALTER TABLE `legaldocument` MODIFY `status` ENUM('pending', 'approved', 'rejected', 'expired', 'deleted') NOT NULL;

-- AlterTable
ALTER TABLE `property` MODIFY `publication_status` ENUM('published', 'rented', 'disabled', 'expired', 'deleted') NOT NULL DEFAULT 'published';

-- AlterTable
ALTER TABLE `User` MODIFY `status` ENUM('Verified', 'Unverified', 'Pending', 'Deleted') NOT NULL DEFAULT 'Unverified';
