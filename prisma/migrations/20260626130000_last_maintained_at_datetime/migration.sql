-- AlterTable
ALTER TABLE `user_profiles` DROP COLUMN `last_maintained_through`;

-- AlterTable
ALTER TABLE `user_profiles` ADD COLUMN `last_maintained_at` DATETIME(3) NULL;
