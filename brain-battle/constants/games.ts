export const GAMES = [
  { id: 'mental-math',     label: 'Mental Math',      icon: 'S', rounds: 8,  timePerRound: 6  },
  { id: 'grid-memory',     label: 'Grid Memory',      icon: '#', rounds: 6,  timePerRound: 0  },
  { id: 'stroop-test',     label: 'Stroop Test',      icon: 'O', rounds: 10, timePerRound: 4  },
  { id: 'number-sequence', label: 'Number Sequence',  icon: '?', rounds: 6,  timePerRound: 0  },
  { id: 'falling-blocks',  label: 'Falling Blocks',   icon: 'B', rounds: 5,  timePerRound: 0  },
  { id: 'exploding-cube',  label: 'Exploding Cube',   icon: 'C', rounds: 4,  timePerRound: 0  },
  { id: 'flag-direction',  label: 'Flag Direction',   icon: 'F', rounds: 5,  timePerRound: 0  },
] as const

export type GameId = typeof GAMES[number]['id']
