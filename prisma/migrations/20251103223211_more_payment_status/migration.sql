-- AlterTable
ALTER TABLE `payment` MODIFY `status` ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'overdue') NOT NULL DEFAULT 'pending';
