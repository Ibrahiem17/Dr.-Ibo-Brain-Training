import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  avatar_color: text('avatar_color').notNull(),
  created_at: text('created_at').notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player1_id: integer('player1_id').notNull().references(() => players.id),
  player2_id: integer('player2_id').notNull().references(() => players.id),
  winner_id: integer('winner_id').references(() => players.id),
  played_at: text('played_at').notNull(),
})

export const game_scores = sqliteTable('game_scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  session_id: integer('session_id').notNull().references(() => sessions.id),
  player_id: integer('player_id').notNull().references(() => players.id),
  game_id: text('game_id').notNull(),
  score: integer('score').notNull(),
  time_ms: integer('time_ms').notNull(),
  accuracy: real('accuracy').notNull(),
  played_at: text('played_at').notNull(),
})

export const brain_age_log = sqliteTable('brain_age_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_id: integer('player_id').notNull().references(() => players.id),
  session_id: integer('session_id').notNull().references(() => sessions.id),
  brain_age: integer('brain_age').notNull(),
  total_score: integer('total_score').notNull(),
  recorded_at: text('recorded_at').notNull(),
})

export type Player = InferSelectModel<typeof players>
export type PlayerInsert = InferInsertModel<typeof players>
export type Session = InferSelectModel<typeof sessions>
export type SessionInsert = InferInsertModel<typeof sessions>
export type GameScore = InferSelectModel<typeof game_scores>
export type GameScoreInsert = InferInsertModel<typeof game_scores>
export type BrainAgeLog = InferSelectModel<typeof brain_age_log>
export type BrainAgeLogInsert = InferInsertModel<typeof brain_age_log>
