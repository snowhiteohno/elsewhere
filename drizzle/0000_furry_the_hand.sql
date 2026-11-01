CREATE TABLE `travel_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`phase` text NOT NULL,
	`category` text NOT NULL,
	`context` text NOT NULL,
	`run_id` text,
	`status` text NOT NULL,
	`result` text,
	`created_at` integer NOT NULL
);
