import * as SQLite from 'expo-sqlite'
import { drizzle } from 'drizzle-orm/expo-sqlite'

const sqliteDb = SQLite.openDatabaseSync('brain-battle.db')

export const db = drizzle(sqliteDb)

export async function initDB(): Promise<void> {
  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER NOT NULL REFERENCES players(id),
      player2_id INTEGER NOT NULL REFERENCES players(id),
      winner_id INTEGER REFERENCES players(id),
      played_at TEXT NOT NULL
    );
  `)

  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      player_id INTEGER NOT NULL REFERENCES players(id),
      game_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      time_ms INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      played_at TEXT NOT NULL
    );
  `)

  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS brain_age_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id),
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      brain_age INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      recorded_at TEXT NOT NULL
    );
  `)
}
