import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trophy, Target, Users, AlertTriangle, Zap, Camera, BarChart3 } from 'lucide-react';
import { Tournament, TournamentMatch } from '@/pages/Tournament';

interface Player {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  isOnStrike: boolean;
  dismissalType?: string;
  dismissedBy?: string;
  fielder?: string;
}

interface BowlerStats {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  ballsBowled: number;
}

interface FantasyPoints {
  playerName: string;
  team: string;
  runs: number;
  boundaries: number;
  sixes: number;
  wickets: number;
  catches: number;
  runOuts: number;
  totalPoints: number;
}

interface TournamentLiveScoringProps {
  match: TournamentMatch;
  tournament: Tournament;
  onMatchComplete: (match: TournamentMatch, fantasyPoints: FantasyPoints[]) => void;
  onBack: () => void;
}

const TournamentLiveScoring = ({ match, tournament, onMatchComplete, onBack }: TournamentLiveScoringProps) => {
  const [currentInnings, setCurrentInnings] = useState(1);
  const [battingTeam, setBattingTeam] = useState(match.team1);
  const [showWicketDialog, setShowWicketDialog] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [showBatsmanSelect, setShowBatsmanSelect] = useState(true);
  const [showNewBatsmanSelect, setShowNewBatsmanSelect] = useState(false);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [currentBowler, setCurrentBowler] = useState('');
  const [previousBowler, setPreviousBowler] = useState('');
  
  // Score state
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [balls, setBalls] = useState(0);
  
  // First innings score
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [firstInningsWickets, setFirstInningsWickets] = useState(0);

  // Player state
  const team1Players = tournament.players[match.team1] || [];
  const team2Players = tournament.players[match.team2] || [];
  
  const [striker, setStriker] = useState<Player>({
    name: team1Players[0] || 'Player 1',
    runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: true
  });

  const [nonStriker, setNonStriker] = useState<Player>({
    name: team1Players[1] || 'Player 2',
    runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: false
  });

  const [nextPlayerIndex, setNextPlayerIndex] = useState(2);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [bowlerStats, setBowlerStats] = useState<BowlerStats[]>([]);
  const [fantasyPoints, setFantasyPoints] = useState<FantasyPoints[]>([]);
  
  // Fantasy points calculation
  const calculateFantasyPoints = (player: Player, isWicketkeeper = false): number => {
    let points = 0;
    
    // Batting points
    points += player.runs; // 1 point per run
    points += player.fours * 1; // 1 extra point per boundary
    points += player.sixes * 2; // 2 extra points per six
    
    // Milestones
    if (player.runs >= 30) points += 4;
    if (player.runs >= 50) points += 8;
    if (player.runs >= 100) points += 16;
    
    // Strike rate bonus (if faced at least 10 balls)
    if (player.balls >= 10) {
      const strikeRate = (player.runs / player.balls) * 100;
      if (strikeRate >= 170) points += 6;
      else if (strikeRate >= 150) points += 4;
      else if (strikeRate >= 130) points += 2;
      else if (strikeRate < 70) points -= 2;
      else if (strikeRate < 50) points -= 4;
    }
    
    return points;
  };

  const calculateBowlingFantasyPoints = (bowler: BowlerStats): number => {
    let points = 0;
    
    // Bowling points
    points += bowler.wickets * 25; // 25 points per wicket
    points += bowler.maidens * 12; // 12 points per maiden
    
    // Economy rate bonus/penalty (if bowled at least 2 overs)
    if (bowler.overs >= 2) {
      const economy = bowler.runs / bowler.overs;
      if (economy <= 5) points += 6;
      else if (economy <= 6) points += 4;
      else if (economy <= 7) points += 2;
      else if (economy >= 10) points -= 2;
      else if (economy >= 11) points -= 4;
      else if (economy >= 12) points -= 6;
    }
    
    // Wicket milestones
    if (bowler.wickets >= 3) points += 4;
    if (bowler.wickets >= 5) points += 8;
    
    return points;
  };

  const updateScore = (runs: number, isBoundary = false, isExtra = false) => {
    if (!currentBowler || showBatsmanSelect) {
      if (showBatsmanSelect) return;
      setShowBowlerSelect(true);
      return;
    }
    
    const newScore = score + runs;
    const newBalls = isExtra ? balls : balls + 1;
    const newOvers = Math.floor(newBalls / 6);
    const ballsInOver = newBalls % 6;

    setScore(newScore);
    setBalls(newBalls);
    setOvers(newOvers);

    // Update striker stats
    if (!isExtra) {
      setStriker(prev => ({
        ...prev,
        runs: prev.runs + runs,
        balls: prev.balls + 1,
        fours: prev.fours + (runs === 4 ? 1 : 0),
        sixes: prev.sixes + (runs === 6 ? 1 : 0)
      }));

      // Rotate strike for odd runs
      if (runs % 2 === 1 && !isBoundary && !striker.isOut && !nonStriker.isOut) {
        const temp = striker;
        setStriker({ ...nonStriker, isOnStrike: true });
        setNonStriker({ ...temp, isOnStrike: false });
      }
    }

    // Update bowler stats
    setBowlerStats(prev => prev.map(bowler => 
      bowler.name === currentBowler 
        ? { ...bowler, runs: bowler.runs + runs, ballsBowled: bowler.ballsBowled + (isExtra ? 0 : 1) }
        : bowler
    ));

    // Check if over is complete
    if (ballsInOver === 0 && !isExtra) {
      // Rotate strike at end of over
      if (!striker.isOut && !nonStriker.isOut) {
        const temp = striker;
        setStriker({ ...nonStriker, isOnStrike: true });
        setNonStriker({ ...temp, isOnStrike: false });
      }
      
      // Update bowler overs
      setBowlerStats(prev => prev.map(bowler => 
        bowler.name === currentBowler 
          ? { ...bowler, overs: bowler.overs + 1 }
          : bowler
      ));
      
      setPreviousBowler(currentBowler);
      setCurrentBowler('');
      setShowBowlerSelect(true);
    }

    // Check if innings should end (20 overs for T20)
    if (newOvers >= 20) {
      if (currentInnings === 1) {
        setFirstInningsScore(newScore);
        setFirstInningsWickets(wickets);
        setShowInningsBreak(true);
      } else {
        finishMatch();
      }
    }
    
    // Check if target is chased
    if (currentInnings === 2 && newScore > firstInningsScore) {
      finishMatch();
    }
  };

  const handleWicket = () => {
    setShowWicketDialog(true);
  };

  const processWicket = (dismissalType: string, fielder?: string) => {
    const newWickets = wickets + 1;
    setWickets(newWickets);
    
    let dismissedBy = currentBowler;
    if (dismissalType === 'Run Out') {
      dismissedBy = fielder || 'Unknown';
    } else if (dismissalType === 'Stumped') {
      dismissedBy = `${fielder || 'Keeper'} (b ${currentBowler})`;
    }
    
    setStriker(prev => ({
      ...prev,
      isOut: true,
      dismissalType,
      dismissedBy: dismissedBy,
      fielder: fielder
    }));
    
    // Update bowler stats for wicket
    if (dismissalType !== 'Run Out') {
      setBowlerStats(prev => prev.map(bowler => 
        bowler.name === currentBowler 
          ? { ...bowler, wickets: bowler.wickets + 1 }
          : bowler
      ));
    }
    
    setAllPlayers(prev => [...prev, { ...striker, isOut: true, dismissalType, dismissedBy, fielder }]);
    setShowWicketDialog(false);
    
    // Check if innings should end
    if (newWickets >= 10) {
      if (currentInnings === 1) {
        setFirstInningsScore(score);
        setFirstInningsWickets(newWickets);
        setShowInningsBreak(true);
      } else {
        finishMatch();
      }
    } else {
      const currentPlayers = battingTeam === match.team1 ? team1Players : team2Players;
      if (nextPlayerIndex < currentPlayers.length) {
        setShowNewBatsmanSelect(true);
      }
    }
  };

  const startSecondInnings = () => {
    setCurrentInnings(2);
    setBattingTeam(match.team2);
    
    // Reset for second innings
    setScore(0);
    setWickets(0);
    setOvers(0);
    setBalls(0);
    setNextPlayerIndex(2);
    setCurrentBowler('');
    setPreviousBowler('');
    setAllPlayers([]);
    setBowlerStats([]);
    setShowBatsmanSelect(true);
    
    setStriker({
      name: team2Players[0] || 'Player 1',
      runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: true
    });
    setNonStriker({
      name: team2Players[1] || 'Player 2',
      runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: false
    });
    
    setShowInningsBreak(false);
  };

  const finishMatch = () => {
    // Calculate fantasy points for all players
    const allMatchPlayers = [...allPlayers, striker, nonStriker];
    const fantasyData: FantasyPoints[] = [];
    
    // Add batting fantasy points
    allMatchPlayers.forEach(player => {
      if (player.balls > 0) {
        fantasyData.push({
          playerName: player.name,
          team: battingTeam,
          runs: player.runs,
          boundaries: player.fours,
          sixes: player.sixes,
          wickets: 0,
          catches: 0,
          runOuts: 0,
          totalPoints: calculateFantasyPoints(player)
        });
      }
    });
    
    // Add bowling fantasy points
    bowlerStats.forEach(bowler => {
      const existing = fantasyData.find(p => p.playerName === bowler.name);
      const bowlingPoints = calculateBowlingFantasyPoints(bowler);
      
      if (existing) {
        existing.wickets = bowler.wickets;
        existing.totalPoints += bowlingPoints;
      } else {
        fantasyData.push({
          playerName: bowler.name,
          team: battingTeam === match.team1 ? match.team2 : match.team1,
          runs: 0,
          boundaries: 0,
          sixes: 0,
          wickets: bowler.wickets,
          catches: 0,
          runOuts: 0,
          totalPoints: bowlingPoints
        });
      }
    });
    
    setFantasyPoints(fantasyData);
    setMatchComplete(true);
    setShowMatchResult(true);
  };

  const getMatchResult = () => {
    if (currentInnings === 1) return "First innings complete";
    
    const target = firstInningsScore + 1;
    if (score >= target) {
      return `${battingTeam} wins by ${10 - wickets} wickets!`;
    } else {
      const margin = firstInningsScore - score;
      return `${match.team1} wins by ${margin} runs!`;
    }
  };

  const handleMatchComplete = () => {
    const completedMatch: TournamentMatch = {
      ...match,
      status: 'completed',
      result: {
        winner: score >= firstInningsScore + 1 ? battingTeam : (battingTeam === match.team1 ? match.team2 : match.team1),
        team1Score: currentInnings === 1 ? `${score}/${wickets} (${overs}.${balls % 6})` : `${firstInningsScore}/${firstInningsWickets}`,
        team2Score: currentInnings === 2 ? `${score}/${wickets} (${overs}.${balls % 6})` : '',
        margin: currentInnings === 2 ? (score >= firstInningsScore + 1 ? `${10 - wickets} wickets` : `${firstInningsScore - score} runs`) : ''
      }
    };
    
    onMatchComplete(completedMatch, fantasyPoints);
  };

  if (showMatchResult) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-cricket-gold" />
            Match Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-muted rounded-lg">
            <h3 className="text-2xl font-bold mb-2">{getMatchResult()}</h3>
            <div className="text-lg">
              {match.team1}: {currentInnings === 1 ? `${score}/${wickets}` : `${firstInningsScore}/${firstInningsWickets}`}
            </div>
            <div className="text-lg">
              {match.team2}: {currentInnings === 2 ? `${score}/${wickets}` : 'Yet to bat'}
            </div>
          </div>

          {fantasyPoints.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Fantasy Points
              </h4>
              <div className="grid gap-3">
                {fantasyPoints.sort((a, b) => b.totalPoints - a.totalPoints).map((player, index) => (
                  <div key={player.playerName} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{player.playerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.runs > 0 && `${player.runs} runs`}
                        {player.wickets > 0 && ` • ${player.wickets} wickets`}
                        {player.boundaries > 0 && ` • ${player.boundaries} 4s`}
                        {player.sixes > 0 && ` • ${player.sixes} 6s`}
                      </div>
                    </div>
                    <Badge variant={index < 3 ? 'default' : 'secondary'}>
                      {player.totalPoints} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleMatchComplete} className="flex-1">
              Save Match Result
            </Button>
            <Button variant="outline" onClick={onBack}>
              Back to Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showInningsBreak) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Innings Break</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="text-xl font-bold mb-2">First Innings Complete</h3>
            <p className="text-lg">{match.team1}: {firstInningsScore}/{firstInningsWickets}</p>
            <p className="text-muted-foreground">Target: {firstInningsScore + 1} runs</p>
          </div>
          <Button onClick={startSecondInnings} className="w-full">
            Start Second Innings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6" />
                Live Scoring - Match {match.matchNumber}
              </CardTitle>
              <p className="text-muted-foreground">
                {match.team1} vs {match.team2} • Innings {currentInnings}
              </p>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Score Display */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <h2 className="text-4xl font-bold">{score}/{wickets}</h2>
              <p className="text-xl text-muted-foreground">{overs}.{balls % 6} overs</p>
              {currentInnings === 2 && (
                <p className="text-lg">Target: {firstInningsScore + 1} | Need: {Math.max(0, firstInningsScore + 1 - score)} runs</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{striker.name} *</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {striker.runs} ({striker.balls}) • {striker.fours}×4, {striker.sixes}×6
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="font-medium">{nonStriker.name}</div>
                <p className="text-sm text-muted-foreground">
                  {nonStriker.runs} ({nonStriker.balls}) • {nonStriker.fours}×4, {nonStriker.sixes}×6
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[0, 1, 2, 3, 4, 6].map(runs => (
              <Button
                key={runs}
                onClick={() => updateScore(runs, runs === 4 || runs === 6)}
                variant={runs === 0 ? 'outline' : 'default'}
                size="lg"
                className="h-12"
              >
                {runs}
              </Button>
            ))}
            <Button onClick={handleWicket} variant="destructive" size="lg" className="h-12">
              Wicket
            </Button>
            <Button onClick={() => updateScore(1, false, true)} variant="outline" size="lg" className="h-12">
              Wide
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => updateScore(1, false, true)} variant="outline">
              No Ball
            </Button>
            <Button onClick={() => updateScore(1, false, true)} variant="outline">
              Bye
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showBowlerSelect} onOpenChange={setShowBowlerSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Bowler</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={currentBowler} onValueChange={setCurrentBowler}>
              <SelectTrigger>
                <SelectValue placeholder="Choose bowler" />
              </SelectTrigger>
              <SelectContent>
                {(battingTeam === match.team1 ? team2Players : team1Players)
                  .filter(player => player !== previousBowler)
                  .map(player => (
                    <SelectItem key={player} value={player}>{player}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                if (currentBowler) {
                  if (!bowlerStats.find(b => b.name === currentBowler)) {
                    setBowlerStats(prev => [...prev, {
                      name: currentBowler,
                      overs: 0, maidens: 0, runs: 0, wickets: 0, ballsBowled: 0
                    }]);
                  }
                  setShowBowlerSelect(false);
                }
              }}
              disabled={!currentBowler}
              className="w-full"
            >
              Confirm Bowler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentLiveScoring;