import { eq, desc, and } from 'drizzle-orm'
import { db } from './client'
import { players, sessions, game_scores, brain_age_log } from './schema'
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
