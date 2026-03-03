import React from 'react';
import type { Card as CardType } from '../types/game';
import { Card } from './Card';

interface PlayerHandProps {
  cards: CardType[];
  onCardClick: (cardId: string) => void;
  isCurrentPlayer: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ cards, onCardClick, isCurrentPlayer }) => {
  return (
    <div className="bg-white/10 rounded-xl p-5 my-5">
      <h3 className="text-white text-lg font-semibold mb-4 mt-0">
        {isCurrentPlayer ? 'Your Hand' : 'Opponent Hand'}
      </h3>
      <div className="flex flex-wrap min-h-[120px] items-center">
        {cards.length === 0 ? (
          <p className="text-white/50 italic my-5">No cards in hand</p>
        ) : (
          cards.map((card, index) => (
            <div key={card.id} className="player-hand__card" style={{ zIndex: index }}>
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
