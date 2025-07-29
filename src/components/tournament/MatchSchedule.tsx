import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Trophy, Play } from 'lucide-react';
import { Tournament, TournamentMatch } from '@/pages/Tournament';

interface MatchScheduleProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
}

const MatchSchedule = ({ tournament, onUpdateTournament }: MatchScheduleProps) => {
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [result, setResult] = useState({
    winner: '',
    team1Score: '',
    team2Score: '',
    margin: ''
  });

  const handleUpdateResult = () => {
    if (!selectedMatch || !result.winner) return;

    const updatedMatches = tournament.matches.map(match => 
      match.id === selectedMatch.id 
        ? { ...match, status: 'completed' as const, result }
        : match
    );

    // Update points table
    const updatedPointsTable = tournament.pointsTable.map(standing => {
      if (standing.team === result.winner) {
        return {
          ...standing,
          played: standing.played + 1,
          won: standing.won + 1,
          points: standing.points + 2
        };
      } else if (standing.team === selectedMatch.team1 || standing.team === selectedMatch.team2) {
        return {
          ...standing,
          played: standing.played + 1,
          lost: standing.lost + 1
        };
      }
      return standing;
    });

    const updatedTournament = {
      ...tournament,
      matches: updatedMatches,
      pointsTable: updatedPointsTable,
      status: updatedMatches.every(m => m.status === 'completed') ? 'completed' as const : 'ongoing' as const
    };

    onUpdateTournament(updatedTournament);
    setSelectedMatch(null);
    setResult({ winner: '', team1Score: '', team2Score: '', margin: '' });
  };

  const groupedMatches = tournament.matches.reduce((acc, match) => {
    const key = match.round || 'Round Robin';
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {} as Record<string, TournamentMatch[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedMatches).map(([round, matches]) => (
        <Card key={round}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {round}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matches.map((match) => (
                <div 
                  key={match.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Match {match.matchNumber}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3 h-3" />
                        {match.scheduledDate.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{match.team1}</div>
                        {match.result && (
                          <div className="text-sm text-muted-foreground">
                            {match.result.team1Score}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center text-muted-foreground">vs</div>
                      
                      <div>
                        <div className="font-medium">{match.team2}</div>
                        {match.result && (
                          <div className="text-sm text-muted-foreground">
                            {match.result.team2Score}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={
                      match.status === 'completed' ? 'default' :
                      match.status === 'ongoing' ? 'destructive' : 'secondary'
                    }>
                      {match.status}
                    </Badge>

                    {match.result && (
                      <div className="text-sm">
                        <div className="font-medium text-cricket-gold">
                          {match.result.winner} won
                        </div>
                        <div className="text-muted-foreground">
                          {match.result.margin}
                        </div>
                      </div>
                    )}

                    {match.status !== 'completed' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            className="bg-cricket-gold hover:bg-cricket-gold/90"
                            onClick={() => {
                              setSelectedMatch(match);
                              setResult({ winner: '', team1Score: '', team2Score: '', margin: '' });
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Score Match
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Match Result</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="font-medium">
                                {match.team1} vs {match.team2}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Match {match.matchNumber}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>{match.team1} Score</Label>
                                <Input
                                  placeholder="e.g. 180/5 (20)"
                                  value={result.team1Score}
                                  onChange={(e) => setResult(prev => ({ ...prev, team1Score: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>{match.team2} Score</Label>
                                <Input
                                  placeholder="e.g. 175/8 (20)"
                                  value={result.team2Score}
                                  onChange={(e) => setResult(prev => ({ ...prev, team2Score: e.target.value }))}
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Winner</Label>
                              <Select value={result.winner} onValueChange={(value) => setResult(prev => ({ ...prev, winner: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select winner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={match.team1}>{match.team1}</SelectItem>
                                  <SelectItem value={match.team2}>{match.team2}</SelectItem>
                                  <SelectItem value="tie">Tie</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Winning Margin</Label>
                              <Input
                                placeholder="e.g. 5 runs, 3 wickets"
                                value={result.margin}
                                onChange={(e) => setResult(prev => ({ ...prev, margin: e.target.value }))}
                              />
                            </div>

                            <Button 
                              onClick={handleUpdateResult}
                              disabled={!result.winner || !result.team1Score || !result.team2Score}
                              className="w-full"
                            >
                              <Trophy className="w-4 h-4 mr-2" />
                              Update Result
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MatchSchedule;