/*
  Warnings:

  - The values [transfer] on the enum `Payment_method` will be removed. If these variants are still used in the database, this will fail.
  - The values [lated] on the enum `Payment_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `payment` MODIFY `method` ENUM('card', 'bank_transfer', 'app_transfer', 'cash', 'other') NULL,
    MODIFY `status` ENUM('pending', 'completed', 'failed', 'refunded', 'overdue') NOT NULL DEFAULT 'pending';
