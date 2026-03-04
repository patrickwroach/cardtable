import React from 'react';
import type { Card as CardType } from '../types/game';
import { Card } from './Card';

interface PlayerHandProps {
  cards: CardType[];
  onCardClick: (cardId: string) => void;
  isCurrentPlayer: boolean;
  /** FEAT-004: when false, card clicks are suppressed (out-of-turn gating, Task 4.3) */
  isActive?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardClick,
  isCurrentPlayer,
  isActive = true,
}) => {
  const canAct = isCurrentPlayer && isActive;
  return (
    <div className="bg-white/10 rounded-xl p-5 my-5">
      <h3 className="text-white text-lg font-semibold mb-4 mt-0">
        {isCurrentPlayer ? 'Your Hand' : 'Opponent Hand'}
        {isCurrentPlayer && !isActive && (
          <span className="ml-3 text-xs font-normal text-yellow-300 bg-yellow-900/50 px-2 py-0.5 rounded-full">
            Not your turn
          </span>
        )}
      </h3>
      <div className="flex flex-wrap min-h-[120px] items-center">
        {cards.length === 0 ? (
          <p className="text-white/50 italic my-5">No cards in hand</p>
        ) : (
          cards.map((card, index) => (
            <div key={card.id} className="player-hand__card" style={{ zIndex: index }}>
              <Card
                card={isCurrentPlayer ? { ...card, faceUp: true } : card}
                onClick={() => canAct && onCardClick(card.id)}
                size="medium"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
