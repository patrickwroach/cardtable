import React from 'react';
import type { Card as CardType } from '../types/game';
import { Card } from './Card';

interface GameTableProps {
  playedCards: CardType[];
  deckCount: number;
}

export const GameTable: React.FC<GameTableProps> = ({ playedCards, deckCount }) => {
  return (
    <div className="bg-green-800/30 border-4 border-green-600/50 rounded-3xl p-8 my-8 min-h-[300px] flex gap-10 justify-around flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <h3 className="text-white text-center text-xl font-semibold mb-5 mt-0">Deck</h3>
        <div className="flex items-center justify-center min-h-[200px]">
          {deckCount > 0 ? (
            <div className="relative flex flex-col items-center gap-3">
              <Card card={{ id: 'back', suit: 'hearts', rank: 'A', faceUp: false }} size="large" />
              <span className="bg-black/70 text-white px-4 py-1 rounded-full text-sm font-bold">
                {deckCount} cards
              </span>
            </div>
          ) : (
            <p className="text-white/50 italic text-center">Deck is empty</p>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-[200px]">
        <h3 className="text-white text-center text-xl font-semibold mb-5 mt-0">Played Cards</h3>
        <div className="flex items-center justify-center min-h-[200px]">
          {playedCards.length === 0 ? (
            <p className="text-white/50 italic text-center">No cards played yet</p>
          ) : (
            <div className="flex flex-wrap gap-2.5 justify-center max-w-lg">
              {playedCards.slice(-10).map((card, index) => (
                <div key={`${card.id}-${index}`}>
                  <Card card={card} size="medium" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
