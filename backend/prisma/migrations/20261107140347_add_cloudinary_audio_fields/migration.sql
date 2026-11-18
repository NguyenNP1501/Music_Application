-- AlterTable
ALTER TABLE `song` ADD COLUMN `audio_public_id` VARCHAR(255) NULL,
    MODIFY `audio_url` VARCHAR(1000) NOT NULL;
