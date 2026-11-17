-- DropForeignKey
ALTER TABLE `room` DROP FOREIGN KEY `Room_songId_fkey`;

-- DropIndex
DROP INDEX `Room_songId_key` ON `room`;

-- AlterTable
ALTER TABLE `album` MODIFY `title` VARCHAR(255) NOT NULL,
    DROP COLUMN `release`,
    ADD COLUMN `release` TIMESTAMP(0) NOT NULL,
    MODIFY `cover_image_url` VARCHAR(255) NULL,
    MODIFY `description` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `message` MODIFY `content` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `content` VARCHAR(255) NOT NULL,
    ALTER COLUMN `is_read` DROP DEFAULT;

-- AlterTable
ALTER TABLE `playlist` MODIFY `title` VARCHAR(255) NULL,
    MODIFY `description` VARCHAR(255) NULL,
    MODIFY `cover_image_url` VARCHAR(255) NULL,
    MODIFY `visibility` VARCHAR(255) NOT NULL,
    MODIFY `updated_at` TIMESTAMP(0) NULL;

-- AlterTable
ALTER TABLE `room` DROP COLUMN `songId`,
    MODIFY `room_name` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `song` ADD COLUMN `Roomroom_id` INTEGER NULL,
    MODIFY `title` VARCHAR(255) NOT NULL,
    MODIFY `genre` VARCHAR(255) NULL,
    MODIFY `composer` VARCHAR(255) NULL,
    MODIFY `artist` VARCHAR(255) NOT NULL,
    MODIFY `audioFile` VARCHAR(255) NOT NULL,
    MODIFY `coverUrl` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'user',
    MODIFY `full_name` VARCHAR(255) NOT NULL,
    MODIFY `email` VARCHAR(255) NOT NULL,
    MODIFY `avatar_url` VARCHAR(255) NOT NULL,
    MODIFY `nickname` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `user_room` MODIFY `role` VARCHAR(255) NULL;

-- AddForeignKey
ALTER TABLE `Song` ADD CONSTRAINT `Song_Roomroom_id_fkey` FOREIGN KEY (`Roomroom_id`) REFERENCES `Room`(`room_id`) ON DELETE SET NULL ON UPDATE CASCADE;
