import { useEffect, useRef, useState } from 'react'
import useTimer from '../hooks/useTimer.js'
import GuessMap from './GuessMap.jsx' // TEMP: Member A owns the real GuessMap

const ROUND_SECONDS = 60

// B3 + B4 — Game round: photo + 60s timer + guess map.
// On timeout the round submits the pin that is currently placed (or null if none).
export default function GameRound({ spot, roundIndex, totalRounds, onConfirm }) {
  const { seconds, isDone } = useTimer(ROUND_SECONDS)
  const hasSubmitted = useRef(false)
  const pendingGuess = useRef(null)
  const [photoFailed, setPhotoFailed] = useState(false)

  // Auto-submit on timeout (B3): keep a placed pin instead of discarding it.
  useEffect(() => {
    if (isDone && !hasSubmitted.current) {
      hasSubmitted.current = true
      onConfirm(pendingGuess.current)
    }
  }, [isDone, onConfirm])

  function handlePinChange(coords) {
    pendingGuess.current = coords
  }

  function handleConfirm(guess) {
    if (hasSubmitted.current) return
    hasSubmitted.current = true
    onConfirm(guess)
  }

  return (
    // The context menu is suppressed across the round screen so the photo cannot be
    // opened/saved via right-click or long-press. Dragging is disabled below.
    <div onContextMenu={(e) => e.preventDefault()}>
      <p className="round-header" role="timer">
        Round {roundIndex + 1} of {totalRounds} · {seconds}s remaining
      </p>
      {/* C's CSS makes this screen a grid with the photo and map as direct children. */}
      {photoFailed ? (
        <div className="photo-fallback">Photo unavailable.</div>
      ) : (
        /* B4: empty alt on purpose — alt text would reveal the answer */
        <img
          src={spot.photo}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onError={() => setPhotoFailed(true)}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitUserDrag: 'none',
            WebkitTouchCallout: 'none',
          }}
        />
      )}
      <GuessMap spot={spot} onConfirm={handleConfirm} onPinChange={handlePinChange} />
    </div>
  )
}
