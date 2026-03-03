import React from 'react';
import { Card as CardType } from '../types/game';
import { Card } from './Card';

interface PlayerHandProps {
  cards: CardType[];
  onCardClick: (cardId: string) => void;
  isCurrentPlayer: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ cards, onCardClick, isCurrentPlayer }) => {
  return (
    <div className="player-hand">
      <h3>{isCurrentPlayer ? 'Your Hand' : 'Opponent Hand'}</h3>
      <div className="hand-cards">
        {cards.length === 0 ? (
          <p className="empty-hand">No cards in hand</p>
        ) : (
          cards.map((card, index) => (
            <div key={card.id} className="hand-card" style={{ zIndex: index }}>
              <Card 
                card={isCurrentPlayer ? { ...card, faceUp: true } : card} 
                onClick={() => isCurrentPlayer && onCardClick(card.id)}
                size="medium"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
