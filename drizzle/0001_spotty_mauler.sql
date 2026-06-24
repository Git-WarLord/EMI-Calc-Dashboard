CREATE TABLE `emiHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`dueDate` date NOT NULL,
	`paidDate` date,
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emiHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`date` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `income` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`date` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `income_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`monthlyEMI` decimal(12,2) NOT NULL,
	`remainingEMIs` int NOT NULL,
	`totalRemaining` decimal(12,2) NOT NULL,
	`dueDate` varchar(50) NOT NULL,
	`closesIn` varchar(100) NOT NULL,
	`status` enum('active','closed','paused') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthlySummary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(50) NOT NULL,
	`totalEMI` decimal(12,2) NOT NULL DEFAULT '0',
	`totalIncome` decimal(12,2) NOT NULL DEFAULT '0',
	`totalExpenses` decimal(12,2) NOT NULL DEFAULT '0',
	`activeLoans` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthlySummary_id` PRIMARY KEY(`id`)
);
