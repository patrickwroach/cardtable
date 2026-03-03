import React from 'react';
import type { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const suitColors = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black'
};

export const Card: React.FC<CardProps> = ({ card, onClick, size = 'medium' }) => {
  if (!card.faceUp) {
    return (
      <div className={`card card-back ${size}`} onClick={onClick}>
        <div className="card-pattern"></div>
      </div>
    );
  }

  return (
    <div 
      className={`card card-face ${size}`} 
      onClick={onClick}
      style={{ color: suitColors[card.suit] }}
    >
      <div className="card-corner top-left">
        <div className="rank">{card.rank}</div>
        <div className="suit">{suitSymbols[card.suit]}</div>
      </div>
      <div className="card-center">
        <span className="suit-large">{suitSymbols[card.suit]}</span>
      </div>
      <div className="card-corner bottom-right">
        <div className="rank">{card.rank}</div>
        <div className="suit">{suitSymbols[card.suit]}</div>
      </div>
    </div>
  );
};
