import { useState } from 'react'
import { firstSentence, getFacts } from '../utils/facts.js'

const fmt = (n) => n.toLocaleString('en-US')

// B5 — Reveal card with proximity-gated info.
// The closer the guess, the more the player learns about the spot:
//   level 2 (close): name + neighborhood + full fact + photo credit
//   level 1 (medium): name + first sentence of the fact
//   level 0 (far / timed out): name only
// The full story is never lost — the results screen shows the complete tour.

export default function RevealCard({
  spot,
  guess,
  points,
  infoLevel,
  totalScore,
  isLastRound,
  onNext,
  showPhoto = true,
}) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const facts = getFacts(spot)

  return (
    <div className="card reveal-card" data-level={infoLevel}>
      <h2>Round result</h2>
      {showPhoto &&
        (photoFailed ? (
          <p className="photo-fallback">Photo unavailable.</p>
        ) : (
          <img
            src={spot.photo}
            alt={spot.name}
            onError={() => setPhotoFailed(true)}
          />
        ))}
      <h3>{spot.name}</h3>

      {infoLevel === 2 && (
        <>
          <p className="reveal-meta">Neighborhood: {spot.neighborhood}</p>
          {facts.length > 0 ? (
            <ul className="reveal-facts">
              {facts.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
          ) : (
            <p className="reveal-fact">A story about this place is coming soon.</p>
          )}
          <p className="reveal-badge">Full story unlocked.</p>
          {spot.attribution && (
            <p className="reveal-meta" style={{ fontStyle: 'italic' }}>
              {spot.attribution}
            </p>
          )}
        </>
      )}

      {infoLevel === 1 && (
        <>
          <ul className="reveal-facts">
            <li>{firstSentence(facts[0]) || 'A story about this place is coming soon.'}</li>
          </ul>
          <p className="reveal-badge">
            Partial story unlocked. A closer guess reveals the rest.
          </p>
        </>
      )}

      {infoLevel === 0 && (
        <p className="reveal-teaser">
          {guess
            ? 'Too far away. The full story remains locked.'
            : 'Time expired. No guess was placed.'}
        </p>
      )}

      <p className="reveal-score">
        <strong>+{fmt(points)} points</strong> · Total: {fmt(totalScore)}
      </p>
      <button onClick={onNext}>{isLastRound ? 'See results' : 'Next round'}</button>
    </div>
  )
}
