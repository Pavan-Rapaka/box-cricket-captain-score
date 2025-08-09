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
  const [addAsCommon, setAddAsCommon] = useState(false);

  const getTeamPlayers = (team: string) => {
    return team === team1 ? team1Players : team2Players;
  };

  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (!name || !selectedTeam) return;

    const otherTeam = selectedTeam === team1 ? team2 : team1;
    const currentPlayers = getTeamPlayers(selectedTeam);
    const otherPlayers = getTeamPlayers(otherTeam);

    // Enforce max per team
    if (currentPlayers.length >= maxPlayersPerTeam || otherPlayers.length >= maxPlayersPerTeam) return;

    // Common player: add to both teams (keeps counts equal)
    if (addAsCommon) {
      if (!currentPlayers.includes(name) && !otherPlayers.includes(name)) {
        onUpdatePlayers(selectedTeam, [...currentPlayers, name]);
        onUpdatePlayers(otherTeam, [...otherPlayers, name]);
        setNewPlayerName('');
      }
      return;
    }

    // Non-common: only allow adding to the team that currently has fewer players
    if (currentPlayers.length < otherPlayers.length) {
      if (!currentPlayers.includes(name)) {
        onUpdatePlayers(selectedTeam, [...currentPlayers, name]);
        setNewPlayerName('');
      }
    }
  };

  const removePlayer = (team: string, playerName: string) => {
    const currentPlayers = getTeamPlayers(team);
    const otherTeam = team === team1 ? team2 : team1;
    const otherPlayers = getTeamPlayers(otherTeam);

    // Don't allow removing if team has minimum players (2)
    if (currentPlayers.length <= 2) return;

    // Only allow removal if this team currently has more players than the other (to keep counts equal)
    if (currentPlayers.length > otherPlayers.length) {
      onUpdatePlayers(team, currentPlayers.filter(p => p !== playerName));
    }
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
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Enter player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                />
                <Button 
                  size="sm" 
                  onClick={addPlayer}
                  disabled={
                    !newPlayerName.trim() ||
                    // Disable if exceeding limits
                    getTeamPlayers(selectedTeam).length >= maxPlayersPerTeam ||
                    // When not adding as common, only allow adding to the smaller team
                    (!addAsCommon && selectedTeam && getTeamPlayers(selectedTeam).length >= getTeamPlayers(selectedTeam === team1 ? team2 : team1).length)
                  }
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {getTeamPlayers(selectedTeam).length}/{maxPlayersPerTeam} players
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <input id="common-player" type="checkbox" checked={addAsCommon} onChange={(e) => setAddAsCommon(e.target.checked)} />
                  <label htmlFor="common-player">Add as common player (both teams)</label>
                </div>
              </div>
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