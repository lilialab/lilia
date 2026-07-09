-- AlterTable
ALTER TABLE `user_memories` ADD COLUMN `is_maintained` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `user_memories_user_id_is_deleted_is_maintained_created_at_idx` ON `user_memories`(`user_id`, `is_deleted`, `is_maintained`, `created_at`);

-- AlterTable
ALTER TABLE `user_profiles` DROP COLUMN `last_maintained_through`;
