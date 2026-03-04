import React from 'react';
import type { Card as CardType, Suit } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const suitSymbols: Record<Suit, string> = {
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
  spades:   '♠',
};

// Dynamic per-card color — inline style is appropriate here (FEAT-007 runtime value).
const suitColors: Record<Suit, string> = {
  hearts:   'red',
  diamonds: 'red',
  clubs:    'black',
  spades:   'black',
};

const sizeClass: Record<NonNullable<CardProps['size']>, string> = {
  small:  'card--sm',
  medium: 'card--md',
  large:  'card--lg',
};

export const Card: React.FC<CardProps> = ({ card, onClick, size = 'medium' }) => {
  const sz = sizeClass[size];

  if (!card.faceUp) {
    return (
      <div className={`card card--back ${sz}`} onClick={onClick}>
        <div className="card__pattern" />
      </div>
    );
  }

  const symbol = card.suit ? suitSymbols[card.suit] : null;
  const color  = card.suit ? suitColors[card.suit] : 'inherit';
  const rankLabel = card.rank ?? null;
  // For non-standard cards fall back to title, then a generic placeholder
  const faceLabel = card.title ?? (rankLabel && symbol ? null : '?');

  return (
    <div
      className={`card card--face ${sz}`}
      onClick={onClick}
      style={{ color }}
    >
      {faceLabel ? (
        // Non-standard card: show title (and description if present) centred
        <>
          <div className="card__corner card__corner--top-left">
            <span className="card__rank">{faceLabel}</span>
          </div>
          <div className="card__center">
            <span className="card__rank" style={{ fontSize: '0.7em', textAlign: 'center', padding: '0 4px' }}>
              {faceLabel}
            </span>
          </div>
          <div className="card__corner card__corner--bottom-right">
            <span className="card__rank">{faceLabel}</span>
          </div>
        </>
      ) : (
        // Standard playing card
        <>
          <div className="card__corner card__corner--top-left">
            <span className="card__rank">{rankLabel}</span>
            <span className="card__suit">{symbol}</span>
          </div>
          <div className="card__center">
            <span className="card__suit--large">{symbol}</span>
          </div>
          <div className="card__corner card__corner--bottom-right">
            <span className="card__rank">{rankLabel}</span>
            <span className="card__suit">{symbol}</span>
          </div>
        </>
      )}
    </div>
  );
};
