ALTER TABLE `incomeRecords` MODIFY COLUMN `source` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `incomeRecords` ADD `description` text;--> statement-breakpoint
ALTER TABLE `incomeRecords` DROP COLUMN `notes`;