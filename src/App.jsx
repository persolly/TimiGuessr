import { useState } from 'react'
import spotsData from './data/spots.json' // TEMP: Member C owns the real spots.json
import { roundScore } from './utils/score.js' // TEMP: Member A owns the real score.js
import StartScreen from './components/StartScreen.jsx'
import GameRound from './components/GameRound.jsx'
import ResultScreen from './components/ResultScreen.jsx'

const TOTAL_ROUNDS = 5

// Proximity-gated learning: the closer the guess, the more info unlocks.
// Levels: 2 = full info (close), 1 = partial (medium), 0 = minimal (far/timeout).
// A's score is flat 5000 within 200 m, then 5000·e^(-(d-200)/1000):
//   ≥ 3000 pts ≈ up to ~710 m → full, ≥ 750 pts ≈ up to ~2.1 km → partial.
const FULL_INFO_PTS = 3000
const SOME_INFO_PTS = 750

function infoLevel(points, guess) {
  if (!guess) return 0 // timed out → minimal
  if (points >= FULL_INFO_PTS) return 2
  if (points >= SOME_INFO_PTS) return 1
  return 0
}

// B2 — Fisher–Yates shuffle, take the first N spots.
function pickRounds(spots) {
  const arr = [...spots]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, TOTAL_ROUNDS)
}

// B1 — Screen state machine.
// One single state object: {screen, roundIndex, totalScore, guesses[], rounds[]}
// screens: 'start' | 'round' | 'reveal' | 'results'
export default function App() {
  const [state, setState] = useState({
    screen: 'start',
    roundIndex: 0,
    totalScore: 0,
    guesses: [], // one entry per completed round: { spot, guess, points }
    rounds: [], // the 5 shuffled spots for this game (B2)
  })

  function startGame() {
    const rounds = pickRounds(spotsData)
    if (rounds.length === 0) {
      // Member C's dataset is empty or missing — never crash on Play.
      console.warn('TimiGuessr: no spots available in spots.json.')
      return
    }

    setState({
      screen: 'round',
      roundIndex: 0,
      totalScore: 0,
      guesses: [],
      rounds,
    })
  }

  // Called by GameRound when the player confirms a pin (coords) or when the
  // timer hits 0 (guess = null → 0 points).
  function handleRoundConfirm(guess) {
    setState((prev) => {
      // Ignore a second submission from a late map click or a timer callback.
      // A round can only be completed once.
      if (prev.screen !== 'round') return prev

      const spot = prev.rounds[prev.roundIndex]
      if (!spot) return prev
      const points = roundScore(guess, spot)
      return {
        ...prev,
        screen: 'reveal',
        totalScore: prev.totalScore + points,
        guesses: [
          ...prev.guesses,
          { spot, guess, points, infoLevel: infoLevel(points, guess) },
        ],
      }
    })
  }

  function nextRound() {
    setState((prev) => {
      // Guard against a double-click on "Next round" skipping a round.
      if (prev.screen !== 'reveal') return prev

      const next = prev.roundIndex + 1
      if (next >= prev.rounds.length) {
        return { ...prev, screen: 'results' }
      }
      return { ...prev, screen: 'round', roundIndex: next }
    })
  }

  switch (state.screen) {
    case 'round': {
      const spot = state.rounds[state.roundIndex]
      return (
        <GameRound
          key={state.roundIndex} // remount per round → timer resets (B3)
          spot={spot}
          roundIndex={state.roundIndex}
          totalRounds={state.rounds.length}
          onConfirm={handleRoundConfirm}
        />
      )
    }
    case 'reveal': {
      const last = state.guesses[state.guesses.length - 1]
      // Keep the same GameRound mounted (same component, key and position) so A's
      // map instance survives and can draw the guess -> truth comparison (A6).
      return (
        <GameRound
          key={state.roundIndex}
          spot={last.spot}
          roundIndex={state.roundIndex}
          totalRounds={state.rounds.length}
          onConfirm={handleRoundConfirm}
          reveal={{
            guess: last.guess,
            points: last.points,
            infoLevel: last.infoLevel,
            totalScore: state.totalScore,
            isLastRound: state.roundIndex >= state.rounds.length - 1,
            onNext: nextRound,
          }}
        />
      )
    }
    case 'results':
      return (
        <ResultScreen
          totalScore={state.totalScore}
          totalPossible={state.rounds.length * 5000}
          guesses={state.guesses}
          onPlayAgain={startGame}
        />
      )
    case 'start':
    default:
      return <StartScreen onStart={startGame} />
  }
}
