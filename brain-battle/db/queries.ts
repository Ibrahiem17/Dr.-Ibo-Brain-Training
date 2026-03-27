import { eq, desc, and } from 'drizzle-orm'
import { db } from './client'
import { players, sessions, game_scores, brain_age_log, quick_play_scores, solo_sessions, solo_game_scores, streaks, coins, endless_high_scores, endless_sessions } from './schema'
import type { Player, Session } from './schema'

export interface SessionWithPlayers {
  id: number
  played_at: string
  winner_id: number | null
  player1: Player
  player2: Player
  player1BrainAge: number | null
  player2BrainAge: number | null
}

export async function createOrGetPlayer(name: string, avatarColor: string): Promise<Player> {
  const existing = await db
    .select()
    .from(players)
    .where(eq(players.name, name))
    .limit(1)

  if (existing.length > 0) return existing[0]

  const result = await db
    .insert(players)
    .values({ name, avatar_color: avatarColor, created_at: new Date().toISOString() })
    .returning()

  return result[0]
}

export async function createSession(player1Id: number, player2Id: number): Promise<Session> {
  const result = await db
    .insert(sessions)
    .values({ player1_id: player1Id, player2_id: player2Id, played_at: new Date().toISOString() })
    .returning()

  return result[0]
}

export async function saveGameScore(
  sessionId: number,
  playerId: number,
  gameId: string,
  score: number,
  timeMs: number,
  accuracy: number,
): Promise<void> {
  await db.insert(game_scores).values({
    session_id: sessionId,
    player_id: playerId,
    game_id: gameId,
    score,
    time_ms: Math.round(timeMs),
    accuracy,
    played_at: new Date().toISOString(),
  })
}

export async function finaliseSession(sessionId: number, winnerId: number): Promise<void> {
  await db.update(sessions).set({ winner_id: winnerId }).where(eq(sessions.id, sessionId))
}

export async function saveBrainAge(
  playerId: number,
  sessionId: number,
  brainAge: number,
  totalScore: number,
): Promise<void> {
  await db.insert(brain_age_log).values({
    player_id: playerId,
    session_id: sessionId,
    brain_age: brainAge,
    total_score: totalScore,
    recorded_at: new Date().toISOString(),
  })
}

export async function getSessionHistory(limit = 20): Promise<SessionWithPlayers[]> {
  const rows = await db
    .select()
    .from(sessions)
    .orderBy(desc(sessions.played_at))
    .limit(limit)

  const result: SessionWithPlayers[] = []

  for (const session of rows) {
    const [p1, p2] = await Promise.all([
      db.select().from(players).where(eq(players.id, session.player1_id)).limit(1),
      db.select().from(players).where(eq(players.id, session.player2_id)).limit(1),
    ])

    const [ba1, ba2] = await Promise.all([
      db
        .select({ brain_age: brain_age_log.brain_age })
        .from(brain_age_log)
        .where(and(eq(brain_age_log.session_id, session.id), eq(brain_age_log.player_id, session.player1_id)))
        .limit(1),
      db
        .select({ brain_age: brain_age_log.brain_age })
        .from(brain_age_log)
        .where(and(eq(brain_age_log.session_id, session.id), eq(brain_age_log.player_id, session.player2_id)))
        .limit(1),
    ])

    if (p1.length && p2.length) {
      result.push({
        id: session.id,
        played_at: session.played_at,
        winner_id: session.winner_id ?? null,
        player1: p1[0],
        player2: p2[0],
        player1BrainAge: ba1[0]?.brain_age ?? null,
        player2BrainAge: ba2[0]?.brain_age ?? null,
      })
    }
  }

  return result
}

export async function saveQuickPlayScore(
  playerId: number,
  gameId: string,
  score: number,
  timeMs: number,
  accuracy: number,
): Promise<void> {
  await db.insert(quick_play_scores).values({
    player_id: playerId,
    game_id: gameId,
    score,
    time_ms: Math.round(timeMs),
    accuracy,
    played_at: new Date().toISOString(),
  })
}

export interface QuickPlayHistoryItem {
  id: number
  player: Player
  game_id: string
  score: number
  time_ms: number
  accuracy: number
  played_at: string
}

export async function getQuickPlayHistory(limit = 30): Promise<QuickPlayHistoryItem[]> {
  const rows = await db
    .select()
    .from(quick_play_scores)
    .orderBy(desc(quick_play_scores.played_at))
    .limit(limit)

  const result: QuickPlayHistoryItem[] = []
  for (const row of rows) {
    const playerRows = await db.select().from(players).where(eq(players.id, row.player_id)).limit(1)
    if (playerRows.length > 0) {
      result.push({
        id: row.id,
        player: playerRows[0],
        game_id: row.game_id,
        score: row.score,
        time_ms: row.time_ms,
        accuracy: row.accuracy,
        played_at: row.played_at,
      })
    }
  }
  return result
}

export async function saveSoloSession(
  playerId: number,
  brainAge: number,
  totalScore: number,
): Promise<number> {
  const result = await db
    .insert(solo_sessions)
    .values({ player_id: playerId, brain_age: brainAge, total_score: totalScore, recorded_at: new Date().toISOString() })
    .returning()
  return result[0].id
}

export async function saveSoloGameScores(
  soloSessionId: number,
  playerId: number,
  results: { gameId: string; score: number; timeMs: number; accuracy: number }[],
): Promise<void> {
  const now = new Date().toISOString()
  for (const r of results) {
    await db.insert(solo_game_scores).values({
      solo_session_id: soloSessionId,
      player_id: playerId,
      game_id: r.gameId,
      score: r.score,
      time_ms: Math.round(r.timeMs),
      accuracy: r.accuracy,
      played_at: now,
    })
  }
}

export async function getPlayerPersonalBest(playerName: string): Promise<number | null> {
  const playerRows = await db.select().from(players).where(eq(players.name, playerName)).limit(1)
  if (!playerRows.length) return null

  const rows = await db
    .select({ brain_age: solo_sessions.brain_age })
    .from(solo_sessions)
    .where(eq(solo_sessions.player_id, playerRows[0].id))

  if (!rows.length) return null
  return Math.min(...rows.map((r) => r.brain_age))
}

export interface SoloHistoryItem {
  id: number
  player: Player
  brainAge: number
  totalScore: number
  recordedAt: string
  gameScores: { gameId: string; score: number }[]
}

export async function getSoloHistory(limit = 20): Promise<SoloHistoryItem[]> {
  const rows = await db
    .select()
    .from(solo_sessions)
    .orderBy(desc(solo_sessions.recorded_at))
    .limit(limit)

  const result: SoloHistoryItem[] = []
  for (const row of rows) {
    const playerRows = await db.select().from(players).where(eq(players.id, row.player_id)).limit(1)
    if (!playerRows.length) continue

    const scoreRows = await db
      .select()
      .from(solo_game_scores)
      .where(eq(solo_game_scores.solo_session_id, row.id))

    result.push({
      id: row.id,
      player: playerRows[0],
      brainAge: row.brain_age,
      totalScore: row.total_score,
      recordedAt: row.recorded_at,
      gameScores: scoreRows.map((g) => ({ gameId: g.game_id, score: g.score })),
    })
  }
  return result
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getStreak(playerName: string): Promise<{
  currentStreak: number
  longestStreak: number
  lastPlayedDate: string
} | null> {
  const rows = await db
    .select()
    .from(streaks)
    .where(eq(streaks.player_name, playerName))
    .limit(1)

  if (!rows.length) return null

  return {
    currentStreak: rows[0].current_streak,
    longestStreak: rows[0].longest_streak,
    lastPlayedDate: rows[0].last_played_date,
  }
}

export async function updateStreak(playerName: string): Promise<{
  currentStreak: number
  longestStreak: number
  isNewDay: boolean
  streakBroken: boolean
  isNewRecord: boolean
}> {
  const today = getTodayString()
  const yesterday = getYesterdayString()
  const now = new Date().toISOString()

  const existing = await db
    .select()
    .from(streaks)
    .where(eq(streaks.player_name, playerName))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(streaks).values({
      player_name: playerName,
      current_streak: 1,
      longest_streak: 1,
      last_played_date: today,
      updated_at: now,
    })
    return { currentStreak: 1, longestStreak: 1, isNewDay: true, streakBroken: false, isNewRecord: true }
  }

  const record = existing[0]

  if (record.last_played_date === today) {
    return {
      currentStreak: record.current_streak,
      longestStreak: record.longest_streak,
      isNewDay: false,
      streakBroken: false,
      isNewRecord: false,
    }
  }

  let newStreak: number
  let streakBroken = false

  if (record.last_played_date === yesterday) {
    newStreak = record.current_streak + 1
  } else {
    newStreak = 1
    streakBroken = true
  }

  const newLongest = Math.max(newStreak, record.longest_streak)
  const isNewRecord = newStreak > record.longest_streak

  await db
    .update(streaks)
    .set({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_played_date: today,
      updated_at: now,
    })
    .where(eq(streaks.player_name, playerName))

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    isNewDay: true,
    streakBroken,
    isNewRecord,
  }
}

export async function getTopStreaks(): Promise<Array<{
  playerName: string
  currentStreak: number
  longestStreak: number
}>> {
  const rows = await db
    .select()
    .from(streaks)
    .orderBy(desc(streaks.current_streak))
    .limit(3)

  return rows.map((r) => ({
    playerName: r.player_name,
    currentStreak: r.current_streak,
    longestStreak: r.longest_streak,
  }))
}

export async function getLastActiveStreak(): Promise<{
  playerName: string
  currentStreak: number
  longestStreak: number
} | null> {
  const rows = await db
    .select()
    .from(streaks)
    .orderBy(desc(streaks.updated_at))
    .limit(1)

  if (!rows.length) return null

  return {
    playerName: rows[0].player_name,
    currentStreak: rows[0].current_streak,
    longestStreak: rows[0].longest_streak,
  }
}

// ─── Data management ──────────────────────────────────────────────────────────

export async function clearHistory(): Promise<void> {
  await db.delete(game_scores)
  await db.delete(brain_age_log)
  await db.delete(quick_play_scores)
  await db.delete(solo_game_scores)
  await db.delete(solo_sessions)
  await db.delete(sessions)
  await db.delete(streaks)
  await db.delete(endless_sessions)
  await db.delete(endless_high_scores)
}

export async function resetAllData(): Promise<void> {
  await clearHistory()
  await db.delete(players)
}

// ─── Player helpers ───────────────────────────────────────────────────────────

// Alias for createOrGetPlayer — get or create a player record by username.
export const getOrCreatePlayer = createOrGetPlayer

// Count total individual games played across all modes for a given player name.
export async function getGamesPlayedCount(playerName: string): Promise<number> {
  const playerRows = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.name, playerName))
    .limit(1)
  if (!playerRows.length) return 0
  const playerId = playerRows[0].id
  const [gRows, sgRows, qRows] = await Promise.all([
    db.select({ id: game_scores.id }).from(game_scores).where(eq(game_scores.player_id, playerId)),
    db.select({ id: solo_game_scores.id }).from(solo_game_scores).where(eq(solo_game_scores.player_id, playerId)),
    db.select({ id: quick_play_scores.id }).from(quick_play_scores).where(eq(quick_play_scores.player_id, playerId)),
  ])
  return gRows.length + sgRows.length + qRows.length
}

// ─── Coin helpers ─────────────────────────────────────────────────────────────

export async function getCoins(playerName: string): Promise<number> {
  const rows = await db.select().from(coins).where(eq(coins.player_name, playerName)).limit(1)
  return rows[0]?.balance ?? 0
}

export async function earnCoins(playerName: string, amount: number): Promise<number> {
  const now = new Date().toISOString()
  const existing = await db.select().from(coins).where(eq(coins.player_name, playerName)).limit(1)
  if (existing.length === 0) {
    await db.insert(coins).values({ player_name: playerName, balance: amount, updated_at: now })
    return amount
  }
  const newBalance = existing[0].balance + amount
  await db.update(coins).set({ balance: newBalance, updated_at: now }).where(eq(coins.player_name, playerName))
  return newBalance
}

// ─── Endless helpers ──────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  playerName: string
  roundsSurvived: number
  playedAt: string
}

export async function saveEndlessSession(
  playerName: string,
  gameId: string,
  roundsSurvived: number,
): Promise<void> {
  const now = new Date().toISOString()
  await db.insert(endless_sessions).values({ player_name: playerName, game_id: gameId, rounds_survived: roundsSurvived, played_at: now })
  // Update high score if this is a new best for this player+game
  const existing = await db
    .select()
    .from(endless_high_scores)
    .where(and(eq(endless_high_scores.player_name, playerName), eq(endless_high_scores.game_id, gameId)))
    .limit(1)
  if (existing.length === 0) {
    await db.insert(endless_high_scores).values({ player_name: playerName, game_id: gameId, rounds_survived: roundsSurvived, played_at: now })
  } else if (roundsSurvived > existing[0].rounds_survived) {
    await db
      .update(endless_high_scores)
      .set({ rounds_survived: roundsSurvived, played_at: now })
      .where(and(eq(endless_high_scores.player_name, playerName), eq(endless_high_scores.game_id, gameId)))
  }
}

export async function getLeaderboard(gameId: string, limit = 10): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select()
    .from(endless_high_scores)
    .where(eq(endless_high_scores.game_id, gameId))
    .orderBy(desc(endless_high_scores.rounds_survived))
    .limit(limit)
  return rows.map((r) => ({ playerName: r.player_name, roundsSurvived: r.rounds_survived, playedAt: r.played_at }))
}

export async function getPlayerEndlessBest(playerName: string, gameId: string): Promise<number> {
  const rows = await db
    .select()
    .from(endless_high_scores)
    .where(and(eq(endless_high_scores.player_name, playerName), eq(endless_high_scores.game_id, gameId)))
    .limit(1)
  return rows[0]?.rounds_survived ?? 0
}

// ─── Player stats ─────────────────────────────────────────────────────────────

export async function getPlayerStats(playerId: number): Promise<{
  averageBrainAge: number
  sessionsPlayed: number
  bestTotalScore: number
}> {
  const brainAgeRows = await db
    .select({ brain_age: brain_age_log.brain_age, total_score: brain_age_log.total_score })
    .from(brain_age_log)
    .where(eq(brain_age_log.player_id, playerId))

  const sessionsPlayed = brainAgeRows.length
  const averageBrainAge =
    sessionsPlayed > 0
      ? Math.round(brainAgeRows.reduce((sum, r) => sum + r.brain_age, 0) / sessionsPlayed)
      : 0
  const bestTotalScore =
    sessionsPlayed > 0 ? Math.max(...brainAgeRows.map((r) => r.total_score)) : 0

  return { averageBrainAge, sessionsPlayed, bestTotalScore }
}
