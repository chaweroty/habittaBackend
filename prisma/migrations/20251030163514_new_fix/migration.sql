/*
  Warnings:

  - You are about to alter the column `publication_status` on the `property` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `property` MODIFY `publication_status` ENUM('published', 'rented', 'disabled', 'expired') NOT NULL DEFAULT 'published';
