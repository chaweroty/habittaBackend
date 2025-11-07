/*
  Warnings:

  - The primary key for the `plan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `duration_months` on the `plan` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `plan` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `id_plan` on the `subscription` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[reference_code]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `duration_days` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `subscription` DROP FOREIGN KEY `Subscription_id_plan_fkey`;

-- DropIndex
DROP INDEX `Subscription_id_plan_fkey` ON `subscription`;

-- AlterTable
ALTER TABLE `payment` MODIFY `method` ENUM('card', 'transfer', 'cash', 'other') NULL,
    MODIFY `payment_date` DATETIME(3) NULL,
    MODIFY `reference_code` VARCHAR(191) NULL,
    MODIFY `status` ENUM('pending', 'completed', 'failed', 'refunded', 'lated') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `plan` DROP PRIMARY KEY,
    DROP COLUMN `duration_months`,
    ADD COLUMN `duration_days` INTEGER NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `subscription` MODIFY `id_plan` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Payment_reference_code_key` ON `Payment`(`reference_code`);

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_id_plan_fkey` FOREIGN KEY (`id_plan`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
