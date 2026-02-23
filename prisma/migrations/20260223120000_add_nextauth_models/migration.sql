-- Add columns required by NextAuth credentials and adapter flows.
ALTER TABLE `User`
  ADD COLUMN `image` TEXT NULL,
  ADD COLUMN `emailVerified` DATETIME(3) NULL,
  ADD COLUMN `passwordHash` VARCHAR(191) NULL;

-- Auth.js account table for provider-linked identities.
CREATE TABLE `Account` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `providerAccountId` VARCHAR(191) NOT NULL,
  `refresh_token` TEXT NULL,
  `access_token` TEXT NULL,
  `expires_at` INTEGER NULL,
  `token_type` VARCHAR(191) NULL,
  `scope` VARCHAR(191) NULL,
  `id_token` TEXT NULL,
  `session_state` VARCHAR(191) NULL,
  UNIQUE INDEX `Account_provider_providerAccountId_key` (`provider`, `providerAccountId`),
  INDEX `Account_userId_idx` (`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Auth.js session persistence table.
CREATE TABLE `Session` (
  `id` VARCHAR(191) NOT NULL,
  `sessionToken` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Session_sessionToken_key` (`sessionToken`),
  INDEX `Session_userId_idx` (`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Auth.js verification token table (password reset/email verification).
CREATE TABLE `VerificationToken` (
  `identifier` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  UNIQUE INDEX `VerificationToken_token_key` (`token`),
  UNIQUE INDEX `VerificationToken_identifier_token_key` (`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Account`
  ADD CONSTRAINT `Account_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Session`
  ADD CONSTRAINT `Session_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
