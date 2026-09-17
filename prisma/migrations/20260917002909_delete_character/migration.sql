/*
  Warnings:

  - You are about to drop the column `is_listed` on the `characters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `characters` DROP COLUMN `is_listed`,
    ADD COLUMN `deleted_at` DATETIME(3) NULL;
