import React from 'react';
import type { Card as CardType } from '../types/game';
import { Card } from './Card';

interface GameTableProps {
  playedCards: CardType[];
  deckCount: number;
}

export const GameTable: React.FC<GameTableProps> = ({ playedCards, deckCount }) => {
  return (
    <div className="game-table">
      <div className="table-section">
        <h3>Deck</h3>
        <div className="deck-area">
          {deckCount > 0 ? (
            <div className="deck-stack">
              <Card card={{ id: 'back', suit: 'hearts', rank: 'A', faceUp: false }} size="large" />
              <span className="deck-count">{deckCount} cards</span>
            </div>
          ) : (
            <p className="empty-deck">Deck is empty</p>
          )}
        </div>
      </div>

      <div className="table-section">
        <h3>Played Cards</h3>
        <div className="played-area">
          {playedCards.length === 0 ? (
            <p className="no-cards">No cards played yet</p>
          ) : (
            <div className="played-cards">
              {playedCards.slice(-10).map((card, index) => (
                <div key={`${card.id}-${index}`} className="played-card">
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
