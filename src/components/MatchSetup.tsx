import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Users, Clock, Target, Trophy } from 'lucide-react';

export interface MatchConfig {
  overs: number;
  wickets: number;
  lastManStands: boolean;
  team1Name: string;
  team2Name: string;
  team1Players: string[];
  team2Players: string[];
  team1Captain: string;
  team2Captain: string;
  tossWinner: string;
  firstBatting: string;
}

interface MatchSetupProps {
  onStartMatch: (config: MatchConfig) => void;
}

const MatchSetup = ({ onStartMatch }: MatchSetupProps) => {
  const [config, setConfig] = useState<MatchConfig>({
    overs: 6,
    wickets: 10,
    lastManStands: false,
    team1Name: '',
    team2Name: '',
    team1Players: [''],
    team2Players: [''],
    team1Captain: '',
    team2Captain: '',
    tossWinner: '',
    firstBatting: ''
  });

  const addPlayer = (team: 'team1' | 'team2') => {
    if (team === 'team1') {
      setConfig(prev => ({
        ...prev,
        team1Players: [...prev.team1Players, '']
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        team2Players: [...prev.team2Players, '']
      }));
    }
  };

  const updatePlayer = (team: 'team1' | 'team2', index: number, name: string) => {
    if (team === 'team1') {
      const newPlayers = [...config.team1Players];
      newPlayers[index] = name;
      setConfig(prev => ({ ...prev, team1Players: newPlayers }));
    } else {
      const newPlayers = [...config.team2Players];
      newPlayers[index] = name;
      setConfig(prev => ({ ...prev, team2Players: newPlayers }));
    }
  };

  const isFormValid = () => {
    return config.team1Name && 
           config.team2Name && 
           config.team1Players.filter(p => p.trim()).length >= 2 &&
           config.team2Players.filter(p => p.trim()).length >= 2 &&
           config.team1Captain &&
           config.team2Captain &&
           config.tossWinner &&
           config.firstBatting;
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 text-cricket-gold mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Cricket Match Setup</h1>
          <p className="text-muted-foreground mt-2">Configure your match details</p>
        </div>

        {/* Match Rules */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Match Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="overs">Overs per innings</Label>
                <Input
                  id="overs"
                  type="number"
                  min="1"
                  max="50"
                  value={config.overs}
                  onChange={(e) => setConfig(prev => ({ ...prev, overs: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="wickets">Maximum wickets</Label>
                <Input
                  id="wickets"
                  type="number"
                  min="1"
                  max="11"
                  value={config.wickets}
                  onChange={(e) => setConfig(prev => ({ ...prev, wickets: Number(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="lastman"
                checked={config.lastManStands}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, lastManStands: checked }))}
              />
              <Label htmlFor="lastman">Last man stands rule</Label>
            </div>
          </CardContent>
        </Card>

        {/* Team Setup */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Team 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team 1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team1name">Team Name</Label>
                <Input
                  id="team1name"
                  placeholder="Enter team name"
                  value={config.team1Name}
                  onChange={(e) => setConfig(prev => ({ ...prev, team1Name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Players</Label>
                {config.team1Players.map((player, index) => (
                  <Input
                    key={index}
                    placeholder={`Player ${index + 1}`}
                    value={player}
                    onChange={(e) => updatePlayer('team1', index, e.target.value)}
                    className="mt-2"
                  />
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addPlayer('team1')}
                  className="mt-2 w-full"
                >
                  Add Player
                </Button>
              </div>

              <div>
                <Label htmlFor="team1captain">Captain</Label>
                <Input
                  id="team1captain"
                  placeholder="Captain name"
                  value={config.team1Captain}
                  onChange={(e) => setConfig(prev => ({ ...prev, team1Captain: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Team 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team 2
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team2name">Team Name</Label>
                <Input
                  id="team2name"
                  placeholder="Enter team name"
                  value={config.team2Name}
                  onChange={(e) => setConfig(prev => ({ ...prev, team2Name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Players</Label>
                {config.team2Players.map((player, index) => (
                  <Input
                    key={index}
                    placeholder={`Player ${index + 1}`}
                    value={player}
                    onChange={(e) => updatePlayer('team2', index, e.target.value)}
                    className="mt-2"
                  />
                ))}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addPlayer('team2')}
                  className="mt-2 w-full"
                >
                  Add Player
                </Button>
              </div>

              <div>
                <Label htmlFor="team2captain">Captain</Label>
                <Input
                  id="team2captain"
                  placeholder="Captain name"
                  value={config.team2Captain}
                  onChange={(e) => setConfig(prev => ({ ...prev, team2Captain: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toss Setup */}
        <Card className="my-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Toss & Batting Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tossWinner">Toss Winner</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={config.tossWinner === config.team1Name ? "default" : "outline"}
                  onClick={() => setConfig(prev => ({ ...prev, tossWinner: config.team1Name }))}
                  disabled={!config.team1Name}
                >
                  {config.team1Name || 'Team 1'}
                </Button>
                <Button
                  variant={config.tossWinner === config.team2Name ? "default" : "outline"}
                  onClick={() => setConfig(prev => ({ ...prev, tossWinner: config.team2Name }))}
                  disabled={!config.team2Name}
                >
                  {config.team2Name || 'Team 2'}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="firstBatting">Choose to Bat/Bowl First</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={config.firstBatting === config.team1Name ? "default" : "outline"}
                  onClick={() => setConfig(prev => ({ ...prev, firstBatting: config.team1Name }))}
                  disabled={!config.team1Name}
                >
                  {config.team1Name || 'Team 1'} Bat First
                </Button>
                <Button
                  variant={config.firstBatting === config.team2Name ? "default" : "outline"}
                  onClick={() => setConfig(prev => ({ ...prev, firstBatting: config.team2Name }))}
                  disabled={!config.team2Name}
                >
                  {config.team2Name || 'Team 2'} Bat First
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Button 
          size="lg" 
          className="w-full" 
          onClick={() => onStartMatch(config)}
          disabled={!isFormValid()}
        >
          <Target className="w-5 h-5 mr-2" />
          Start Match
        </Button>
      </div>
    </div>
  );
};

export default MatchSetup;