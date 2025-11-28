/*
  Warnings:

  - You are about to alter the column `status` on the `application` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `application` MODIFY `status` ENUM('pending', 'pre_approved', 'approved', 'rejected', 'withdrawn', 'documents_required', 'signed', 'terminated') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `payment` MODIFY `status` ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending';
