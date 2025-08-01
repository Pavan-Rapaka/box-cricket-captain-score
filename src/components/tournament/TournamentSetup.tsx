import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Trophy, Users, Calendar as CalendarIcon, ArrowLeft, Target, Clock, Award } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { Tournament, TournamentMatch } from '@/pages/Tournament';
import PlayerInput from './PlayerInput';

interface TournamentSetupProps {
  tournament?: Tournament;
  onCreateTournament: (tournament: Tournament) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const TournamentSetup = ({ tournament, onCreateTournament, onCancel, isEditing = false }: TournamentSetupProps) => {
  const [name, setName] = useState(tournament?.name || '');
  const [format, setFormat] = useState<'round-robin' | 'knockout' | 'league' | 'tri-series'>(tournament?.format || 'round-robin');
  const [teams, setTeams] = useState<string[]>(tournament?.teams || ['', '']);
  const [startDate, setStartDate] = useState<Date | undefined>(tournament?.startDate);
  const [players, setPlayers] = useState<Record<string, string[]>>(tournament?.players || {});
  const [overs, setOvers] = useState(tournament?.overs || 20);
  const [wickets, setWickets] = useState(tournament?.wickets || 10);
  const [lastManStands, setLastManStands] = useState(tournament?.lastManStands || false);
  const [entryFee, setEntryFee] = useState(tournament?.entryFee || 0);
  const [requiresPayment, setRequiresPayment] = useState(tournament?.requiresPayment || false);

  const addTeam = () => {
    setTeams(prev => [...prev, '']);
  };

  const updateTeam = (index: number, value: string) => {
    const oldTeamName = teams[index];
    const newTeams = [...teams];
    newTeams[index] = value;
    setTeams(newTeams);
    
    // Update players mapping if team name changed
    if (oldTeamName && oldTeamName !== value && players[oldTeamName]) {
      const newPlayers = { ...players };
      newPlayers[value] = newPlayers[oldTeamName];
      delete newPlayers[oldTeamName];
      setPlayers(newPlayers);
    }
  };

  const updatePlayers = (teamName: string, playerList: string[]) => {
    setPlayers(prev => ({
      ...prev,
      [teamName]: playerList
    }));
  };

  const removeTeam = (index: number) => {
    if (teams.length > 2) {
      setTeams(prev => prev.filter((_, i) => i !== index));
    }
  };

  const generateMatches = (teamList: string[], tournamentFormat: string): TournamentMatch[] => {
    const matches: TournamentMatch[] = [];
    let matchNumber = 1;

    if (tournamentFormat === 'round-robin' || tournamentFormat === 'tri-series') {
      // Generate all possible combinations
      for (let i = 0; i < teamList.length; i++) {
        for (let j = i + 1; j < teamList.length; j++) {
          matches.push({
            id: `match-${matchNumber}`,
            tournamentId: '',
            team1: teamList[i],
            team2: teamList[j],
            matchNumber,
            scheduledDate: new Date(),
            status: 'scheduled'
          });
          matchNumber++;
        }
      }
    } else if (tournamentFormat === 'knockout') {
      // Generate knockout brackets (simplified)
      const rounds = Math.ceil(Math.log2(teamList.length));
      for (let round = 1; round <= rounds; round++) {
        const matchesInRound = Math.pow(2, rounds - round);
        for (let match = 0; match < matchesInRound; match++) {
          matches.push({
            id: `match-${matchNumber}`,
            tournamentId: '',
            team1: round === 1 ? teamList[match * 2] || 'TBD' : 'TBD',
            team2: round === 1 ? teamList[match * 2 + 1] || 'TBD' : 'TBD',
            matchNumber,
            round: `Round ${round}`,
            scheduledDate: new Date(),
            status: 'scheduled'
          });
          matchNumber++;
        }
      }
    }

    return matches;
  };

  const handleCreate = () => {
    if (!name || !startDate || teams.filter(t => t.trim()).length < 2) return;

    const validTeams = teams.filter(t => t.trim());
    const matches = generateMatches(validTeams, format);

    const tournamentData: Tournament = {
      id: tournament?.id || `tournament-${Date.now()}`,
      name,
      format,
      teams: validTeams,
      players,
      status: tournament?.status || 'setup',
      startDate,
      overs,
      wickets,
      lastManStands,
      entryFee,
      requiresPayment,
      matches: isEditing ? tournament?.matches || [] : matches,
      pointsTable: isEditing ? tournament?.pointsTable || [] : validTeams.map(team => ({
        team,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        netRunRate: 0
      }))
    };

    onCreateTournament(tournamentData);
  };

  const isFormValid = () => {
    return name && startDate && teams.filter(t => t.trim()).length >= 2;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Edit Tournament' : 'Create Tournament'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Update tournament details' : 'Set up a new cricket tournament'}
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tournament Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                id="name"
                placeholder="Enter tournament name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="format">Tournament Format</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as 'round-robin' | 'knockout' | 'league' | 'tri-series')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round-robin">Round Robin</SelectItem>
                  <SelectItem value="tri-series">Tri-Series (3 teams)</SelectItem>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="league">League</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatDate(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Match Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Match Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="overs">Overs per innings</Label>
              <Input
                id="overs"
                type="number"
                min="1"
                max="50"
                value={overs}
                onChange={(e) => setOvers(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="wickets">Wickets per innings</Label>
              <Input
                id="wickets"
                type="number"
                min="1"
                max="15"
                value={wickets}
                onChange={(e) => setWickets(Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="lastman"
                checked={lastManStands}
                onCheckedChange={(checked) => setLastManStands(checked)}
              />
              <Label htmlFor="lastman">Last man stands rule</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="payment"
                checked={requiresPayment}
                onCheckedChange={(checked) => setRequiresPayment(checked)}
              />
              <Label htmlFor="payment">Require entry payment</Label>
            </div>
            
            {requiresPayment && (
              <div>
                <Label htmlFor="entryFee">Entry Fee (in your currency)</Label>
                <Input
                  id="entryFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  placeholder="Enter entry fee amount"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Teams & Players
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.map((team, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Team ${index + 1} name`}
                    value={team}
                    onChange={(e) => updateTeam(index, e.target.value)}
                  />
                  {teams.length > 2 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeTeam(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                {team.trim() && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Players for {team}</Label>
                    <PlayerInput 
                      teamName={team}
                      players={players[team] || []}
                      onUpdatePlayers={updatePlayers}
                    />
                  </div>
                )}
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={addTeam}
              className="w-full"
              disabled={format === 'tri-series' && teams.length >= 3}
            >
              Add Team
            </Button>

            {format === 'tri-series' && teams.length !== 3 && (
              <p className="text-sm text-amber-600">
                Tri-series requires exactly 3 teams
              </p>
            )}
          </CardContent>
        </Card>

        {/* Format Info */}
        <Card>
          <CardContent className="pt-6">
            {format === 'round-robin' && (
              <div className="text-sm text-muted-foreground">
                <strong>Round Robin:</strong> Each team plays every other team once. 
                Points: Win = 2, Tie = 1, Loss = 0
              </div>
            )}
            {format === 'tri-series' && (
              <div className="text-sm text-muted-foreground">
                <strong>Tri-Series:</strong> 3 teams play round-robin matches. 
                Each team plays the others multiple times.
              </div>
            )}
            {format === 'knockout' && (
              <div className="text-sm text-muted-foreground">
                <strong>Knockout:</strong> Single elimination tournament. 
                Lose once and you're out.
              </div>
            )}
            {format === 'league' && (
              <div className="text-sm text-muted-foreground">
                <strong>League:</strong> Teams play multiple rounds with playoffs. 
                Top teams advance to finals.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!isFormValid()}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-2" />
            {isEditing ? 'Update Tournament' : 'Create Tournament'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TournamentSetup;