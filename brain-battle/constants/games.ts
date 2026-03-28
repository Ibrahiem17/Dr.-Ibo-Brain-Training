import type React from 'react'
import MentalMathIcon     from '../components/games/icons/MentalMathIcon'
import GridMemoryIcon     from '../components/games/icons/GridMemoryIcon'
import StroopTestIcon     from '../components/games/icons/StroopTestIcon'
import NumberSequenceIcon from '../components/games/icons/NumberSequenceIcon'
import FallingBlocksIcon  from '../components/games/icons/FallingBlocksIcon'
import ExplodingCubeIcon  from '../components/games/icons/ExplodingCubeIcon'
import FlagDirectionIcon  from '../components/games/icons/FlagDirectionIcon'
import ReactionTapIcon    from '../components/games/icons/ReactionTapIcon'
import SymbolCipherIcon   from '../components/games/icons/SymbolCipherIcon'

export const GAMES = [
  {
    id:           'mental-math',
    label:        'Mental Math',
    icon:         '∑',
    rounds:       5,
    timePerRound: 6,
    color:        '#00e5ff',
    difficulty:   2,
    description:  'Solve fast',
    locked:       false,
    price:        0,
  },
  {
    id:           'grid-memory',
    label:        'Grid Memory',
    icon:         '⊞',
    rounds:       4,
    timePerRound: 0,
    color:        '#ff2d6b',
    difficulty:   2,
    description:  'Count the lit balls',
    locked:       false,
    price:        0,
  },
  {
    id:           'stroop-test',
    label:        'Stroop Test',
    icon:         '◉',
    rounds:       10,
    timePerRound: 4,
    color:        '#aaff00',
    difficulty:   1,
    description:  'Name the ink colour',
    locked:       false,
    price:        0,
  },
  {
    id:           'number-sequence',
    label:        'Number Sequence',
    icon:         '⟳',
    rounds:       6,
    timePerRound: 0,
    color:        '#ff9f00',
    difficulty:   3,
    description:  'Repeat the digits',
    locked:       false,
    price:        0,
  },
  {
    id:           'falling-blocks',
    label:        'Falling Blocks',
    icon:         '▦',
    rounds:       5,
    timePerRound: 0,
    color:        '#c084fc',
    difficulty:   3,
    description:  'Watch and count',
    locked:       false,
    price:        0,
  },
  {
    id:           'exploding-cube',
    label:        'Exploding Cube',
    icon:         '⬡',
    rounds:       4,
    timePerRound: 0,
    color:        '#f97316',
    difficulty:   3,
    description:  'Find the pieces',
    locked:       false,
    price:        0,
  },
  {
    id:           'flag-direction',
    label:        'Flag Direction',
    icon:         '⚑',
    rounds:       5,
    timePerRound: 0,
    color:        '#34d399',
    difficulty:   2,
    description:  'Copy the sequence',
    locked:       false,
    price:        0,
  },
  {
    id:           'reaction-tap',
    label:        'Reaction Tap',
    icon:         '⚡',
    rounds:       5,
    timePerRound: 0,
    color:        '#f43f5e',
    difficulty:   2,
    description:  'Tap on the signal',
    locked:       true,
    price:        200,
  },
  {
    id:           'symbol-cipher',
    label:        'Symbol Cipher',
    icon:         '★',
    rounds:       4,
    timePerRound: 0,
    color:        '#818cf8',
    difficulty:   3,
    description:  'Decode the symbols',
    locked:       true,
    price:        200,
  },
] as const

export type GameId = typeof GAMES[number]['id']

export const GAME_ICONS: Record<GameId, React.ComponentType<{ size?: number; color?: string }>> = {
  'mental-math':     MentalMathIcon,
  'grid-memory':     GridMemoryIcon,
  'stroop-test':     StroopTestIcon,
  'number-sequence': NumberSequenceIcon,
  'falling-blocks':  FallingBlocksIcon,
  'exploding-cube':  ExplodingCubeIcon,
  'flag-direction':  FlagDirectionIcon,
  'reaction-tap':    ReactionTapIcon,
  'symbol-cipher':   SymbolCipherIcon,
}
