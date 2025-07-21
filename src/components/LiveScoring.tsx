import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Trophy, Target, Users, AlertTriangle, Zap } from 'lucide-react';
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
  
  // Score state
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [balls, setBalls] = useState(0);

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
    }

    // Check if innings should end
    if (newOvers >= matchConfig.overs) {
      if (currentInnings === 1) {
        startSecondInnings();
      } else {
        onEndMatch();
      }
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
        startSecondInnings();
      } else {
        onEndMatch();
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
                <div>Last Man Stands: {matchConfig.lastManStands ? 'Yes' : 'No'}</div>
                {currentInnings === 1 && (
                  <div className="text-muted-foreground">
                    {Math.max(0, matchConfig.overs - overs)} overs remaining
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
            {/* Run buttons */}
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((runs) => (
                <Button
                  key={runs}
                  variant="outline"
                  size="lg"
                  onClick={() => updateScore(runs)}
                  className="h-16 text-lg font-semibold"
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
              >
                FOUR
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={() => updateScore(6, true)}
                className="h-16 text-lg font-semibold"
              >
                SIX
              </Button>
            </div>

            {/* Extras and Wicket */}
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => updateScore(1, false, true)}
              >
                Wide
              </Button>
              <Button
                variant="outline"
                onClick={() => updateScore(1, false, true)}
              >
                No Ball
              </Button>
              <Button
                variant="outline"
                onClick={() => updateScore(1)}
              >
                Bye
              </Button>
              <Button
                variant="destructive"
                onClick={handleWicket}
                className="font-semibold"
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
      </div>
    </div>
  );
};

export default LiveScoring;