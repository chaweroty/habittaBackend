/*
  Warnings:

  - You are about to drop the column `id_tenant` on the `maintenance` table. All the data in the column will be lost.
  - The values [scheduled,payment_pending,in_progress] on the enum `Maintenance_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [tenant] on the enum `Maintenance_responsibility` will be removed. If these variants are still used in the database, this will fail.
  - The values [tenant] on the enum `Maintenance_created_by` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lastName` on the `user` table. All the data in the column will be lost.
  - Added the required column `id_user` to the `Maintenance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `maintenance` DROP FOREIGN KEY `Maintenance_id_tenant_fkey`;

-- DropIndex
DROP INDEX `Maintenance_id_tenant_fkey` ON `maintenance`;

-- AlterTable
ALTER TABLE `maintenance` DROP COLUMN `id_tenant`,
    ADD COLUMN `id_user` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('pending', 'accepted', 'confirmed', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    MODIFY `responsibility` ENUM('owner', 'user') NOT NULL DEFAULT 'owner',
    MODIFY `created_by` ENUM('owner', 'user') NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `lastName`;

-- AddForeignKey
ALTER TABLE `Maintenance` ADD CONSTRAINT `Maintenance_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
