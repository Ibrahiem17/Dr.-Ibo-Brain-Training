# Brain Battle

Brain Battle is a two-player offline brain training game built with React Native and Expo. Both players share a single device and take turns competing across 7 unique cognitive mini-games. At the end of all 7 games, a results screen calculates each player's personalised brain age and declares a winner.

Each game challenges a different cognitive skill — arithmetic speed, visual memory, color-word interference, sequence recall, pattern recognition, spatial memory, and directional awareness. Scores are stored locally using SQLite so players can track their progress and brain age over time through the session history screen.

## Screenshots

![Home Screen](screenshots/home.png)
![Game in Progress](screenshots/game.png)
![Results Screen](screenshots/results.png)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 55 (managed workflow) |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router v3 |
| Animations | React Native Reanimated 4, Moti |
| 2D Canvas | @shopify/react-native-skia |
| Vector Graphics | react-native-svg |
| Database | expo-sqlite + Drizzle ORM |
| State | Zustand |
| Icons | @expo/vector-icons |
| Haptics | expo-haptics |

## Setup

```bash
git clone <repo-url>
cd brain-battle
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your device, or press `a` to open in an Android emulator.

## Build for Distribution

### Prerequisites

```bash
npm install -g eas-cli
eas login
```

### Android APK (testing / sideload)

```bash
eas build --platform android --profile preview
```

### Android App Bundle (Play Store)

```bash
eas build --platform android --profile production
```

### Submit to Play Store

```bash
eas submit --platform android --profile production
```

## Play Store Checklist

- [ ] Google Play Developer account ($25 one-time fee at play.google.com/console)
- [ ] Run `node scripts/generate-icon.js` to regenerate icon assets (requires `npm install canvas`)
- [ ] Export 512×512 PNG icon for Play Store listing
- [ ] Create 1024×500 feature graphic PNG
- [ ] Take 2+ phone screenshots from a real device or emulator
- [ ] Write short description (under 80 characters)
- [ ] Write full description (200+ words)
- [ ] Host `assets/privacy-policy.md` publicly (e.g. GitHub Pages) and add URL to Play Console
- [ ] Create `google-play-key.json` service account key in Google Cloud Console
- [ ] Complete content rating questionnaire (select "Everyone")
- [ ] Set app category: "Brain Games" or "Puzzle"

## Project Structure

```
app/                    Expo Router screens
  game/                 One screen file per mini-game
components/
  ui/                   Shared UI components (Button, TimerBar, etc.)
  games/                Game logic + UI per game (hook + component)
db/                     Drizzle ORM schema, client, and queries
store/                  Zustand state stores
constants/              Colors and game definitions
utils/                  Scoring and random utilities
hooks/                  Shared hooks (countdown, timer, toast)
assets/                 Icons, splash, privacy policy
scripts/                Icon generation script
```

## Games

| # | Game | Skill | Rounds |
|---|------|-------|--------|
| 1 | Mental Math | Arithmetic speed | 8 |
| 2 | Grid Memory | Visual memory | 6 |
| 3 | Stroop Test | Cognitive interference | 10 |
| 4 | Number Sequence | Working memory | 6 |
| 5 | Falling Blocks | Attention & counting | 5 |
| 6 | Exploding Cube | Spatial memory | 4 |
| 7 | Flag Direction | Sequence recall | 5 |

## License

MIT
