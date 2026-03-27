// In-memory cache of the last player name/color used in endless mode.
// Pre-fills the endless setup form within a session.

let _lastName = ''
let _lastColor = '#00e5ff'

export function getLastKnownPlayer(): { name: string; color: string } {
  return { name: _lastName, color: _lastColor }
}

export function setLastKnownPlayer(name: string, color: string): void {
  _lastName = name
  _lastColor = color
}
