import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface PlayerInputProps {
  teamName: string;
  players: string[];
  onUpdatePlayers: (teamName: string, players: string[]) => void;
  maxPlayers?: number;
}

const PlayerInput = ({ teamName, players, onUpdatePlayers, maxPlayers }: PlayerInputProps) => {
  const [newPlayer, setNewPlayer] = useState('');

  const addPlayer = () => {
    if (newPlayer.trim() && !players.includes(newPlayer.trim()) && 
        (!maxPlayers || players.length < maxPlayers)) {
      onUpdatePlayers(teamName, [...players, newPlayer.trim()]);
      setNewPlayer('');
    }
  };

  const removePlayer = (playerToRemove: string) => {
    onUpdatePlayers(teamName, players.filter(p => p !== playerToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPlayer();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter player name"
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button 
          size="sm" 
          onClick={addPlayer}
          disabled={!newPlayer.trim() || players.includes(newPlayer.trim()) || 
                   (maxPlayers && players.length >= maxPlayers)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      
      {players.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {players.map((player, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {player}
              <Button
                size="sm"
                variant="ghost"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => removePlayer(player)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        {players.length} player{players.length !== 1 ? 's' : ''} added
        {maxPlayers && ` (max ${maxPlayers})`}
      </p>
    </div>
  );
};

export default PlayerInput;