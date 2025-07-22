import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trophy, Target, Users, AlertTriangle, Zap, Camera } from 'lucide-react';
import { MatchConfig } from './MatchSetup';

interface Player {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  isOnStrike: boolean;
}

interface LiveScoringProps {
  matchConfig: MatchConfig;
  onEndMatch: () => void;
}

const LiveScoring = ({ matchConfig, onEndMatch }: LiveScoringProps) => {
  const [currentInnings, setCurrentInnings] = useState(1);
  const [battingTeam, setBattingTeam] = useState(matchConfig.firstBatting);
  const [showWicketDialog, setShowWicketDialog] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showBowlerSelect, setShowBowlerSelect] = useState(true); // Show at start
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [currentBowler, setCurrentBowler] = useState('');
  const [matchComplete, setMatchComplete] = useState(false);
  
  // Score state
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [balls, setBalls] = useState(0);
  
  // First innings score for target calculation
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [firstInningsWickets, setFirstInningsWickets] = useState(0);

  // Player state
  const [striker, setStriker] = useState<Player>({
    name: matchConfig.firstBatting === matchConfig.team1Name 
      ? matchConfig.team1Players[0] || 'Player 1'
      : matchConfig.team2Players[0] || 'Player 1',
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    isOnStrike: true
  });

  const [nonStriker, setNonStriker] = useState<Player>({
    name: matchConfig.firstBatting === matchConfig.team1Name 
      ? matchConfig.team1Players[1] || 'Player 2'
      : matchConfig.team2Players[1] || 'Player 2',
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    isOnStrike: false
  });

  const [nextPlayerIndex, setNextPlayerIndex] = useState(2);

  const updateScore = (runs: number, isBoundary = false, isExtra = false) => {
    // Prevent scoring if no bowler is selected
    if (!currentBowler) {
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

    // Update striker stats (only if not an extra)
    if (!isExtra) {
      setStriker(prev => ({
        ...prev,
        runs: prev.runs + runs,
        balls: prev.balls + 1,
        fours: prev.fours + (runs === 4 ? 1 : 0),
        sixes: prev.sixes + (runs === 6 ? 1 : 0)
      }));

      // Rotate strike for odd runs (unless boundary)
      if (runs % 2 === 1 && !isBoundary) {
        const temp = striker;
        setStriker({ ...nonStriker, isOnStrike: true });
        setNonStriker({ ...temp, isOnStrike: false });
      }
    }

    // Check if over is complete
    if (ballsInOver === 0 && !isExtra) {
      // Rotate strike at end of over
      const temp = striker;
      setStriker({ ...nonStriker, isOnStrike: true });
      setNonStriker({ ...temp, isOnStrike: false });
      
      // Show bowler selection dialog
      setShowBowlerSelect(true);
    }

    // Check if innings should end
    if (newOvers >= matchConfig.overs) {
      if (currentInnings === 1) {
        setFirstInningsScore(newScore);
        setFirstInningsWickets(wickets);
        setShowInningsBreak(true);
      } else {
        finishMatch();
      }
    }
    
    // Check if target is chased in second innings
    if (currentInnings === 2 && newScore > firstInningsScore) {
      finishMatch();
    }
  };

  const handleWicket = () => {
    setShowWicketDialog(true);
  };

  const processWicket = (dismissalType: string) => {
    const newWickets = wickets + 1;
    setWickets(newWickets);
    
    // Get next player
    const currentPlayers = matchConfig.firstBatting === matchConfig.team1Name 
      ? matchConfig.team1Players 
      : matchConfig.team2Players;
    
    if (nextPlayerIndex < currentPlayers.length && newWickets < matchConfig.wickets) {
      setStriker({
        name: currentPlayers[nextPlayerIndex],
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        isOnStrike: true
      });
      setNextPlayerIndex(prev => prev + 1);
    }
    
    setShowWicketDialog(false);
    
    // Check if innings should end
    if (newWickets >= matchConfig.wickets) {
      if (currentInnings === 1) {
        setFirstInningsScore(score);
        setFirstInningsWickets(newWickets);
        setShowInningsBreak(true);
      } else {
        finishMatch();
      }
    }
  };

  const startSecondInnings = () => {
    setCurrentInnings(2);
    setBattingTeam(matchConfig.firstBatting === matchConfig.team1Name 
      ? matchConfig.team2Name 
      : matchConfig.team1Name);
    
    // Reset everything for second innings
    setScore(0);
    setWickets(0);
    setOvers(0);
    setBalls(0);
    setNextPlayerIndex(2);
    setCurrentBowler('');
    setShowBowlerSelect(true); // Show bowler selection for second innings
    
    const newBattingPlayers = matchConfig.firstBatting === matchConfig.team1Name 
      ? matchConfig.team2Players 
      : matchConfig.team1Players;
    
    setStriker({
      name: newBattingPlayers[0] || 'Player 1',
      runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: true
    });
    setNonStriker({
      name: newBattingPlayers[1] || 'Player 2',
      runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: false
    });
    
    setShowInningsBreak(false);
  };

  const finishMatch = () => {
    setMatchComplete(true);
    setShowMatchResult(true);
  };

  const getMatchResult = () => {
    if (currentInnings === 1) return "Match in progress";
    
    const target = firstInningsScore + 1;
    const currentTeam = battingTeam;
    const opponentTeam = battingTeam === matchConfig.team1Name ? matchConfig.team2Name : matchConfig.team1Name;
    
    if (score >= target) {
      return `${currentTeam} wins by ${matchConfig.wickets - wickets} wickets!`;
    } else if (overs >= matchConfig.overs || wickets >= matchConfig.wickets) {
      const margin = firstInningsScore - score;
      return `${opponentTeam} wins by ${margin} runs!`;
    }
    
    return "Match in progress";
  };

  const getBowlingTeamPlayers = () => {
    return battingTeam === matchConfig.team1Name 
      ? matchConfig.team2Players 
      : matchConfig.team1Players;
  };

  const dismissalTypes = [
    'Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'
  ];

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onEndMatch}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            End Match
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{matchConfig.team1Name} vs {matchConfig.team2Name}</h1>
            <Badge variant="secondary">Innings {currentInnings}</Badge>
          </div>
          <div className="w-20" />
        </div>

        {/* Toss Info */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center text-sm">
              <strong>{matchConfig.tossWinner}</strong> won the toss and chose to{' '}
              {matchConfig.firstBatting === matchConfig.tossWinner ? 'bat' : 'bowl'} first
            </div>
          </CardContent>
        </Card>

        {/* Main Scoreboard */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{battingTeam}</h2>
                <p className="text-muted-foreground">Batting</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {score}/{wickets}
                </div>
                <div className="text-lg text-muted-foreground">
                  {overs}.{balls % 6} overs
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Players */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Batsmen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`p-3 rounded ${striker.isOnStrike ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{striker.name}</span>
                  {striker.isOnStrike && <Zap className="w-4 h-4" />}
                </div>
                <div className="text-sm">
                  {striker.runs} ({striker.balls}) • 4s: {striker.fours} • 6s: {striker.sixes}
                </div>
              </div>
              
              <div className={`p-3 rounded ${nonStriker.isOnStrike ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{nonStriker.name}</span>
                  {nonStriker.isOnStrike && <Zap className="w-4 h-4" />}
                </div>
                <div className="text-sm">
                  {nonStriker.runs} ({nonStriker.balls}) • 4s: {nonStriker.fours} • 6s: {nonStriker.sixes}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Match Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>Overs: {matchConfig.overs}</div>
                <div>Max Wickets: {matchConfig.wickets}</div>
                <div>Current Bowler: {currentBowler || 'Not selected'}</div>
                {currentInnings === 2 && (
                  <div className="text-primary font-semibold">
                    Target: {firstInningsScore + 1} runs
                  </div>
                )}
                {currentInnings === 1 && (
                  <div className="text-muted-foreground">
                    {Math.max(0, matchConfig.overs - overs)} overs remaining
                  </div>
                )}
                {currentInnings === 2 && (
                  <div className="text-muted-foreground">
                    Need {Math.max(0, firstInningsScore + 1 - score)} runs from {Math.max(0, (matchConfig.overs - overs) * 6 - (balls % 6))} balls
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoring Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentBowler && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-center">
                Please select a bowler before scoring
              </div>
            )}
            {/* Run buttons */}
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((runs) => (
                <Button
                  key={runs}
                  variant="outline"
                  size="lg"
                  onClick={() => updateScore(runs)}
                  className="h-16 text-lg font-semibold"
                  disabled={!currentBowler}
                >
                  {runs}
                </Button>
              ))}
            </div>
            
            {/* Boundaries */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="default"
                size="lg"
                onClick={() => updateScore(4, true)}
                className="h-16 text-lg font-semibold"
                disabled={!currentBowler}
              >
                FOUR
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={() => updateScore(6, true)}
                className="h-16 text-lg font-semibold"
                disabled={!currentBowler}
              >
                SIX
              </Button>
            </div>

            {/* Extras and Wicket */}
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => updateScore(1, false, true)}
                disabled={!currentBowler}
              >
                Wide
              </Button>
              <Button
                variant="outline"
                onClick={() => updateScore(1, false, true)}
                disabled={!currentBowler}
              >
                No Ball
              </Button>
              <Button
                variant="outline"
                onClick={() => updateScore(1)}
                disabled={!currentBowler}
              >
                Bye
              </Button>
              <Button
                variant="destructive"
                onClick={handleWicket}
                className="font-semibold"
                disabled={!currentBowler}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                WICKET
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Wicket Dialog */}
        <Dialog open={showWicketDialog} onOpenChange={setShowWicketDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How was {striker.name} dismissed?</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {dismissalTypes.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  onClick={() => processWicket(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Innings Break Dialog */}
        <Dialog open={showInningsBreak} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">End of First Innings</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold">
                {matchConfig.firstBatting}: {firstInningsScore}/{firstInningsWickets}
              </div>
              <div className="text-lg">
                Target: {firstInningsScore + 1} runs
              </div>
              <div className="text-muted-foreground">
                {battingTeam === matchConfig.team1Name ? matchConfig.team2Name : matchConfig.team1Name} needs {firstInningsScore + 1} runs to win
              </div>
              <Button onClick={startSecondInnings} className="w-full">
                Start Second Innings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bowler Selection Dialog */}
        <Dialog open={showBowlerSelect} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {balls === 0 ? 'Select Bowler to Start' : 'Select Bowler for Next Over'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select onValueChange={(value) => setCurrentBowler(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose bowler" />
                </SelectTrigger>
                <SelectContent>
                  {getBowlingTeamPlayers().map((player) => (
                    <SelectItem key={player} value={player}>
                      {player}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setShowBowlerSelect(false)} 
                className="w-full"
                disabled={!currentBowler}
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Match Result Dialog */}
        <Dialog open={showMatchResult} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Match Complete!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-6">
              <div className="text-2xl font-bold text-primary">
                {getMatchResult()}
              </div>
              
              <div className="space-y-2">
                <div className="text-lg">Final Scores:</div>
                <div>{matchConfig.firstBatting}: {firstInningsScore}/{firstInningsWickets}</div>
                <div>{battingTeam}: {score}/{wickets}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline">
                  View Stats
                </Button>
              </div>
              
              <Button onClick={onEndMatch} className="w-full">
                New Match
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LiveScoring;