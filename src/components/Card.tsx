import React from 'react';
import type { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const suitSymbols: Record<CardType['suit'], string> = {
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
  spades:   '♠',
};

// Dynamic per-card color — inline style is appropriate here (FEAT-007 runtime value).
const suitColors: Record<CardType['suit'], string> = {
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

  return (
    <div
      className={`card card--face ${sz}`}
      onClick={onClick}
      style={{ color: suitColors[card.suit] }}
    >
      <div className="card__corner card__corner--top-left">
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit">{suitSymbols[card.suit]}</span>
      </div>
      <div className="card__center">
        <span className="card__suit--large">{suitSymbols[card.suit]}</span>
      </div>
      <div className="card__corner card__corner--bottom-right">
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit">{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
};
