/*
  Warnings:

  - You are about to alter the column `status` on the `legaldocument` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `legaldocument` MODIFY `status` ENUM('pending', 'approved', 'rejected', 'expired') NOT NULL;
