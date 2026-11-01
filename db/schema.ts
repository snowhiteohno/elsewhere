import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const travelJobs=sqliteTable('travel_jobs',{id:text('id').primaryKey(),owner:text('owner').notNull(),phase:text('phase').notNull(),category:text('category').notNull(),context:text('context').notNull(),runId:text('run_id'),status:text('status').notNull(),result:text('result'),createdAt:integer('created_at').notNull()});
