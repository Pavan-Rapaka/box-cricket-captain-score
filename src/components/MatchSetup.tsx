import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Clock, Target, Trophy, Zap, Calendar, Award, ArrowLeft } from 'lucide-react';

export type MatchFormat = 'T20' | 'ODI' | 'Test' | 'Super Over' | 'Custom';

export interface MatchConfig {
  format: MatchFormat;
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
  innings: number; // For test matches
  daysPlanned?: number; // For test matches
  followOnMargin?: number; // For test matches
}

interface MatchSetupProps {
  onStartMatch: (config: MatchConfig) => void;
  onBack?: () => void;
}

const MatchSetup = ({ onStartMatch, onBack }: MatchSetupProps) => {
  const [config, setConfig] = useState<MatchConfig>({
    format: 'T20',
    overs: 20,
    wickets: 10,
    lastManStands: false,
    team1Name: '',
    team2Name: '',
    team1Players: [''],
    team2Players: [''],
    team1Captain: '',
    team2Captain: '',
    tossWinner: '',
    firstBatting: '',
    innings: 2,
    daysPlanned: 5,
    followOnMargin: 200
  });

  const handleFormatChange = (format: MatchFormat) => {
    let newConfig: Partial<MatchConfig> = { format };
    
    switch (format) {
      case 'T20':
        newConfig = { ...newConfig, overs: 20, innings: 2 };
        break;
      case 'ODI':
        newConfig = { ...newConfig, overs: 50, innings: 2 };
        break;
      case 'Test':
        newConfig = { ...newConfig, innings: 4, daysPlanned: 5, followOnMargin: 200 };
        break;
      case 'Super Over':
        newConfig = { ...newConfig, overs: 1, innings: 2 };
        break;
      case 'Custom':
        // Keep current settings
        break;
    }
    
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const addPlayer = (team: 'team1' | 'team2') => {
    const otherTeam = team === 'team1' ? 'team2' : 'team1';
    const otherTeamPlayers = team === 'team1' ? config.team2Players : config.team1Players;
    const currentTeamPlayers = team === 'team1' ? config.team1Players : config.team2Players;
    
    // Don't allow more players than the other team has
    if (currentTeamPlayers.length >= otherTeamPlayers.length && otherTeamPlayers.some(p => p.trim())) {
      return;
    }
    
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
    setTimeout(updateWickets, 0);
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
    setTimeout(updateWickets, 0);
  };

  const updateWickets = () => {
    const team1ValidPlayers = config.team1Players.filter(p => p.trim()).length;
    const team2ValidPlayers = config.team2Players.filter(p => p.trim()).length;
    
    // Ensure both teams have equal players
    if (team1ValidPlayers > 0 && team2ValidPlayers > 0) {
      const minPlayers = Math.min(team1ValidPlayers, team2ValidPlayers);
      // Last man stands: wickets = players, Default: wickets = players - 1
      const newWickets = config.lastManStands ? minPlayers : minPlayers - 1;
      setConfig(prev => ({ ...prev, wickets: newWickets }));
    }
  };

  const isFormValid = () => {
    const team1ValidPlayers = config.team1Players.filter(p => p.trim());
    const team2ValidPlayers = config.team2Players.filter(p => p.trim());
    
    return config.team1Name && 
           config.team2Name && 
           team1ValidPlayers.length >= 2 &&
           team2ValidPlayers.length >= 2 &&
           team1ValidPlayers.length === team2ValidPlayers.length && // Equal teams
           config.team1Captain &&
           config.team2Captain &&
           team1ValidPlayers.includes(config.team1Captain) && // Captain from team
           team2ValidPlayers.includes(config.team2Captain) && // Captain from team
           config.tossWinner &&
           config.firstBatting;
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="float-left">
              <Trophy className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          )}
          <Trophy className="w-16 h-16 text-cricket-gold mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Cricket Match Setup</h1>
          <p className="text-muted-foreground mt-2">Configure your match details</p>
        </div>

        {/* Match Format */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Match Format
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="format">Select Format</Label>
              <Select value={config.format} onValueChange={handleFormatChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose match format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T20">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      T20 (20 overs)
                    </div>
                  </SelectItem>
                  <SelectItem value="ODI">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      ODI (50 overs)
                    </div>
                  </SelectItem>
                  <SelectItem value="Test">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Test Match (4 innings)
                    </div>
                  </SelectItem>
                  <SelectItem value="Super Over">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Super Over (1 over)
                    </div>
                  </SelectItem>
                  <SelectItem value="Custom">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Custom Format
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Match Rules */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Match Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="overs">
                {config.format === 'Super Over' ? 'Balls per over' : 'Overs per innings'}
              </Label>
              <Input
                id="overs"
                type="number"
                min="1"
                max={config.format === 'Test' ? "200" : config.format === 'Super Over' ? "6" : "50"}
                value={config.overs}
                onChange={(e) => setConfig(prev => ({ ...prev, overs: Number(e.target.value) }))}
                disabled={config.format !== 'Custom' && config.format !== 'Test'}
              />
            </div>
            
            <div className="bg-muted/50 border rounded-lg p-3">
              <Label className="text-sm font-medium">Auto-calculated Wickets: {config.wickets}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {config.lastManStands ? 'Equal to number of players (Last man stands enabled)' : 'One less than number of players'}
              </p>
            </div>

            {config.format === 'Test' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="days">Days Planned</Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    max="5"
                    value={config.daysPlanned}
                    onChange={(e) => setConfig(prev => ({ ...prev, daysPlanned: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="followon">Follow-on Margin</Label>
                  <Input
                    id="followon"
                    type="number"
                    min="100"
                    max="300"
                    value={config.followOnMargin}
                    onChange={(e) => setConfig(prev => ({ ...prev, followOnMargin: Number(e.target.value) }))}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="lastman"
                checked={config.lastManStands}
                onCheckedChange={(checked) => {
                  setConfig(prev => ({ ...prev, lastManStands: checked }));
                  setTimeout(updateWickets, 0);
                }}
              />
              <Label htmlFor="lastman">Last man stands rule</Label>
            </div>

            {config.format === 'Super Over' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Super Over Rules:</strong> Each team gets 6 balls to score as many runs as possible. 
                  If scores are tied, the team with more boundaries wins.
                </p>
              </div>
            )}

            {config.format === 'Test' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Test Match Rules:</strong> Each team bats twice. Follow-on applies if first innings lead 
                  exceeds the margin. Match can end in draw if time runs out.
                </p>
              </div>
            )}
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
                <Select value={config.team1Captain} onValueChange={(value) => setConfig(prev => ({ ...prev, team1Captain: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select captain from team" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.team1Players.filter(p => p.trim()).map((player, index) => (
                      <SelectItem key={index} value={player}>
                        {player}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select value={config.team2Captain} onValueChange={(value) => setConfig(prev => ({ ...prev, team2Captain: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select captain from team" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.team2Players.filter(p => p.trim()).map((player, index) => (
                      <SelectItem key={index} value={player}>
                        {player}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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