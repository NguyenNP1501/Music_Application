/*
  Warnings:

  - You are about to drop the column `userId` on the `album` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `albumId` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `songId` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `notification` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `playlist` table. All the data in the column will be lost.
  - The primary key for the `playlist_song` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `playlistId` on the `playlist_song` table. All the data in the column will be lost.
  - You are about to drop the column `songId` on the `playlist_song` table. All the data in the column will be lost.
  - You are about to drop the column `songId` on the `room` table. All the data in the column will be lost.
  - You are about to drop the column `albumId` on the `song` table. All the data in the column will be lost.
  - You are about to drop the column `lyrics` on the `song` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `song` table. All the data in the column will be lost.
  - The primary key for the `user_room` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `roomId` on the `user_room` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `user_room` table. All the data in the column will be lost.
  - Added the required column `Useruser_id` to the `Album` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `release` on the `album` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `Roomroom_id` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Useruser_id` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Useruser_id` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Playlistplaylist_id` to the `Playlist_Song` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Songsong_id` to the `Playlist_Song` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Albumalbum_id` to the `Song` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Useruser_id` to the `Song` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `release` on the `song` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `Roomroom_id` to the `User_Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Useruser_id` to the `User_Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `album` DROP FOREIGN KEY `Album_userId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_albumId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_songId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `playlist` DROP FOREIGN KEY `Playlist_userId_fkey`;

-- DropForeignKey
ALTER TABLE `playlist_song` DROP FOREIGN KEY `Playlist_Song_playlistId_fkey`;

-- DropForeignKey
ALTER TABLE `playlist_song` DROP FOREIGN KEY `Playlist_Song_songId_fkey`;

-- DropForeignKey
ALTER TABLE `room` DROP FOREIGN KEY `Room_songId_fkey`;

-- DropForeignKey
ALTER TABLE `song` DROP FOREIGN KEY `Song_albumId_fkey`;

-- DropForeignKey
ALTER TABLE `song` DROP FOREIGN KEY `Song_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_room` DROP FOREIGN KEY `User_Room_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `user_room` DROP FOREIGN KEY `User_Room_userId_fkey`;

-- DropIndex
DROP INDEX `Album_userId_fkey` ON `album`;

-- DropIndex
DROP INDEX `Message_roomId_fkey` ON `message`;

-- DropIndex
DROP INDEX `Notification_albumId_fkey` ON `notification`;

-- DropIndex
DROP INDEX `Notification_songId_fkey` ON `notification`;

-- DropIndex
DROP INDEX `Notification_userId_fkey` ON `notification`;

-- DropIndex
DROP INDEX `Playlist_userId_fkey` ON `playlist`;

-- DropIndex
DROP INDEX `Playlist_Song_songId_fkey` ON `playlist_song`;

-- DropIndex
DROP INDEX `Room_songId_key` ON `room`;

-- DropIndex
DROP INDEX `Song_albumId_fkey` ON `song`;

-- DropIndex
DROP INDEX `Song_userId_fkey` ON `song`;

-- DropIndex
DROP INDEX `User_Room_roomId_fkey` ON `user_room`;

-- AlterTable
ALTER TABLE `album` DROP COLUMN `userId`,
    ADD COLUMN `Useruser_id` INTEGER NOT NULL,
    MODIFY `title` VARCHAR(255) NOT NULL,
    DROP COLUMN `release`,
    ADD COLUMN `release` TIMESTAMP(0) NOT NULL,
    MODIFY `cover_image_url` VARCHAR(255) NULL,
    MODIFY `description` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `message` DROP COLUMN `roomId`,
    ADD COLUMN `Roomroom_id` INTEGER NOT NULL,
    MODIFY `content` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `notification` DROP COLUMN `albumId`,
    DROP COLUMN `songId`,
    DROP COLUMN `userId`,
    ADD COLUMN `Albumalbum_id` INTEGER NULL,
    ADD COLUMN `Songsong_id` INTEGER NULL,
    ADD COLUMN `Useruser_id` INTEGER NOT NULL,
    MODIFY `content` VARCHAR(255) NOT NULL,
    ALTER COLUMN `is_read` DROP DEFAULT;

-- AlterTable
ALTER TABLE `playlist` DROP COLUMN `userId`,
    ADD COLUMN `Useruser_id` INTEGER NOT NULL,
    MODIFY `title` VARCHAR(255) NULL,
    MODIFY `description` VARCHAR(255) NULL,
    MODIFY `cover_image_url` VARCHAR(255) NULL,
    MODIFY `visibility` VARCHAR(255) NOT NULL,
    MODIFY `updated_at` TIMESTAMP(0) NULL;

-- AlterTable
ALTER TABLE `playlist_song` DROP PRIMARY KEY,
    DROP COLUMN `playlistId`,
    DROP COLUMN `songId`,
    ADD COLUMN `Playlistplaylist_id` INTEGER NOT NULL,
    ADD COLUMN `Songsong_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`Playlistplaylist_id`, `Songsong_id`);

-- AlterTable
ALTER TABLE `room` DROP COLUMN `songId`,
    MODIFY `room_name` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `song` DROP COLUMN `albumId`,
    DROP COLUMN `lyrics`,
    DROP COLUMN `userId`,
    ADD COLUMN `Albumalbum_id` INTEGER NOT NULL,
    ADD COLUMN `Roomroom_id` INTEGER NULL,
    ADD COLUMN `Useruser_id` INTEGER NOT NULL,
    MODIFY `title` VARCHAR(255) NOT NULL,
    DROP COLUMN `release`,
    ADD COLUMN `release` TIMESTAMP(0) NOT NULL,
    MODIFY `audio_url` VARCHAR(255) NOT NULL,
    MODIFY `description` VARCHAR(255) NULL,
    MODIFY `genre` VARCHAR(255) NOT NULL,
    MODIFY `composer` VARCHAR(255) NOT NULL,
    MODIFY `singer` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'user',
    MODIFY `full_name` VARCHAR(255) NOT NULL,
    MODIFY `email` VARCHAR(255) NOT NULL,
    MODIFY `avatar_url` VARCHAR(255) NOT NULL,
    MODIFY `nickname` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `user_room` DROP PRIMARY KEY,
    DROP COLUMN `roomId`,
    DROP COLUMN `userId`,
    ADD COLUMN `Roomroom_id` INTEGER NOT NULL,
    ADD COLUMN `Useruser_id` INTEGER NOT NULL,
    MODIFY `role` VARCHAR(255) NULL,
    ADD PRIMARY KEY (`Useruser_id`, `Roomroom_id`);

-- AddForeignKey
ALTER TABLE `Playlist` ADD CONSTRAINT `Playlist_Useruser_id_fkey` FOREIGN KEY (`Useruser_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Song` ADD CONSTRAINT `Song_Albumalbum_id_fkey` FOREIGN KEY (`Albumalbum_id`) REFERENCES `Album`(`album_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Song` ADD CONSTRAINT `Song_Roomroom_id_fkey` FOREIGN KEY (`Roomroom_id`) REFERENCES `Room`(`room_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Song` ADD CONSTRAINT `Song_Useruser_id_fkey` FOREIGN KEY (`Useruser_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Album` ADD CONSTRAINT `Album_Useruser_id_fkey` FOREIGN KEY (`Useruser_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_Roomroom_id_fkey` FOREIGN KEY (`Roomroom_id`) REFERENCES `Room`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist_Song` ADD CONSTRAINT `Playlist_Song_Playlistplaylist_id_fkey` FOREIGN KEY (`Playlistplaylist_id`) REFERENCES `Playlist`(`playlist_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist_Song` ADD CONSTRAINT `Playlist_Song_Songsong_id_fkey` FOREIGN KEY (`Songsong_id`) REFERENCES `Song`(`song_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_Room` ADD CONSTRAINT `User_Room_Useruser_id_fkey` FOREIGN KEY (`Useruser_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_Room` ADD CONSTRAINT `User_Room_Roomroom_id_fkey` FOREIGN KEY (`Roomroom_id`) REFERENCES `Room`(`room_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_Useruser_id_fkey` FOREIGN KEY (`Useruser_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_Albumalbum_id_fkey` FOREIGN KEY (`Albumalbum_id`) REFERENCES `Album`(`album_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_Songsong_id_fkey` FOREIGN KEY (`Songsong_id`) REFERENCES `Song`(`song_id`) ON DELETE SET NULL ON UPDATE CASCADE;
