-- CreateTable
CREATE TABLE `guest_trial_messages` (
    `id` VARCHAR(191) NOT NULL,
    `guest_id` VARCHAR(32) NOT NULL,
    `character_id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `parts` JSON NOT NULL,
    `client_ip` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `guest_trial_messages_guest_id_character_id_created_at_idx`(`guest_id`, `character_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `guest_trial_messages` ADD CONSTRAINT `guest_trial_messages_character_id_fkey` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
