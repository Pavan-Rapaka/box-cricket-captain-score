import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trophy, Users, Calendar as CalendarIcon, ArrowLeft, Target } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { Tournament, TournamentMatch } from '@/pages/Tournament';

interface TournamentSetupProps {
  onCreateTournament: (tournament: Tournament) => void;
  onCancel: () => void;
}

const TournamentSetup = ({ onCreateTournament, onCancel }: TournamentSetupProps) => {
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'round-robin' | 'knockout' | 'league' | 'tri-series'>('round-robin');
  const [teams, setTeams] = useState<string[]>(['', '']);
  const [startDate, setStartDate] = useState<Date>();

  const addTeam = () => {
    setTeams(prev => [...prev, '']);
  };

  const updateTeam = (index: number, value: string) => {
    const newTeams = [...teams];
    newTeams[index] = value;
    setTeams(newTeams);
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

    const tournament: Tournament = {
      id: `tournament-${Date.now()}`,
      name,
      format,
      teams: validTeams,
      status: 'setup',
      startDate,
      matches,
      pointsTable: validTeams.map(team => ({
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

    onCreateTournament(tournament);
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
            <h1 className="text-2xl font-bold text-foreground">Create Tournament</h1>
            <p className="text-muted-foreground">Set up a new cricket tournament</p>
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

        {/* Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.map((team, index) => (
              <div key={index} className="flex gap-2">
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
            Create Tournament
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TournamentSetup;