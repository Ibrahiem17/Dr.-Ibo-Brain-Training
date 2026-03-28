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

export const quick_play_scores = sqliteTable('quick_play_scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_id: integer('player_id').notNull().references(() => players.id),
  game_id: text('game_id').notNull(),
  score: integer('score').notNull(),
  time_ms: integer('time_ms').notNull(),
  accuracy: real('accuracy').notNull(),
  played_at: text('played_at').notNull(),
})

export type QuickPlayScore = InferSelectModel<typeof quick_play_scores>
export type QuickPlayScoreInsert = InferInsertModel<typeof quick_play_scores>

export const solo_sessions = sqliteTable('solo_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_id: integer('player_id').notNull().references(() => players.id),
  brain_age: integer('brain_age').notNull(),
  total_score: integer('total_score').notNull(),
  recorded_at: text('recorded_at').notNull(),
})

export const solo_game_scores = sqliteTable('solo_game_scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  solo_session_id: integer('solo_session_id').notNull().references(() => solo_sessions.id),
  player_id: integer('player_id').notNull().references(() => players.id),
  game_id: text('game_id').notNull(),
  score: integer('score').notNull(),
  time_ms: integer('time_ms').notNull(),
  accuracy: real('accuracy').notNull(),
  played_at: text('played_at').notNull(),
})

export type SoloSession = InferSelectModel<typeof solo_sessions>
export type SoloGameScore = InferSelectModel<typeof solo_game_scores>

export const streaks = sqliteTable('streaks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_name: text('player_name').notNull(),
  current_streak: integer('current_streak').notNull().default(0),
  longest_streak: integer('longest_streak').notNull().default(0),
  last_played_date: text('last_played_date').notNull(),
  updated_at: text('updated_at').notNull(),
})

export const coins = sqliteTable('coins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_name: text('player_name').notNull(),
  balance: integer('balance').notNull().default(0),
  updated_at: text('updated_at').notNull(),
})

export const endless_high_scores = sqliteTable('endless_high_scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_name: text('player_name').notNull(),
  game_id: text('game_id').notNull(),
  rounds_survived: integer('rounds_survived').notNull(),
  played_at: text('played_at').notNull(),
})

export const endless_sessions = sqliteTable('endless_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_name: text('player_name').notNull(),
  game_id: text('game_id').notNull(),
  rounds_survived: integer('rounds_survived').notNull(),
  played_at: text('played_at').notNull(),
})

export type Coin = InferSelectModel<typeof coins>
export type EndlessHighScore = InferSelectModel<typeof endless_high_scores>
export type EndlessSession = InferSelectModel<typeof endless_sessions>

export const shopPurchases = sqliteTable('shop_purchases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  player_name: text('player_name').notNull(),
  item_id: text('item_id').notNull(),
  purchased_at: text('purchased_at').notNull(),
})

export type ShopPurchase = InferSelectModel<typeof shopPurchases>
