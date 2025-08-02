import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Users } from 'lucide-react';

interface InGamePlayerManagementProps {
  team1: string;
  team2: string;
  team1Players: string[];
  team2Players: string[];
  onUpdatePlayers: (team: string, players: string[]) => void;
  maxPlayersPerTeam: number;
}

const InGamePlayerManagement = ({ 
  team1, 
  team2, 
  team1Players, 
  team2Players, 
  onUpdatePlayers, 
  maxPlayersPerTeam 
}: InGamePlayerManagementProps) => {
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [newPlayerName, setNewPlayerName] = useState('');

  const getTeamPlayers = (team: string) => {
    return team === team1 ? team1Players : team2Players;
  };

  const addPlayer = () => {
    if (!newPlayerName.trim() || !selectedTeam) return;
    
    const currentPlayers = getTeamPlayers(selectedTeam);
    if (currentPlayers.length >= maxPlayersPerTeam) return;
    
    if (!currentPlayers.includes(newPlayerName.trim())) {
      onUpdatePlayers(selectedTeam, [...currentPlayers, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (team: string, playerName: string) => {
    const currentPlayers = getTeamPlayers(team);
    // Don't allow removing if team has minimum players (2)
    if (currentPlayers.length <= 2) return;
    
    onUpdatePlayers(team, currentPlayers.filter(p => p !== playerName));
  };

  const openManageDialog = (team: string) => {
    setSelectedTeam(team);
    setShowManageDialog(true);
  };

  return (
    <>
      <div className="flex gap-3 justify-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => openManageDialog(team1)}
        >
          <Users className="w-4 h-4 mr-1" />
          Manage {team1} Players
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => openManageDialog(team2)}
        >
          <Users className="w-4 h-4 mr-1" />
          Manage {team2} Players
        </Button>
      </div>

      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage {selectedTeam} Players</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add Player */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                />
                <Button 
                  size="sm" 
                  onClick={addPlayer}
                  disabled={!newPlayerName.trim() || getTeamPlayers(selectedTeam).length >= maxPlayersPerTeam}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {getTeamPlayers(selectedTeam).length}/{maxPlayersPerTeam} players
              </p>
            </div>

            {/* Current Players */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current Players:</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {getTeamPlayers(selectedTeam).map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{player}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePlayer(selectedTeam, player)}
                      disabled={getTeamPlayers(selectedTeam).length <= 2}
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {getTeamPlayers(selectedTeam).length <= 2 && (
                <p className="text-xs text-amber-600">
                  Minimum 2 players required per team
                </p>
              )}
            </div>

            <Button 
              onClick={() => {
                setShowManageDialog(false);
                setSelectedTeam('');
                setNewPlayerName('');
              }}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InGamePlayerManagement;