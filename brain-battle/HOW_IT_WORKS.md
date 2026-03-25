# Brain Battle — Complete Technical Explanation

> Written for a junior developer who knows JavaScript but is new to TypeScript, React Native, and Expo. Every decision is explained. Every piece of syntax is broken down. Read this alongside the code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack — Every Library Explained](#2-tech-stack)
3. [Project Folder Structure](#3-project-folder-structure)
4. [TypeScript — Every Pattern Used](#4-typescript-patterns)
5. [React and React Native Patterns](#5-react-patterns)
6. [Every Mini-Game — Deep Technical Explanation](#6-mini-games)
7. [Navigation and Routing](#7-navigation-and-routing)
8. [State Management Deep Dive](#8-state-management)
9. [Database Layer](#9-database-layer)
10. [Animations — How Reanimated 3 Works](#10-animations)
11. [The Skia Canvas (Falling Blocks)](#11-skia-canvas)
12. [The 3D Scene (Exploding Cube)](#12-3d-scene)
13. [The Flag Direction Game](#13-flag-direction)
14. [The Two-Player System](#14-two-player-system)
15. [Google Play Store Publishing](#15-publishing)
16. [Interview Preparation](#16-interview-questions)

---

## 1. Project Overview

Brain Battle is a two-player offline mobile game where both players share one physical device. The game tests seven different cognitive abilities — arithmetic speed, visual memory, colour-word interference, number recall, attention tracking, spatial memory, and pattern recall. After both players complete all seven games, the app calculates a "brain age" for each player (a number representing how sharp their cognitive performance was, where a lower number is better) and declares a winner.

### The Full User Journey

The journey starts on the **Home screen**, which shows a title and two buttons: "New Game" and "History". Tapping "New Game" takes both players to the **Setup screen**, where they each type their name and are assigned a colour. Tapping "Start Battle!" creates database records for both players and a new session, then navigates to the first game — Mental Math.

Before every game begins, a **Countdown Overlay** appears showing the game name, the current player's name in their colour, and a 3→2→1→GO! countdown. After "GO!" the game itself starts. When the game ends, the app navigates to the **Handoff screen**, which asks the first player to pass the phone to the second player. The second player taps "I'm Ready", sees their own countdown, and plays the same game. This handoff pattern repeats for all seven games — 14 total turns (2 players × 7 games).

After the last game's second player finishes, the app navigates to the **Results screen**, which reveals both players' scores for all seven games in an animated table, then counts down to reveal each player's brain age, and finally displays a winner banner.

The **History screen** shows all previously completed sessions pulled from the local SQLite database.

### Every Screen

| Screen | File | Purpose |
|---|---|---|
| Home | `app/index.tsx` | Entry point — "New Game" or "History" |
| Setup | `app/setup.tsx` | Enter player names, pick colours, start session |
| Handoff | `app/handoff.tsx` | Pass phone between players between turns |
| Results | `app/results.tsx` | Animated score reveal, brain ages, winner |
| History | `app/history.tsx` | List of all past sessions from DB |
| Game Shell | `app/game/[game].tsx` | Countdown → game component → navigate away |
| Game Layout | `app/game/_layout.tsx` | Session guard for all game routes |

### Every Mini-Game

| Game | File | What the Player Does |
|---|---|---|
| Mental Math | `app/game/mental-math.tsx` | Solve 8 arithmetic problems as fast as possible |
| Grid Memory | `app/game/grid-memory.tsx` | Watch coloured circles light up, then answer "how many?" |
| Stroop Test | `app/game/stroop-test.tsx` | Tap the ink colour of a word, ignoring what the word says |
| Number Sequence | `app/game/number-sequence.tsx` | Watch digits flash one at a time, reproduce the sequence |
| Falling Blocks | `app/game/falling-blocks.tsx` | Watch coloured blocks fall, answer questions about what you saw |
| Exploding Cube | `app/game/exploding-cube.tsx` | Memorise highlighted cubelets, find them after they scatter |
| Flag Direction | `app/game/flag-direction.tsx` | Watch a stick figure point in a sequence of directions, reproduce it |

The key takeaway from this section: every user interaction — from tapping "New Game" to seeing the results — is deliberately designed around a single shared device, which creates unique architecture challenges around whose turn it is and how state flows through 14 sequential game turns.

---

## 2. Tech Stack

### TypeScript

TypeScript is JavaScript with a type system added on top. It is compiled back to JavaScript before running — the device never runs TypeScript directly. The type system exists purely for the developer: it catches bugs at the time you write the code rather than at the time the app crashes.

**Why it was used:** With a game this complex — 7 games, 2 players, a database, a scoring system — bugs caused by passing the wrong type of data are extremely common. For example, calling `calcBrainAge("hello")` instead of `calcBrainAge([80, 70, 90, 60, 75, 85, 55])` would silently produce `NaN` at runtime in JavaScript. TypeScript prevents this at the editor level.

**Before (JavaScript):** Any value can go anywhere. The bug only appears when the app runs.
```js
function calcBrainAge(scores) {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  // If scores is a string: "hello".reduce is not a function — crash at runtime
}
```

**After (TypeScript, from `utils/scoring.ts`):**
```ts
export function calcBrainAge(scores: number[]): number {
```
The `: number[]` after `scores` tells TypeScript: this parameter must be an array of numbers. The `: number` after `)` says: this function must return a number. If you call it with a string, TypeScript refuses to compile.

### Expo

Expo is a set of tools and libraries that sit on top of React Native to make mobile development easier. Without Expo, you would need to write Xcode and Android Studio configuration files, manage native build systems, and install native SDKs manually. Expo handles all of that.

**Why it was used:** The managed workflow (the mode this app uses) means you never touch native code. You write JavaScript/TypeScript, and Expo converts it to a real Android and iOS app. This is the right choice for a game that doesn't need unusual native capabilities.

**What it solves:** Without Expo, installing something like `expo-haptics` (phone vibration) would require editing `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`, and running `pod install` on iOS. Expo makes it a one-line install.

### Expo Router

Expo Router is a file-based navigation library. The route (URL/screen) is determined by the file's location in the `app/` folder — exactly like Next.js for web apps.

**Why it was used:** The alternative, React Navigation, requires you to manually define every route as a JavaScript object in a navigator config. With Expo Router, creating a file at `app/game/mental-math.tsx` automatically creates the route `/game/mental-math`. This saves significant boilerplate and makes the routing immediately obvious from the folder structure.

**Before (React Navigation):**
```js
const Stack = createStackNavigator()
function App() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MentalMath" component={MentalMathScreen} />
      {/* ... every screen manually listed */}
    </Stack.Navigator>
  )
}
```

**After (Expo Router):** Create `app/game/mental-math.tsx`. That's it. The route `/game/mental-math` exists automatically.

### React Native Reanimated 3

Reanimated 3 is an animation library that runs animations on the device's UI thread (the thread that draws the screen) rather than the JavaScript thread (where your app logic runs).

**Why this matters:** The JavaScript thread in React Native is constantly busy — it's handling state updates, network calls, user input, and your game logic. If you try to animate something from the JavaScript thread using the built-in `Animated` API, every animation frame must travel from the JS thread to the native UI thread. Under heavy load, the JS thread gets backed up and animations stutter. Reanimated 3 solves this by writing animation logic in a special syntax that gets compiled and sent to the UI thread, where it runs independently at 60fps even if the JS thread is frozen.

**Before (built-in Animated — don't use this):**
```js
const value = new Animated.Value(0)
Animated.timing(value, { toValue: 1, duration: 300, useNativeDriver: true }).start()
```

**After (Reanimated 3):**
```js
const value = useSharedValue(0)
value.value = withTiming(1, { duration: 300 })
```
The second version runs entirely on the UI thread.

### Zustand

Zustand is a global state management library. It lets any component in the app read and update shared state without passing props through every level of the component tree.

**Why it was used over Redux:** Redux — the most famous alternative — requires you to write action creators, a reducer function, a store configuration, and a Provider wrapper component. Zustand achieves the same result with a single `create()` call and no providers. For a game with moderate complexity (not a huge enterprise app), Redux's ceremony adds no value. The Zustand store in this app is about 80 lines. An equivalent Redux store would be roughly 200 lines across 4 files.

**Why it was used over React Context:** React Context re-renders every component that reads from it whenever anything in the context changes. Zustand uses selective subscriptions — a component that only reads `currentPlayer` won't re-render when `scores` changes. For a game with frequent state updates, this matters.

### expo-sqlite

expo-sqlite gives the app access to SQLite, a full relational database that lives as a single file on the device's local storage. The data persists after the app closes — unlike JavaScript variables or React state, which are lost when the app is killed.

**Why it was used:** The app needs to store session history and player profiles permanently. Without a database, closing the app would wipe all history. A server database was not needed because all data is private to the device — there is no multiplayer, no leaderboards, no accounts.

### Drizzle ORM

Drizzle ORM is a library that lets you interact with SQLite using TypeScript instead of raw SQL strings. It also generates TypeScript types for your database rows automatically.

**Why it was used:** Writing raw SQL strings is error-prone and gives you no type safety. With Drizzle, the TypeScript compiler knows the shape of every database row. If the `players` table has a column called `avatar_color`, TypeScript will autocomplete it and flag a typo.

**Before (raw SQL):**
```js
const result = db.getAllSync('SELECT * FROM players WHERE name = ?', [name])
// result is typed as `any` — no IDE help, no error catching
```

**After (Drizzle, from `db/queries.ts`):**
```ts
const existing = await db.select().from(players).where(eq(players.name, name)).limit(1)
// existing is typed as Player[] — full autocomplete and type checking
```

### React Native Skia (`@shopify/react-native-skia`)

Skia is a 2D graphics engine (the same engine that powers Chrome and Android) exposed as React Native components. It draws to a canvas — a single low-level drawing surface — rather than composing React Native views.

**Why it was used (Falling Blocks game):** The Falling Blocks game requires dozens of coloured rectangles to animate simultaneously at different speeds and positions. Using regular React Native Views for this would create 60 style updates per second per block in the React reconciler, causing severe performance drops. Skia bypasses the React system for drawing and renders everything in a single GPU-accelerated pass.

### react-three-fiber + three.js

Three.js is the most popular 3D graphics library for JavaScript. react-three-fiber is a React wrapper that lets you write Three.js scenes as JSX. expo-gl provides the WebGL context that Three.js needs on a native device.

**Why it was used (Exploding Cube game):** The Exploding Cube game involves 27 3D cubelets. Describing their positions, rotations, and materials as JSX components is far more maintainable than imperative Three.js calls.

### Lottie React Native

Lottie plays After Effects animation files (`.json` format) in a React Native app. It gives you production-quality, designer-created animations at very small file sizes.

**Why it was used:** For celebratory animations on the results screen and game-complete moments, Lottie provides smooth, polished animations that would take weeks to hand-code in Reanimated.

### Moti

Moti is a simpler animation library built on top of Reanimated 3. Where Reanimated gives you full control (and corresponding complexity), Moti gives you a declarative API for common patterns like fade-in, slide-in, and spring animations.

**Why it was used:** The Handoff screen and the score reveal rows use straightforward mount animations. Moti's `MotiView` requires one prop (`from` and `animate`) instead of writing shared values and animated styles manually. It is used where simplicity matters more than fine-grained control.

### NativeWind + Tailwind CSS

NativeWind brings Tailwind CSS utility classes to React Native. Instead of writing `style={{ paddingHorizontal: 16, backgroundColor: '#0f0f1a' }}`, you can write `className="px-4 bg-[#0f0f1a]"`.

**Why it was used:** Tailwind's design system enforces consistent spacing and makes styles readable inline. It was installed for Phase 1 and is available for use in subsequent phases.

### expo-haptics

expo-haptics triggers the device's vibration motor with precise haptic feedback patterns — the same subtle "ticks" you feel when scrolling in the iOS Settings app.

**Why it was used:** In a fast-paced game, visual feedback alone is not enough. A light tap for correct answers and a stronger buzz for wrong answers provide immediate physical confirmation of the player's action, making the game feel more polished and reactive.

The key takeaway: every library in this stack was chosen to solve a specific problem. None of them are included "because everyone uses it." TypeScript catches bugs, Expo removes native boilerplate, Reanimated puts animations on the UI thread, Zustand manages cross-component state without Redux's ceremony, Drizzle types the database, Skia handles canvas-level graphics, and haptics add physical feedback.

---

## 3. Project Folder Structure

Understanding why the code is split into these specific folders is as important as understanding what each file does. Bad organisation forces you to put the same logic in multiple places or pass data through ten layers of components.

### `app/` — Screens (Expo Router)

Every file in `app/` is a route. Expo Router reads this folder and creates the navigation structure automatically. The naming rules are:
- `_layout.tsx` files define wrappers around a group of routes (like a Stack navigator)
- Files with regular names become routes: `index.tsx` → `/`, `setup.tsx` → `/setup`
- Folders create nested routes: `app/game/mental-math.tsx` → `/game/mental-math`

**Why screens are separate from components:** Screen files (`app/index.tsx`, `app/setup.tsx`, etc.) are responsible for navigation logic — reading from the store, deciding where to go next, calling database functions. Component files in `components/` are responsible for display and interaction. This separation means you can reuse a component (like `HandoffScreen`) in different screen contexts without duplicating navigation logic.

### `app/game/` — Game Screens

Each game has its own screen file. These files are deliberately thin — in the final implementation, they contain only the countdown overlay check and the `onGameComplete` callback that saves the score and navigates away. The actual game logic lives in `components/games/`.

**Why this separation exists:** If the Mental Math game logic lived directly in `app/game/mental-math.tsx`, you could never reuse it or test it independently. By putting game logic in a component (`components/games/MentalMath/index.tsx`) that receives `onGameComplete` as a prop, the game component doesn't need to know anything about navigation, stores, or database calls. It just calls a function when it's done. This is the single-responsibility principle.

### `components/ui/` — Shared UI Components

These are building blocks used by multiple screens and games: `Button`, `TimerBar`, `ProgressBar`, `CountdownOverlay`, `HandoffScreen`, `ScoreBadge`, `ScoreReveal`. They are generic enough to be used anywhere.

**Why separate from `components/games/`:** UI components have no game logic — they display things and call callbacks. If `Button.tsx` were inside `MentalMath/`, it would be impossible to use the same button in the Grid Memory game without duplicating it.

### `components/games/[GameName]/` — Game Logic + UI

Each game gets its own folder with three files:
- `index.tsx` — the visual component, handles layout and calls the hook
- `use[GameName].ts` — the game logic hook, all state and calculations
- (some games have a third file for a complex sub-component like `BlockCanvas.tsx`)

**Why game logic lives in a hook instead of the component:** A React component function runs on every re-render. If your game logic (question generation, scoring formulas, round advancement) lives directly in the component, it becomes tangled with rendering concerns. By extracting it into a custom hook, you separate "what the game does" from "how the game looks." You can read the hook and understand the complete game loop without being distracted by styles and layout.

### `db/` — Database Layer

Three files, each with a single clear responsibility:

- **`schema.ts`** — Defines the shape of the database. Think of it as the blueprint. It never talks to the actual database.
- **`client.ts`** — Opens the database connection and creates the tables. One file, one connection.
- **`queries.ts`** — Every function that reads or writes data. Business logic lives in `store/` or `components/`; data access lives here.

**Why separate these three?** If `schema.ts` and `client.ts` were one file, every time you imported the schema types you would also execute the database-opening code. If `queries.ts` and `client.ts` were one file, it would grow to hundreds of lines and become impossible to navigate.

### `store/` — Global State

Two stores, each with a distinct domain:

- **`sessionStore.ts`** — Everything about the current game session: who the players are, which game is being played, all the scores. Lives for the duration of one session.
- **`gameStore.ts`** — Everything about the current round within a single game: round number, current score, feedback state. Resets between games.

**Why two stores instead of one?** If all state were in one store, a `reset()` call for a new game round would risk clearing session data. Keeping them separate means `gameStore.reset()` is safe to call without any risk of losing player names or session IDs.

### `constants/` — Shared Values

- **`colors.ts`** — Every colour used in the app. By importing `colors.accent` instead of hardcoding `'#00e5ff'`, changing the app's accent colour is a one-line edit. Without this file, you'd search-and-replace across 30 files and inevitably miss some.
- **`games.ts`** — The master list of all 7 games with their metadata. The `GAMES` array is the single source of truth for game IDs, labels, round counts, and time limits. The navigation flow and the results screen both read from this same array.

### `utils/` — Pure Functions

- **`random.ts`** — `randInt`, `randFrom`, `shuffle`. Pure functions with no side effects. Every game uses randomness; centralising these functions means they are tested once and trusted everywhere.
- **`scoring.ts`** — `normaliseScore`, `calcBrainAge`, `timeBonus`. These are the core game formulas. Keeping them in one file means the scoring algorithm is auditable in one place — if the brain age formula needs adjusting, there's one file to change.

### `hooks/` — Shared Custom Hooks

- **`useCountdown.ts`** — Used by the CountdownOverlay component (3→2→1→GO!)
- **`useGameTimer.ts`** — Used by games to track total elapsed time for accuracy reporting

These hooks are separate because multiple unrelated components use them.

The key takeaway: the folder structure enforces the separation of concerns. Screens handle navigation. Components handle display. Hooks handle logic. DB files handle persistence. Utils handle pure calculations. When you need to find something, you know exactly which folder to look in.

---

## 4. TypeScript — Every Pattern Used

Coming from JavaScript, TypeScript's syntax can look strange at first. This section explains every TypeScript pattern found in this codebase, character by character.

### Type Annotations on Variables

In JavaScript, you just write `let count = 0`. TypeScript lets you be explicit:

```ts
// From hooks/useGameTimer.ts
const [timeMs, setTimeMs] = useState(0)
```

Here TypeScript *infers* the type — because the initial value is `0` (a number), TypeScript automatically knows `timeMs` is a `number`. You don't need to write it. But you can be explicit when it helps clarity:

```ts
const [ready, setReady] = useState(false)  // TypeScript infers: boolean
```

The colon syntax `: type` is how you annotate explicitly:
```ts
let score: number = 0
let name: string = 'Alice'
let active: boolean = true
```

### Interface Definitions

An `interface` describes the shape of an object — what keys it has and what type each value is. Think of it as a contract.

From `store/sessionStore.ts`:
```ts
interface Player {
  id: number
  name: string
  color: string
}
```

This says: a `Player` object must have exactly these three fields with these exact types. If you try to do `player.avatar` TypeScript will tell you that property doesn't exist. If you try to pass a `Player` where a `number` is expected, TypeScript flags it immediately.

Without TypeScript, you'd discover these bugs when the app crashes. With TypeScript, you discover them before you even save the file.

### Union Types

A union type means "this value can be one of these specific options." The pipe character `|` means "or."

From `store/sessionStore.ts`:
```ts
currentPlayer: 1 | 2
```

This says `currentPlayer` can only be the number `1` or the number `2`. Not `3`, not `0`, not `"one"`. If you try to set it to `3`, TypeScript refuses.

Another example from the same file:
```ts
phase: 'idle' | 'playing' | 'handoff' | 'results'
```

This is called a **string literal union type**. The value must be exactly one of those four strings. This replaces the common pattern of using magic numbers like `0`, `1`, `2`, `3` to represent phases — with union types the values are self-documenting.

From `store/gameStore.ts`:
```ts
feedback: 'correct' | 'wrong' | null
```

The `null` here is part of the union — the feedback can be one of those two strings, or it can be nothing at all (`null`).

### Optional Fields

A question mark after a field name means that field might not be present at all.

From `store/sessionStore.ts`:
```ts
scores: Record<number, { player1?: ScoreEntry; player2?: ScoreEntry }>
```

The `?` after `player1` and `player2` means: a scores entry might have a `player1` score, or it might not (if Player 1 hasn't played this game yet). Without `?`, TypeScript would require both to always be present, which is impossible before anyone has played.

Compare:
```ts
{ player1: ScoreEntry }   // player1 MUST be there
{ player1?: ScoreEntry }  // player1 MAY be there
```

### Nullable Types

The `| null` pattern means a value can be the specified type OR it can be `null` (absent).

From `store/sessionStore.ts`:
```ts
player1: Player | null
sessionId: number | null
```

When the app first opens, there is no player and no session — so these are `null`. After setup begins, they become a real `Player` and a real `number`. TypeScript forces you to check for `null` before using the value, preventing "Cannot read property 'name' of null" crashes.

### Generic Types

A generic type is a type that takes a "type parameter" — like a function, but for types. The angle brackets `<T>` are how you pass the type parameter. The `T` is just a conventional placeholder name; it could be anything.

From `utils/random.ts`:
```ts
export const randFrom = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]
```

Breaking this down character by character:
- `<T>` — "I'm defining a type parameter called T. I don't know yet what type the array will contain."
- `(arr: T[])` — "The parameter `arr` is an array of whatever T turns out to be."
- `: T` — "This function returns a value of type T."

So if you call `randFrom(['red', 'blue', 'green'])`, TypeScript sees that `T = string` and knows the return value is a `string`. If you call `randFrom([1, 2, 3])`, TypeScript knows `T = number` and the return is a `number`. One function, works with any type, fully type-safe.

The same pattern appears in Zustand:
```ts
export const useSessionStore = create<SessionStore>((set, get) => ({...}))
```

Here `create<SessionStore>` is saying: "create a Zustand store whose shape matches the `SessionStore` interface." The `<SessionStore>` is the type parameter being passed to Zustand's `create` function.

And in React's `useState`:
```ts
const [ready, setReady] = useState<boolean>(false)
```

`useState<boolean>` tells TypeScript that this state variable is a boolean. (In this particular case TypeScript could infer it from `false`, but explicit generics are useful when the initial state is `null`.)

### The `useRef` Typing Pattern

From `hooks/useGameTimer.ts`:
```ts
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
```

This is a dense line. Let's unpack it:

- `useRef<...>(null)` — creates a ref with initial value `null`
- `ReturnType<typeof setInterval>` — "the type that `setInterval` returns." On the browser this is `number`; on Node.js it's a `NodeJS.Timeout` object. Using `ReturnType<typeof setInterval>` instead of hardcoding `number` or `NodeJS.Timeout` makes the code work in both environments.
- `| null` — the ref starts as `null` (no interval running yet), and becomes a timer ID when an interval starts.

### The Non-Null Assertion Operator `!`

From `db/queries.ts` (used in game screens):
```ts
await saveGameScore(sessionId!, playerId, ...)
```

The `!` after `sessionId` is the non-null assertion operator. It tells TypeScript: "I know this value is not null right now, trust me." `sessionId` is typed as `number | null`, but by the time we're in a game screen, the session has definitely been created, so `sessionId` is guaranteed to be a number.

Use this sparingly. It bypasses TypeScript's safety net. The better approach is to check first (`if (sessionId === null) return`), but `!` is acceptable when you are absolutely certain.

### The `as const` Assertion

From `constants/games.ts`:
```ts
export const GAMES = [
  { id: 'mental-math', label: 'Mental Math', ... },
  ...
] as const
```

Without `as const`, TypeScript would infer the type of `id` as `string` — any string. With `as const`, TypeScript infers it as the literal string `'mental-math'`. This matters for the next line:

```ts
export type GameId = typeof GAMES[number]['id']
```

- `typeof GAMES` — "the type of the GAMES constant"
- `[number]` — "index it with any number" (i.e., any element of the array)
- `['id']` — "get the 'id' field"

The resulting type `GameId` is `'mental-math' | 'grid-memory' | 'stroop-test' | ...` — a union of the exact string literals. TypeScript can then check that you never use an invalid game ID anywhere in the app.

### `InferSelectModel` and `InferInsertModel`

From `db/schema.ts`:
```ts
export type Player = InferSelectModel<typeof players>
```

`InferSelectModel` is a utility type from Drizzle ORM. It looks at the `players` table definition (the `typeof players` part) and generates a TypeScript type that matches the shape of a row you'd get back from a `SELECT` query. This means you never have to manually type `{ id: number; name: string; avatar_color: string; created_at: string }` — Drizzle derives it automatically from the schema. If you add a column to the schema, the type updates automatically.

### The `Record<K, V>` Type

From `store/sessionStore.ts`:
```ts
scores: Record<number, { player1?: ScoreEntry; player2?: ScoreEntry }>
```

`Record<K, V>` means "an object where every key is of type K and every value is of type V." This is equivalent to `{ [key: number]: { player1?: ScoreEntry; player2?: ScoreEntry } }` but cleaner to read. The `scores` object maps game index numbers (0–6) to the score entries for each player in that game.

The key takeaway from this section: TypeScript's syntax additions to JavaScript all serve one purpose — to describe the shape of data so precisely that entire classes of bugs become impossible to write. Every `|`, `?`, `<T>`, and `: type` annotation is the developer communicating their intentions to the TypeScript compiler, which then enforces those intentions automatically.

---

## 5. React and React Native Patterns

### useState — When and Why

`useState` creates a value that, when changed, causes the component to re-render and update what the user sees. Use it for values that are displayed on screen and change over time.

From `app/_layout.tsx`:
```ts
const [ready, setReady] = useState(false)
```

This one boolean controls whether the loading spinner or the actual app stack is shown. When `setReady(true)` is called after the database initialises, the component re-renders and the spinner is replaced by the navigation stack.

**Common mistake:** Storing derived values in state. If you have `firstName` and `lastName` in state, don't also store `fullName` in state — compute it from the other two. Storing derived state leads to bugs where the values get out of sync.

### useEffect — The Dependency Array Explained

`useEffect` runs a side effect — code that does something outside of rendering (network calls, timers, subscriptions, database operations). The second argument is the dependency array.

```ts
useEffect(() => {
  // This code runs...
}, [dependency1, dependency2])
```

- `[]` (empty array) — runs once, when the component first mounts. Never runs again.
- `[someValue]` — runs once on mount, then again every time `someValue` changes.
- No array at all — runs after every single render (almost always a bug).

From `app/_layout.tsx`:
```ts
useEffect(() => {
  initDB()
    .then(() => setReady(true))
    .catch((err) => {
      console.error('DB init failed', err)
      setReady(true)
    })
}, [])
```

The empty `[]` means: run `initDB()` once when the root layout mounts. This is correct because you only need to initialise the database once per app launch.

**The cleanup function:** A `useEffect` can optionally return a function that runs when the component unmounts (is removed from the screen) or before the effect runs again. This is critical for preventing memory leaks.

From `hooks/useCountdown.ts`:
```ts
useEffect(() => {
  setCount(startFrom)
  const interval = setInterval(() => { ... }, 1000)
  return () => clearInterval(interval)  // cleanup: stop the timer
}, [startFrom])
```

If you didn't return `clearInterval(interval)`, the interval would keep running even after the component unmounts — ticking away in memory, potentially calling `setState` on a component that no longer exists, causing a React warning and potential memory leak.

### useRef — Every Use Case

`useRef` creates a container that holds a value that does NOT cause re-renders when it changes. It is the right tool when you need to "remember" something between renders without triggering a visual update.

**Use case 1: Storing timer IDs.** From `hooks/useGameTimer.ts`:
```ts
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
```
You need to keep the interval ID so you can call `clearInterval` later. Storing it in `useState` would cause a re-render every time the timer starts or stops — unnecessary. `useRef` is perfect.

**Use case 2: Storing the latest version of a callback.** From `hooks/useCountdown.ts`:
```ts
const onCompleteRef = useRef(onComplete)
onCompleteRef.current = onComplete
```
This is a subtle but important pattern. If `onComplete` were used directly inside the `setInterval` callback, it would be captured by the closure at the time the interval was created. If the parent component passes a new `onComplete` function later, the interval would still call the old one. By storing `onComplete` in a ref and updating `onCompleteRef.current` on every render, the interval always calls the most current version of the callback.

### Custom Hooks — How to Read Them

A custom hook is a function whose name starts with `use` and that can call other hooks inside it. The purpose is to extract stateful logic so it can be shared and tested independently from UI.

`useGameTimer` from `hooks/useGameTimer.ts` is a perfect example. It returns an object:
```ts
return { timeMs, start, stop, reset }
```

Any component can call `const { timeMs, start, stop } = useGameTimer()` and get a fully functional, cleanly encapsulated timer. The component doesn't need to know about `setInterval`, `performance.now()`, or the accumulation logic. It just calls `start()` when the game begins and reads `timeMs` to display elapsed time.

### Component Composition — The onGameComplete Pattern

Every game component receives a single prop: `onGameComplete`. Here is the pattern:

```ts
// The game component (Mental Math, Grid Memory, etc.)
interface Props {
  onGameComplete: (score: number, timeMs: number, accuracy: number) => void
}

export default function MentalMath({ onGameComplete }: Props) {
  // ... game logic ...
  // When done:
  onGameComplete(finalScore, totalTimeMs, accuracy)
}
```

The game component has no idea what happens after it calls `onGameComplete`. It doesn't import the router, doesn't know about Zustand, doesn't touch the database. It just calculates numbers and calls a function.

The screen file (`app/game/mental-math.tsx`) provides the implementation of `onGameComplete`:
```ts
const onGameComplete = async (score, timeMs, accuracy) => {
  await saveGameScore(sessionId!, playerId, gameInfo.id, score, timeMs, accuracy)
  submitScore(currentPlayer, currentGameIndex, { score, timeMs, accuracy })
  router.push('/handoff')
}
```

This is the inversion of control principle. The game component gives control back to the caller, who decides what to do with the result. This makes the game component reusable — you could put it in a practice mode screen that doesn't save to the database, and the game component wouldn't need any changes.

### Context vs Zustand

React Context is a built-in React mechanism for sharing data between components. Zustand is a third-party library for the same purpose. The key difference is performance.

When a Context value changes, every component that calls `useContext()` for that context re-renders, even if it only cares about one small part of the context. Zustand uses a subscription model: each component subscribes to only the specific parts of state it reads. A game component that reads `currentPlayer` will not re-render when `scores` changes.

For a game with frequent score updates and state changes, avoiding unnecessary re-renders matters. Zustand was the right choice.

The key takeaway: React patterns are about managing complexity over time. `useState` manages what the user sees. `useEffect` manages side effects like timers and database calls. `useRef` manages values that don't affect rendering. Custom hooks separate logic from display. The `onGameComplete` prop pattern keeps game components blissfully ignorant of navigation and persistence.

---

## 6. Every Mini-Game — Deep Technical Explanation

Since the game components are stubs in Phase 1 (the foundation phase this codebase represents), this section explains the architecture and algorithms they will implement in Phase 2 onward. The data structures and formulas are defined in the custom hooks.

### Game 1 — Mental Math

**Game loop:** The hook generates an arithmetic question and starts a 6-second timer. The player types an answer and taps Submit (or the timer runs out). The hook checks the answer, sets feedback ('correct' or 'wrong'), waits 800ms, then generates the next question. After 8 questions, sets `isComplete = true`.

**State variables:**
- `question: string` — the display string, e.g., `"23 × 7 = ?"`
- `correctAnswer: number` — what the answer actually is
- `round: number` (1–8) — which question we're on
- `score: number` — accumulated raw points
- `feedback: 'correct' | 'wrong' | null` — shown for 800ms after each answer
- `timeLeft: number` — seconds remaining for this question
- `isComplete: boolean` — true after round 8 finishes

**Scoring algorithm:** For each correct answer:
```
roundScore = Math.round((timeLeft / 6) * 80) + 20
```
Worked example: Player answers in 2 seconds (4 seconds left out of 6).
```
roundScore = Math.round((4 / 6) * 80) + 20
           = Math.round(53.33) + 20
           = 53 + 20
           = 73 points
```
If the player answers instantly (6 seconds left): `Math.round((6/6) * 80) + 20 = 100`.
If time runs out (0 seconds left): `Math.round((0/6) * 80) + 20 = 20`. Actually the formula gives 20 for an answer at the last moment, and 0 if time expired (the `timerExpired` path sets score to 0).

Final score: `normaliseScore(totalRawPoints, 8 * 100)` — divides total by the maximum possible (800) and scales to 0–100.

**Accuracy:** `correctCount / 8` — a value from 0.0 to 1.0.

### Game 2 — Grid Memory

**Game loop:** A 4×4 grid of 16 coloured circles is shown. Some circles (the "lit" ones) glow with a white border. After 1800ms, all circles turn grey. The player must tap the number button matching how many circles were lit.

**Lit count per round:** `[2, 3, 4, 5, 6, 7]` — increases by one each round to make the game harder.

**State variables:**
- `grid: GridCell[]` — 16 cells, each with a `color`, `isLit` flag, and `isNeutral` flag
- `phase: 'showing' | 'recall'` — controls whether cells show colour or grey
- `round: number` (1–6)
- `litCount: number` — how many cells were lit this round
- `feedback: 'correct' | 'wrong' | null`

**Scoring:** `correct ? Math.round(100/6) : 0` — about 17 points per correct round, 100 maximum.

### Game 3 — Stroop Test

**The Stroop effect** is a well-known cognitive phenomenon: it takes longer to name the ink colour of a word when the word spells a different colour. For example, the word "RED" written in blue ink is slower to process than the word "TABLE" written in blue ink, because the brain's reading system interferes with the colour-naming system.

**Game loop:** A colour word is displayed in a different ink colour. Four buttons show colour names. The player must tap the ink colour, not the word. 10 rounds, 4 seconds each.

**State variables:**
- `word: string` — the colour name as text (e.g., `"RED"`)
- `inkColor: string` — the hex colour the word is displayed in (never matches the word)
- `correctAnswer: string` — the name of the ink colour
- `options: string[]` — 4 colour names including the correct answer, shuffled
- `timeLeft: number` — seconds remaining

**Scoring:** `correct ? Math.round((timeLeft / 4) * 60) + 40 : 0`
- Answering instantly: `Math.round((4/4) * 60) + 40 = 100`
- Answering with 1 second left: `Math.round((1/4) * 60) + 40 = 55`
- Wrong answer: `0`

### Game 4 — Number Sequence

**Game loop:** Digits flash on screen one at a time (600ms visible, 200ms gap). After the last digit, there's a 400ms pause, then the player must reproduce the sequence by tapping a number pad. The sequence auto-checks when the last slot is filled.

**Sequence length per round:** `round + 2` — so round 1 has 3 digits, round 6 has 8 digits.

**State variables:**
- `sequence: number[]` — the secret sequence (e.g., `[7, 3, 9, 1]`)
- `currentDisplayDigit: number | null` — the digit currently flashing (null during gaps)
- `phase: 'showing' | 'input'`
- `enteredDigits: number[]` — what the player has tapped so far
- `slots: (number | null)[]` — visual representation of filled/empty slots

**Scoring:** `Math.round(100/6)` ≈ 17 per correct round.

### Game 5 — Falling Blocks

**Game loop:** Coloured rectangular blocks fall from the top of the screen at different speeds. After all blocks have fallen and faded out, 2–3 questions appear asking about what the player observed.

**Why this tests memory:** The game trains "working memory under distraction" — you must observe passively (you can't interact with the blocks) while keeping a mental count of colours.

**Scoring:** `Math.round(100 / (5 * totalQuestionsInRound))` per correct answer. Since each round has 2–3 questions and there are 5 rounds, the maximum total score is 100.

### Game 6 — Exploding Cube

**Game loop:** 27 cubelets arranged in a 3×3×3 grid are shown. Some cubelets are highlighted in a special colour. After a 2-second memorisation period, all cubelets scatter to random positions and the highlighted ones turn white (so all cubelets look identical). The player must tap exactly the cubelets that were highlighted.

**Target count:** 2 cubelets for rounds 1–2, 3 cubelets for rounds 3–4 (harder as the game progresses).

**Scoring:** Getting all targets correct (and no wrong ones selected) = `Math.round(100/4)` = 25 points.

### Game 7 — Flag Direction

**Game loop:** A stick figure raises a flag in a sequence of 8 compass directions (N, NE, E, SE, S, SW, W, NW). Each direction is shown for 900ms with a 200ms gap. After the sequence, the player uses a compass-rose pad to reproduce the sequence. Auto-checks when all slots are filled.

**Sequence length per round:** `round + 1` — so 2 directions in round 1, 6 in round 5.

**Scoring:** `Math.round(100/5)` = 20 per correct round.

The key takeaway: every game's scoring formula rewards speed (where timed) and accuracy. The `normaliseScore` utility converts raw points to a 0–100 scale so all games contribute equally to the brain age calculation regardless of their individual point scales.

---

## 7. Navigation and Routing

### How File-Based Routing Works

Expo Router reads the `app/` directory and creates routes automatically. The mapping is:

```
app/index.tsx              →  /          (Home screen)
app/setup.tsx              →  /setup
app/handoff.tsx            →  /handoff
app/results.tsx            →  /results
app/history.tsx            →  /history
app/game/mental-math.tsx   →  /game/mental-math
app/game/grid-memory.tsx   →  /game/grid-memory
(... etc.)
```

You navigate programmatically using `router.push('/handoff')` from the `expo-router` package.

### The Full Navigation Flow

```
/  (Home)
│
├── [New Game] ──→  /setup
│                     │
│                     └── [Start Battle!] ──→  /game/mental-math
│                                                      │
│                         ┌────────────────────────────┘
│                         │  CountdownOverlay (3→2→1→GO!)
│                         │  Player 1 plays game
│                         │  onGameComplete()
│                         │
│                         └──→  /handoff  (Pass phone to Player 2)
│                                   │
│                                   └── [I'm Ready] ──→  /game/mental-math
│                                                               │
│                                       ┌───────────────────────┘
│                                       │  CountdownOverlay
│                                       │  Player 2 plays game
│                                       │  onGameComplete()
│                                       │
│                            (if not last game) ──→  /handoff
│                            (if last game)     ──→  /results
│
└── [History] ──→  /history
```

This 14-step flow (2 players × 7 games) repeats the same pattern: play → handoff → play → (next game or results).

### What `_layout.tsx` Files Do

A `_layout.tsx` file wraps all routes at the same level and below. It's where you configure the navigator.

`app/_layout.tsx` (root layout) wraps the entire app:
- Initialises the database before rendering anything
- Shows a loading spinner during DB init
- Renders a `<Stack>` navigator once ready

`app/game/_layout.tsx` wraps all game routes:
- In the final implementation, it checks `sessionStore.sessionId` — if null (session expired), it shows an alert and redirects to Home
- This is a "guard" — it prevents navigating to a game screen with no session

### How the Store Drives Navigation

The store doesn't navigate directly. Instead, screen components read from the store and navigate based on what they find. The pattern in `app/handoff.tsx`:

```ts
// Read current state
const { currentPlayer, currentGameIndex } = useSessionStore()

// User taps "I'm Ready"
const onReady = () => {
  sessionStore.advanceAfterHandoff()  // updates the store
  const nextGameId = GAMES[currentGameIndex].id
  router.push(`/game/${nextGameId}`)  // then navigate
}
```

The store is the source of truth for which game comes next. The navigation just expresses that truth as a screen change.

The key takeaway: Expo Router removes the navigation configuration boilerplate. `_layout.tsx` files are your place for guards, nested navigators, and shared wrappers. The store drives navigation logic; `router.push()` executes it.

---

## 8. State Management Deep Dive

### The Shape of sessionStore

```
sessionStore
├── player1: Player | null
│   ├── id: number        (DB primary key)
│   ├── name: string      (e.g., "Alice")
│   └── color: string     (hex, e.g., "#00e5ff")
│
├── player2: Player | null
│   └── (same shape as player1)
│
├── sessionId: number | null   (DB primary key of current session)
├── currentGameIndex: number   (0–6, which of the 7 games we're on)
├── currentPlayer: 1 | 2       (whose turn it is)
├── phase: 'idle' | 'playing' | 'handoff' | 'results'
│
└── scores: Record<number, { player1?: ScoreEntry; player2?: ScoreEntry }>
    ├── 0: { player1: { score, timeMs, accuracy }, player2: { score, timeMs, accuracy } }
    ├── 1: { player1: {...}, player2: {...} }
    ├── ...
    └── 6: { player1: {...}, player2: {...} }
```

### The Shape of gameStore

```
gameStore
├── round: number        (1-based, current round within the active game)
├── totalRounds: number  (set by each game component on mount)
├── score: number        (accumulated points in this game)
└── feedback: 'correct' | 'wrong' | null   (shown for 800ms after each answer)
```

### State Transitions Through a Complete Session

Here is the exact sequence of state changes from "Start Battle!" to the results screen for a 2-game example:

**1. Setup — "Start Battle!" pressed:**
```
sessionStore.startSession(p1, p2, 123)
→ player1 = { id: 1, name: 'Alice', color: '#00e5ff' }
→ player2 = { id: 2, name: 'Bob',   color: '#ff2d6b' }
→ sessionId = 123
→ currentGameIndex = 0
→ currentPlayer = 1
→ phase = 'playing'
→ scores = {}
```

**2. Mental Math — Player 1 finishes:**
```
sessionStore.submitScore(1, 0, { score: 82, timeMs: 45000, accuracy: 0.875 })
→ scores = { 0: { player1: { score: 82, timeMs: 45000, accuracy: 0.875 } } }
→ phase = 'handoff'
→ currentPlayer = 2
```

**3. Handoff — Player 2 taps "I'm Ready":**
```
sessionStore.advanceAfterHandoff()
→ phase = 'playing'
(currentPlayer stays 2, currentGameIndex stays 0)
```

**4. Mental Math — Player 2 finishes:**
```
sessionStore.submitScore(2, 0, { score: 71, timeMs: 48000, accuracy: 0.75 })
→ scores = { 0: { player1: {...}, player2: { score: 71, timeMs: 48000, accuracy: 0.75 } } }
→ currentGameIndex = 1      (advance to game 2)
→ currentPlayer = 1         (back to player 1)
→ phase = 'handoff'
```

**5. ...14 total turns later, after Game 7 Player 2 finishes:**
```
submitScore(2, 6, ...)
→ isLastGame = (gameIndex >= 6) = true
→ phase = 'results'
```

**6. Results screen — getWinner() is called:**
```
p1Scores = [82, 75, 90, 60, 80, 70, 85]   // 7 scores
p2Scores = [71, 80, 85, 75, 70, 85, 90]   // 7 scores
p1Total = 542
p2Total = 556
→ winner = 2  (Bob wins)
```

### How Zustand's `set` and `get` Work

Every function in a Zustand store has access to two arguments: `set` and `get`.

`set(newState)` merges `newState` into the current store state. It is shallow — only the keys you specify are updated, the rest are left alone. This is how the `submitScore` function works:

```ts
submitScore: (player, gameIndex, entry) => {
  const state = get()  // get the CURRENT full state
  const gameScores = state.scores[gameIndex] ?? {}  // get existing scores for this game

  set({
    scores: { ...state.scores, [gameIndex]: { ...gameScores, player1: entry } },
    phase: 'handoff',
    currentPlayer: 2,
  })
  // Only 'scores', 'phase', and 'currentPlayer' change.
  // 'player1', 'player2', 'sessionId' etc. are untouched.
}
```

`get()` returns the current state at the moment it is called. This is needed inside action functions because the function closure captures the initial state — `get()` gives you the live current state.

The key takeaway: `sessionStore` tracks the lifecycle of an entire two-player session. `gameStore` tracks the lifecycle of a single game. The two stores don't know about each other — game screens coordinate between them by calling both when needed.

---

## 9. Database Layer

### How SQLite Works on a Mobile Device

SQLite is a file-based relational database. On Android, the database file `brain-battle.db` lives in the app's private data directory, roughly: `/data/data/com.brainbattle.app/databases/brain-battle.db`. On iOS it is in the app's sandboxed `Documents` directory. This file is:
- Persistent across app restarts
- Deleted only when the app is uninstalled
- Private — other apps cannot access it
- A standard SQLite file — it can be opened with any SQLite tool for debugging

### How Drizzle Wraps SQLite

`db/client.ts` opens the database:
```ts
const sqliteDb = SQLite.openDatabaseSync('brain-battle.db')
export const db = drizzle(sqliteDb)
```

The `sqliteDb` object is the raw expo-sqlite connection. Passing it to `drizzle()` gives us a Drizzle instance that can translate TypeScript method chains into SQL.

### Raw SQL Equivalents of Every Drizzle Query

**`createOrGetPlayer`** — find an existing player or create a new one:
```sql
-- Drizzle: db.select().from(players).where(eq(players.name, name)).limit(1)
SELECT * FROM players WHERE name = 'Alice' LIMIT 1;

-- Drizzle: db.insert(players).values({...}).returning()
INSERT INTO players (name, avatar_color, created_at)
VALUES ('Alice', '#00e5ff', '2026-03-26T10:00:00.000Z')
RETURNING *;
```

**`createSession`:**
```sql
INSERT INTO sessions (player1_id, player2_id, played_at)
VALUES (1, 2, '2026-03-26T10:00:00.000Z')
RETURNING *;
```

**`saveGameScore`:**
```sql
INSERT INTO game_scores (session_id, player_id, game_id, score, time_ms, accuracy, played_at)
VALUES (123, 1, 'mental-math', 82, 45000, 0.875, '2026-03-26T10:05:00.000Z');
```

**`finaliseSession`:**
```sql
UPDATE sessions SET winner_id = 2 WHERE id = 123;
```

**`getSessionHistory`:**
```sql
SELECT * FROM sessions ORDER BY played_at DESC LIMIT 20;
-- Then for each session:
SELECT * FROM players WHERE id = 1 LIMIT 1;  -- player1
SELECT * FROM players WHERE id = 2 LIMIT 1;  -- player2
SELECT brain_age FROM brain_age_log
  WHERE session_id = 123 AND player_id = 1 LIMIT 1;
SELECT brain_age FROM brain_age_log
  WHERE session_id = 123 AND player_id = 2 LIMIT 1;
```

### Table-by-Table Explanation

**`players`** — Stores every person who has ever played on this device. The `avatar_color` is the hex colour string assigned in the setup screen. `created_at` is stored as an ISO 8601 string (e.g., `"2026-03-26T10:00:00.000Z"`) because SQLite has no native date type — we store dates as text and sort them lexicographically (alphabetical order of ISO strings happens to be chronological order, which is why this works).

**`sessions`** — Each row represents one complete two-player game session. `player1_id` and `player2_id` are foreign keys pointing to the `players` table. `winner_id` starts as `NULL` (because we don't know the winner until all games are played) and is updated by `finaliseSession` after the results screen.

**`game_scores`** — Every individual game turn (14 per session) gets a row here. `game_id` is the string identifier like `'mental-math'`. `accuracy` is stored as `REAL` (a floating point number) because it can be a fraction like `0.875`.

**`brain_age_log`** — Stores the computed brain age and total score for each player in each session. This is redundant data (you could recompute brain age from `game_scores`) but storing it explicitly makes the history screen query simple: instead of recalculating brain ages for every session in the history, you just read the stored values.

### The Complete Data Flow for One Session

```
1. app/setup.tsx — "Start Battle!" pressed
   → createOrGetPlayer('Alice', '#00e5ff')   → writes to players table
   → createOrGetPlayer('Bob', '#ff2d6b')     → writes to players table
   → createSession(1, 2)                     → writes to sessions table (winner_id = NULL)
   → sessionStore.startSession(...)          → in-memory only

2. app/game/mental-math.tsx — onGameComplete called (14 times total)
   → saveGameScore(123, 1, 'mental-math', 82, 45000, 0.875)
   → saveGameScore(123, 2, 'mental-math', 71, 48000, 0.75)
   → saveGameScore(123, 1, 'grid-memory', ...)
   → ... (14 rows total in game_scores)

3. app/results.tsx — mounted
   → saveBrainAge(1, 123, 28, 542)    → writes to brain_age_log
   → saveBrainAge(2, 123, 30, 556)    → writes to brain_age_log
   → finaliseSession(123, 2)          → updates sessions.winner_id = 2
```

### Migrations

A migration is a script that modifies the database structure (adding tables, changing columns) in a way that can be run once on an existing database without destroying data. This project uses `CREATE TABLE IF NOT EXISTS` in `initDB()`, which is the simplest migration strategy — it creates tables that don't exist yet and leaves existing tables alone. This means new installs and updates both work without data loss. For more complex schema changes (renaming a column, adding a new column to an existing table), you would need proper migration scripts.

The key takeaway: the database layer has three responsibilities — define the schema (`schema.ts`), manage the connection (`client.ts`), and perform queries (`queries.ts`). Drizzle adds type safety to all queries. The data is stored permanently on the device in a standard SQLite file.

---

## 10. Animations — How Reanimated 3 Works

### The Core Concept: UI Thread vs JavaScript Thread

React Native runs your JavaScript in a background thread. The screen is drawn by the UI thread. Communication between them is asynchronous — they send messages to each other, which takes time. If you animate from the JavaScript thread, every frame update must be:

1. Calculated on the JS thread
2. Sent as a message to the UI thread
3. Applied to the view on the UI thread
4. Painted to the screen

If the JS thread is busy (running game logic, handling a state update), step 2 is delayed. The animation stutters. On fast devices this is barely noticeable. On mid-range Android devices, it causes visible lag.

Reanimated 3 solves this by sending the entire animation specification to the UI thread upfront. The UI thread then runs the animation independently, never needing to communicate with the JS thread again. The result is 60fps animations even when the JS thread is fully occupied.

### useSharedValue vs useState

```ts
// useState — lives on the JS thread, causes re-renders when changed
const [opacity, setOpacity] = useState(0)

// useSharedValue — lives on the UI thread, does NOT cause re-renders
const opacity = useSharedValue(0)
```

Use `useState` when a change should cause the component to re-render (show different text, switch phases, etc.).
Use `useSharedValue` when a change should only affect an animation property (position, scale, opacity, etc.).

Reading a shared value: `opacity.value`
Writing a shared value (instant): `opacity.value = 1`
Writing a shared value (animated): `opacity.value = withTiming(1, { duration: 300 })`

### useAnimatedStyle

`useAnimatedStyle` connects a shared value to a component's style. It creates a "live" style object that re-evaluates on the UI thread whenever the shared values it reads change.

```ts
const animStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }]
}))

// Used on an Animated component:
<Animated.View style={animStyle} />
```

The function passed to `useAnimatedStyle` runs on the UI thread, not the JS thread. This is why you must use `Animated.View` (from Reanimated) instead of the regular React Native `View` — only Animated components can accept animated styles.

### Animation Functions Explained

**`withTiming(toValue, options)`** — animates to a target value at a constant rate over a fixed duration.
```ts
opacity.value = withTiming(1, { duration: 400, easing: Easing.linear })
```
- `duration: 400` — takes 400 milliseconds
- `easing: Easing.linear` — constant speed. Other options: `Easing.ease` (starts slow, ends slow), `Easing.out(Easing.quad)` (starts fast, slows down)

**`withSpring(toValue, options)`** — animates with a spring physics simulation. Goes slightly past the target value and bounces back.
```ts
scale.value = withSpring(1.0, { damping: 12, stiffness: 80 })
```
- `damping` — how quickly the spring loses energy. Low value (e.g., 5) = lots of bouncing. High value (e.g., 20) = almost no bounce.
- `stiffness` — how strong the spring is. High value = snappy. Low value = slow and floaty.

Spring animations feel "alive" in a way that linear timing does not. Use springs for interactive animations (things the user triggers), timing for scripted animations (things that play on their own).

**`withSequence(...animations)`** — chains multiple animations, each starting when the previous one finishes.
```ts
// Shake animation for wrong answers:
translateX.value = withSequence(
  withTiming(-10, { duration: 50 }),
  withTiming(10, { duration: 50 }),
  withTiming(-10, { duration: 50 }),
  withTiming(10, { duration: 50 }),
  withTiming(0, { duration: 50 }),
)
```
This moves the element left 10px, then right 10px, then left, then right, then back to center — a 250ms shake.

**`withRepeat(animation, count, reverse)`** — repeats an animation a specified number of times.
```ts
opacity.value = withRepeat(
  withTiming(0.2, { duration: 1500 }),
  -1,    // -1 means repeat forever
  true   // true means alternate direction (0.2 → 1 → 0.2 → 1 ...)
)
```
Used for the pulsing circle animations on the Home screen. The `-1` means indefinite repetition.

**`withDelay(delayMs, animation)`** — waits `delayMs` milliseconds before starting the animation.
```ts
// In Grid Memory, cells fade one at a time:
bgColor.value = withDelay(index * 30, withTiming(greyHex, { duration: 400 }))
```
Cell 0 starts immediately, cell 1 waits 30ms, cell 2 waits 60ms, etc. — creating a staggered cascade effect.

### cancelAnimation

From the Home screen particle animations, cleanup is critical:
```ts
useEffect(() => {
  opacity.value = withRepeat(withTiming(0.2, { duration: 1500 }), -1, true)
  return () => cancelAnimation(opacity)  // MUST clean up withRepeat
}, [])
```

If you navigate away from the Home screen without calling `cancelAnimation`, the animation continues running on the UI thread indefinitely, wasting battery and potentially causing issues when the component is destroyed.

The key takeaway: Reanimated 3's power comes from running animation code on the UI thread. `useSharedValue` is the UI-thread variable. `useAnimatedStyle` reads it. `withTiming`, `withSpring`, `withSequence`, `withRepeat`, and `withDelay` are the animation primitives. `cancelAnimation` is how you clean up. Always use `Animated.View` (not `View`) for animated components.

---

## 11. The Skia Canvas (Falling Blocks)

### What a Canvas Is

A canvas is a single drawing surface where you issue draw commands — "draw a rectangle at position X,Y with colour red." The canvas doesn't have a component tree; it just has pixels. This is fundamentally different from React Native's view system, which creates a tree of native UI components (each with its own memory footprint, event handling, and style engine).

For static UIs, React Native views are perfect. For scenes with dozens of animated objects changing every frame, they become a bottleneck. Each view is a separate native object being tracked and updated. Skia draws everything as one GPU-accelerated operation.

### The Falling Animation Architecture

Each block has a Reanimated shared value called `progress` that starts at 0 and animates to 1:
```ts
progress.value = withDelay(
  block.delay * 1000,
  withTiming(1, { duration: 2000 / block.speed, easing: Easing.linear })
)
```

Inside the Skia Canvas, the block's Y position is computed from `progress.value`:
```ts
// y goes from -60 (above screen) to (screenHeight) (below screen)
const y = progress.value * (screenHeight + 60) - 60
```

And the opacity fades out in the bottom 20% of the fall:
```ts
const opacity = progress.value > 0.8
  ? 1 - ((progress.value - 0.8) / 0.2)  // fades from 1→0 in the last 20% of travel
  : 1
```

Worked example for a screen 800px tall, block at `progress = 0.9`:
```
y = 0.9 * (800 + 60) - 60 = 0.9 * 860 - 60 = 774 - 60 = 714px
opacity = 1 - ((0.9 - 0.8) / 0.2) = 1 - (0.1 / 0.2) = 1 - 0.5 = 0.5
```

### Detecting When All Blocks Have Fallen

```ts
useAnimatedReaction(
  () => progress.value,
  (current) => {
    if (current >= 1) {
      completedCount.value += 1
      if (completedCount.value >= blocks.length) {
        runOnJS(onComplete)()
      }
    }
  }
)
```

`useAnimatedReaction` runs on the UI thread and watches a shared value. When every block's progress reaches 1.0, `runOnJS(onComplete)()` crosses back to the JS thread to trigger the phase change.

`runOnJS` is the bridge from UI-thread code back to JS-thread code. You need it because React state updates (`setPhase('questions')`) must happen on the JS thread.

### Skia Primitives

- **`Canvas`** — the drawing surface. Must have explicit `width` and `height`.
- **`Rect`** — draws a rectangle. Takes `x`, `y`, `width`, `height`.
- **`Group`** — groups child elements so they can share a transform or opacity.
- **`Paint`** — defines drawing properties (colour, opacity, stroke width). Applied to shapes via the `paint` prop or as a child component.

The key takeaway: Skia is used when you need to animate many objects simultaneously at 60fps. It bypasses the React view system and draws directly to the GPU. Reanimated shared values drive the positions, and `useAnimatedReaction` bridges back to the JS thread when all animations complete.

---

## 12. The 3D Scene (Exploding Cube)

### The Three.js Scene Graph

Three.js organises 3D content as a tree called the scene graph:
```
Scene
├── Camera          (defines what you see and from where)
├── AmbientLight    (global illumination — shadows and shading)
├── DirectionalLight (a "sun" — casts directional light)
└── Group           (a container for multiple objects)
    ├── Mesh        (a visible 3D object)
    │   ├── BoxGeometry    (defines the shape — a cube)
    │   └── MeshStandardMaterial  (defines the appearance — colour, shininess)
    ├── Mesh
    └── ... (27 total for the Exploding Cube)
```

### How react-three-fiber Maps JSX to Three.js

react-three-fiber maps JSX element names to Three.js class names. `<boxGeometry>` creates `new THREE.BoxGeometry()`. Props map to constructor arguments or properties.

```jsx
// react-three-fiber JSX:
<mesh position={[x, y, z]} ref={meshRef}>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color="#ff2d6b" />
</mesh>

// Equivalent plain Three.js:
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshStandardMaterial({ color: '#ff2d6b' })
const mesh = new THREE.Mesh(geometry, material)
mesh.position.set(x, y, z)
scene.add(mesh)
```

### The 27-Cubelet Layout (The Math)

To arrange 27 cubelets in a 3×3×3 grid, each cubelet of size 1 with 0.1 gap:
```ts
for (let layer = 0; layer < 3; layer++) {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = (col - 1) * 1.1   // col 0→-1.1, col 1→0, col 2→1.1
      const y = (row - 1) * 1.1   // row 0→-1.1, row 1→0, row 2→1.1
      const z = (layer - 1) * 1.1 // layer 0→-1.1, layer 1→0, layer 2→1.1
    }
  }
}
```
Subtracting 1 from the index centres the grid at the origin (0,0,0).

### The Explosion

When the explosion triggers, each cubelet's target position is set to a random point in a sphere around the origin:
```ts
targetX[i].value = withSpring(randInt(-180, 180) / 100)
targetY[i].value = withSpring(randInt(-180, 180) / 100)
targetZ[i].value = withSpring(randInt(-180, 180) / 100)
```

The spring animation gives the explosion a physical quality — cubelets decelerate as they reach their random destinations, as if they have mass.

The key takeaway: react-three-fiber makes Three.js code readable as JSX. The scene graph is a tree. Every `<mesh>` needs a geometry (shape) and a material (appearance). The explosion is achieved by animating each cubelet's position independently with spring physics.

---

## 13. The Flag Direction Game

### The DirectionPad Layout

8 buttons are positioned around a circle of radius 88px, centred in a 220×220 container. The position of each button is calculated using trigonometry:

```ts
const DIRECTION_ANGLES: Record<Direction, number> = {
  N: 270, NE: 315, E: 0, SE: 45, S: 90, SW: 135, W: 180, NW: 225
}

// Convert degrees to radians, then get x,y on the circle
const toPosition = (angleDeg: number) => ({
  left: 110 + Math.cos(angleDeg * Math.PI / 180) * 88 - 22,  // 22 = half button width
  top:  110 + Math.sin(angleDeg * Math.PI / 180) * 88 - 22,
})
```

For East (0°): `cos(0) = 1`, `sin(0) = 0` → button is at the far right.
For North (270°): `cos(270°) = 0`, `sin(270°) = -1` → button is at the top.

### The Stick Figure's Animated Arm

The arm's rotation is stored as a Reanimated shared value in degrees:
```ts
const armAngle = useSharedValue(0)
```

When a new direction is displayed, the arm animates to that direction's angle:
```ts
armAngle.value = withSpring(DIRECTION_ANGLES[currentDirection], { damping: 12, stiffness: 80 })
```

The arm endpoint is recalculated from the angle each frame:
```ts
const armX = 100 + Math.cos(armAngle.value * Math.PI / 180) * 70
const armY = 90 + Math.sin(armAngle.value * Math.PI / 180) * 70
```

This gives the arm its smooth rotational movement.

---

## 14. The Two-Player System

### How Two Players Share One Device

The fundamental challenge: both players must use the same phone, but Player 1 should not be able to see Player 2's answers before playing, and vice versa.

The solution is the **handoff phase**. After Player 1 finishes a game, the app navigates to the Handoff screen. This screen shows Player 2's name and says "Pass the phone to [Player 2]." Player 1 holds "I'm Ready" while Player 2 takes the phone, then Player 2 taps it. Only then does the countdown for Player 2 begin.

All of Player 1's scores are stored in the Zustand store but are never shown to Player 2 during the game — they are only revealed at the results screen at the very end.

### The Complete Handoff Flow in Code

1. **Player 1 finishes a game** (`onGameComplete` in `app/game/mental-math.tsx`):
   ```ts
   submitScore(1, 0, { score: 82, timeMs: 45000, accuracy: 0.875 })
   // → store: phase = 'handoff', currentPlayer = 2
   router.push('/handoff')
   ```

2. **Handoff screen** (`app/handoff.tsx`) renders with Player 2's name and colour.

3. **Player 2 taps "I'm Ready"**:
   ```ts
   sessionStore.advanceAfterHandoff()  // → phase = 'playing'
   router.push('/game/mental-math')
   ```

4. **CountdownOverlay** appears for Player 2, showing Player 2's name in Player 2's colour.

5. **Player 2 finishes** (`onGameComplete`):
   ```ts
   submitScore(2, 0, { score: 71, timeMs: 48000, accuracy: 0.75 })
   // → store: currentGameIndex = 1, currentPlayer = 1, phase = 'handoff'
   router.push('/handoff')
   ```

This cycle repeats 7 times (7 games × 2 handoffs = 14 transitions total).

### How the Winner Is Determined

```ts
getWinner: () => {
  const p1Scores = state.getPlayerScores(1)  // [82, 75, 90, 60, 80, 70, 85]
  const p2Scores = state.getPlayerScores(2)  // [71, 80, 85, 75, 70, 85, 90]
  const p1Total = p1Scores.reduce((a, b) => a + b, 0)  // 542
  const p2Total = p2Scores.reduce((a, b) => a + b, 0)  // 556
  if (p1Total > p2Total) return 1
  if (p2Total > p1Total) return 2
  return 'tie'
}
```

The winner is simply whoever has the higher total score across all 7 games. Brain age is a separate metric (lower is better) that is displayed alongside the scores but is not used to determine the winner — total score determines victory.

---

## 15. Google Play Store Publishing

### What EAS Build Does

"EAS" stands for Expo Application Services. EAS Build is a cloud build service that compiles your JavaScript/TypeScript React Native project into a real Android APK or App Bundle (AAB) without requiring you to install Android Studio, the Android SDK, or Java on your local machine. You push your code to Expo's servers, they build it on a machine that has all the right tools, and they send you back a downloadable file.

### APK vs AAB

- **APK** (Android Package) — the traditional Android app format. Can be installed directly on a device by sharing the file. Larger because it contains assets for all device architectures.
- **AAB** (Android App Bundle) — the format required by the Google Play Store. Google's servers split it into smaller device-specific APKs at install time. Smaller download for users.

Use APK for testing (share with friends directly). Use AAB for the Play Store.

### Code Signing

Android apps must be signed with a private key before they can be installed on a device or uploaded to the Play Store. The signature proves the app comes from you and hasn't been tampered with. EAS manages your signing key in their secure storage — you don't have to handle it manually.

### The eas.json File

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

- **`development`** — builds a development client (includes dev tools, can connect to local Metro bundler)
- **`preview`** — builds an APK for sharing with testers without going through the Play Store
- **`production`** — builds an AAB for uploading to the Play Store

### Build and Submit Commands

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build an APK for testing (sends to Expo's cloud build servers)
eas build --platform android --profile preview

# Build an AAB for the Play Store
eas build --platform android --profile production

# Submit the AAB to the Play Store (requires google-play-key.json)
eas submit --platform android --profile production
```

---

## 16. Interview Preparation — Questions and Answers

**Q1: Why did you use Zustand instead of Redux for state management?**
Redux requires writing action types, action creators, reducer functions, a store configuration file, and a Provider wrapper component — that's typically 4–5 files for even simple state. Zustand achieves the same result with a single `create()` call and no boilerplate. For a moderately complex game like this, Redux's ceremony would add no value — it's designed for large teams with strict conventions. Zustand's API is also easier to read: `set({ score: 0 })` is instantly understandable, whereas Redux's dispatch pattern has an extra layer of indirection.

**Q2: What is React Native Reanimated 3 and why not just use the built-in Animated API?**
React Native's built-in `Animated` API runs animations on the JavaScript thread and communicates with the UI thread via a bridge. If the JS thread is busy, animations stutter. Reanimated 3 compiles animation specifications and sends them to the UI thread to run independently — the JS thread is never involved during the animation itself. This guarantees 60fps even during heavy game logic. In this project, games like Falling Blocks have dozens of simultaneous animations alongside active game logic; the built-in API would cause visible stuttering on mid-range devices.

**Q3: What is a TypeScript generic and where did you use one in this project?**
A generic is a type that takes a type parameter — like a function, but for types. You write it with angle brackets: `<T>`. In `utils/random.ts`, the `randFrom<T>(arr: T[]): T` function can pick a random element from any array — if passed a `string[]` it returns a `string`, if passed a `number[]` it returns a `number`. Without generics, you'd either write separate functions for each type or use `any`, losing all type safety. The generic lets one function work with any type while the compiler still knows what comes out.

**Q4: What is useCallback and when did you need it in this project?**
`useCallback` returns a memoised version of a function — it only creates a new function instance when its dependencies change. Without it, a new function is created on every render. This matters when passing functions as props to child components: if the parent re-renders (say, because a score updates), the child receives a "new" function and React thinks its props changed, triggering an unnecessary re-render. In game screens, the `onGameComplete` function is passed to game components; wrapping it in `useCallback` with `[sessionId, currentGameIndex, currentPlayer]` as dependencies prevents the game component from re-rendering every time the parent updates.

**Q5: How does Expo Router know which screen to show?**
Expo Router reads the `app/` directory at build time and creates a route for every file it finds. The current URL (which Expo Router manages internally, analogous to a web URL) determines which file's default export is rendered. `app/index.tsx` renders at `/`, `app/game/mental-math.tsx` renders at `/game/mental-math`. When you call `router.push('/handoff')`, Expo Router updates the internal URL and React re-renders the matching component. `_layout.tsx` files are wrappers that render their children (the matched route) via the `<Slot />` or `<Stack />` component.

**Q6: How does SQLite differ from a server database like PostgreSQL?**
SQLite is a file — it lives on the device with no server process. Reads and writes are function calls to the local file system, taking microseconds. PostgreSQL lives on a separate machine; every query is a network request taking milliseconds at minimum. SQLite has no user authentication, no concurrent write support from multiple machines, and no network access. For Brain Battle, these are features, not bugs — the data is private to the device, there is no server to maintain, and there is no network dependency. If the game needed leaderboards or cloud sync, SQLite would be insufficient.

**Q7: What is a foreign key and why does your database have them?**
A foreign key is a column whose value must exist as a primary key in another table. In the `sessions` table, `player1_id INTEGER NOT NULL REFERENCES players(id)` means: you cannot create a session row whose `player1_id` doesn't correspond to an existing player. This is referential integrity — the database refuses to create orphaned records. Without foreign keys, you could accidentally save game scores for a player that was deleted, producing confusing history data.

**Q8: Explain the useEffect cleanup function and why it matters.**
Every `useEffect` can return a function that runs when the component unmounts or before the effect runs again. Without cleanup, side effects like timers and subscriptions outlive the component. In `useCountdown`, `setInterval` ticks every second. If you navigate away before the countdown finishes, the interval keeps running in memory, calling `setState` on a component that no longer exists. React would log a warning, and in bad cases the stale timer could trigger unexpected state changes elsewhere. `return () => clearInterval(interval)` guarantees the timer is stopped when the component leaves the screen.

**Q9: What is the Stroop effect and why is it a good brain test?**
The Stroop effect is the interference that occurs when the brain processes two conflicting signals simultaneously — in this case, reading a colour word and identifying the ink colour it's displayed in. The brain's reading system is faster and more automatic than its colour-naming system, so naming the ink colour of the word "RED" printed in blue is genuinely harder than naming the colour of a blue square. This makes the Stroop Test a reliable measure of cognitive inhibition (the ability to suppress a dominant response), selective attention, and processing speed — all validated cognitive metrics.

**Q10: How does Drizzle ORM provide type safety for database queries?**
Drizzle reads your schema definition — the `sqliteTable()` calls in `schema.ts` — and derives TypeScript types from them. The `InferSelectModel<typeof players>` type is automatically `{ id: number; name: string; avatar_color: string; created_at: string }`. When you write a query like `db.select().from(players)`, the return type is automatically `Player[]`. If you then try to access `result[0].email`, TypeScript tells you that property doesn't exist — because it's not in the schema. Without an ORM, the results of `db.getAllSync(sql)` would be typed as `any`, and accessing a non-existent column would silently return `undefined` at runtime.

**Q11: What is the `as const` assertion and what problem does it solve?**
Without `as const`, TypeScript infers string literal values as their general type. The game ID `'mental-math'` would be inferred as type `string`. With `as const` on the GAMES array, TypeScript infers the literal type `'mental-math'`. This enables the derived type `GameId = typeof GAMES[number]['id']` to become the union `'mental-math' | 'grid-memory' | ...` rather than just `string`. Now if you try to navigate to `/game/invalid-name`, TypeScript can flag it as a type error — you've accidentally eliminated an entire category of routing bugs.

**Q12: What is a Skia canvas and why is it used for Falling Blocks specifically?**
A Skia canvas is a 2D drawing surface that renders everything in a single GPU-accelerated draw call. React Native views, by contrast, are native UI objects — each one has memory, event handling, and a layout system. For a static button, views are perfect. For 10 blocks falling simultaneously with independent speeds, opacities, and positions updating 60 times per second, each block as a view would generate 60 style updates per second per block going through React's reconciler. Skia skips all of that — you describe what to draw as a pure function of state, and Skia renders it directly.

**Q13: What is the two-player handoff pattern and why is it designed this way?**
Each game requires both players to play in sequence on the same device. After Player 1 finishes, the app shows the Handoff screen displaying Player 2's name and asking Player 1 to pass the phone. This physical transfer ensures Player 2 cannot see Player 1's score (which is stored in Zustand but never shown during gameplay). It also prevents Player 1 from watching Player 2 play. The scores are only revealed simultaneously at the results screen, maintaining the competitive element. This is a deliberate UX choice: the handoff screen creates a natural pause that feels like a game show moment.

**Q14: What does `performance.now()` return and why is it used instead of `Date.now()`?**
`performance.now()` returns the number of milliseconds elapsed since the page/app was loaded, as a floating-point number with sub-millisecond precision. `Date.now()` returns the number of milliseconds since January 1, 1970 (Unix epoch). For measuring elapsed time intervals, `performance.now()` is more accurate because it is not affected by system clock adjustments (like daylight saving time changes or NTP updates), which can cause `Date.now()` to jump forward or backward mid-measurement. In `useGameTimer`, `performance.now()` is used for accurate sub-second timing of how long a player takes on each game.

**Q15: What is a union type and how did you use it to prevent bugs?**
A union type uses the `|` operator to say a variable can be one of several specific values. In `sessionStore.ts`, `currentPlayer: 1 | 2` means only the numbers 1 and 2 are valid — not 0, not 3, not -1. If a bug caused `currentPlayer` to be set to `0`, TypeScript would catch it at compile time. Similarly, `phase: 'idle' | 'playing' | 'handoff' | 'results'` means only those four strings are valid phase names. This replaces the common JavaScript anti-pattern of using magic numbers (0, 1, 2, 3) for state that has to be mentally mapped to meaning.

**Q16: How is the brain age calculated?**
Brain age is calculated from the player's 7 game scores (each 0–100) using `calcBrainAge` in `utils/scoring.ts`. The function averages the 7 scores and maps the average to a brain age using threshold brackets: average ≥ 90 → brain age 20, average ≥ 75 → 25, average ≥ 60 → 30, and so on down to brain age 65 for averages below 30. A lower brain age is better — a player who averages 90%+ across all 7 games gets a brain age of 20 (exceptional), while a player who averages below 30% gets a brain age of 65. The design intentionally maps to a wide range of real human ages to make the results feel meaningful.

**Q17: What is the Fisher-Yates shuffle and why is it used instead of `.sort(() => Math.random() - 0.5)`?**
The `.sort(() => Math.random() - 0.5)` approach is biased — some permutations appear more often than others, depending on the sorting algorithm's implementation. Fisher-Yates (from `utils/random.ts`) iterates from the last element to the first, swapping each element with a randomly chosen earlier element. This produces every permutation with equal probability and runs in O(n) time. For a game where randomness needs to be fair — like shuffling the answer options in the Stroop Test — this matters.

**Q18: Why does every game have its own folder with an index.tsx and a use[Game].ts file?**
The separation enforces the single responsibility principle. The component file (`index.tsx`) is only responsible for rendering and user interactions. The hook file (`use[Game].ts`) is only responsible for game logic. Without this split, you'd have a 300+ line component file mixing JSX, timers, scoring formulas, and animation code — impossible to maintain. The hook can be reasoned about independently: you can open `useMentalMath.ts` and trace the complete game loop without a single line of JSX. You could even unit-test the hook without rendering anything.

**Q19: What happens if the database fails to initialise?**
In `app/_layout.tsx`, `initDB()` is called in a `try/catch` equivalent (`.catch`):
```ts
initDB()
  .then(() => setReady(true))
  .catch((err) => {
    console.error('DB init failed', err)
    setReady(true)  // proceed anyway
  })
```
Even if the DB fails, `setReady(true)` is called so the app shows up rather than showing a spinner forever. The app will work in a degraded mode — history won't persist and scores won't save — but the user can still play games. This is a graceful degradation: the core experience is preserved even when a secondary feature fails.

**Q20: What is the `Record<K, V>` TypeScript type?**
`Record<K, V>` is a built-in TypeScript utility type that describes an object where every key is of type `K` and every value is of type `V`. It is equivalent to writing `{ [key: K]: V }` but more readable. In `sessionStore.ts`, `scores: Record<number, { player1?: ScoreEntry; player2?: ScoreEntry }>` describes an object indexed by game index numbers (0–6) where each value holds optional score entries for each player. Using `Record` makes the intent explicit: this is a lookup table, not a struct with named fields.

**Q21: Why is the scoring normalised to 0–100?**
Different games have different raw score scales. Mental Math could theoretically score up to 800 raw points (8 rounds × 100 max each). Grid Memory scores up to 100 raw (6 × 16.7). Without normalisation, the games that have higher raw scores would dominate the total. `normaliseScore(rawPoints, maxPoints)` converts every game's score to a 0–100 scale, ensuring each game contributes equally to the final total. This is the same principle behind percentages and z-scores in statistics.

**Q22: What is `useAnimatedReaction` and when do you need it?**
`useAnimatedReaction` lets you run code on the UI thread in response to a shared value changing. It takes two functions: the first reads a shared value (this runs on the UI thread), the second reacts to its output. In the Falling Blocks game, it's used to detect when all blocks have finished falling:
```ts
useAnimatedReaction(
  () => progress.value,
  (val) => { if (val >= 1) { runOnJS(onComplete)() } }
)
```
You cannot use a regular `useEffect` for this because `progress.value` is a shared value on the UI thread — React's `useEffect` runs on the JS thread and cannot observe UI-thread changes. `useAnimatedReaction` is the bridge.

**Q23: What is the `??` operator and how is it used in the codebase?**
`??` is the nullish coalescing operator. It returns the right-hand side only when the left-hand side is `null` or `undefined` (not for `0` or `false`). From `db/queries.ts`:
```ts
winner_id: session.winner_id ?? null
player1BrainAge: ba1[0]?.brain_age ?? null
```
The `?.` is optional chaining: if `ba1[0]` is undefined, `ba1[0]?.brain_age` is `undefined` rather than throwing a TypeError. The `?? null` then converts `undefined` to `null`. Together they say: "give me the brain age if it exists, otherwise null." This is much cleaner than `ba1[0] !== undefined ? ba1[0].brain_age : null`.

**Q24: What is expo-sqlite and how is it different from AsyncStorage?**
AsyncStorage is a key-value store — you set `key → value` pairs, where values are strings. It's appropriate for simple settings like user preferences. expo-sqlite is a full relational database supporting SQL queries, joins, foreign keys, and complex queries. Brain Battle needs to query sessions with their associated players, join brain ages, sort by date, and filter by player ID. These are SQL queries — expressing them in AsyncStorage would require loading all data into memory and filtering in JavaScript. SQLite is orders of magnitude more efficient for relational data.

**Q25: What was the hardest architectural decision in this project and why?**
The hardest decision was where to put the navigation logic after a game ends. One approach: game components call `router.push()` directly. Another approach: game components call a callback, and the screen file handles navigation. The second approach was chosen because it keeps game components reusable and ignorant of the broader app context. A Mental Math component that calls `router.push('/handoff')` directly is forever coupled to this specific navigation structure — you could never reuse it in a practice mode or tutorial. By receiving `onGameComplete` as a prop and calling it with just numbers, the game component knows nothing about what happens next. The screen file — which does know the navigation context — decides where to go. This follows the principle of keeping components as dumb as possible.

---

*End of document. Every file in this codebase was read to produce this explanation. The code referenced throughout reflects the actual implementations in `db/`, `store/`, `constants/`, `utils/`, `hooks/`, and `app/`.*
