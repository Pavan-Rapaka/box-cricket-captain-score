import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Target, 
  Clock, 
  RotateCcw, 
  Users, 
  TrendingUp,
  Zap,
  AlertTriangle
} from 'lucide-react';
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

interface Bowler {
  name: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
}

interface LiveScoringProps {
  matchConfig: MatchConfig;
  onEndMatch: () => void;
}

const LiveScoring = ({ matchConfig, onEndMatch }: LiveScoringProps) => {
  const [currentInnings, setCurrentInnings] = useState(1);
  const [battingTeam, setBattingTeam] = useState(matchConfig.team1Name);
  const [bowlingTeam, setBowlingTeam] = useState(matchConfig.team2Name);
  
  const [team1Score, setTeam1Score] = useState(0);
  const [team1Wickets, setTeam1Wickets] = useState(0);
  const [team1Overs, setTeam1Overs] = useState(0);
  const [team1Balls, setTeam1Balls] = useState(0);
  
  const [team2Score, setTeam2Score] = useState(0);
  const [team2Wickets, setTeam2Wickets] = useState(0);
  const [team2Overs, setTeam2Overs] = useState(0);
  const [team2Balls, setTeam2Balls] = useState(0);

  const [striker, setStriker] = useState<Player>({
    name: matchConfig.team1Players[0] || 'Player 1',
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    isOnStrike: true
  });

  const [nonStriker, setNonStriker] = useState<Player>({
    name: matchConfig.team1Players[1] || 'Player 2',
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    isOnStrike: false
  });

  const [currentBowler, setCurrentBowler] = useState<Bowler>({
    name: currentInnings === 1 ? matchConfig.team2Players[0] || 'Bowler 1' : matchConfig.team1Players[0] || 'Bowler 1',
    overs: 0,
    balls: 0,
    runs: 0,
    wickets: 0
  });

  const [recentBalls, setRecentBalls] = useState<string[]>([]);

  const getCurrentTeamScore = () => currentInnings === 1 ? team1Score : team2Score;
  const getCurrentTeamWickets = () => currentInnings === 1 ? team1Wickets : team2Wickets;
  const getCurrentTeamOvers = () => currentInnings === 1 ? team1Overs : team2Overs;
  const getCurrentTeamBalls = () => currentInnings === 1 ? team1Balls : team2Balls;

  const updateScore = (runs: number, isBoundary: boolean = false, isWide: boolean = false, isNoBall: boolean = false) => {
    const newScore = getCurrentTeamScore() + runs;
    const newBalls = isWide || isNoBall ? getCurrentTeamBalls() : getCurrentTeamBalls() + 1;
    const newOvers = Math.floor(newBalls / 6);
    const remainingBalls = newBalls % 6;

    // Update team score
    if (currentInnings === 1) {
      setTeam1Score(newScore);
      setTeam1Balls(newBalls);
      setTeam1Overs(newOvers);
    } else {
      setTeam2Score(newScore);
      setTeam2Balls(newBalls);
      setTeam2Overs(newOvers);
    }

    // Update striker stats (only if not a wide)
    if (!isWide) {
      setStriker(prev => ({
        ...prev,
        runs: prev.runs + runs,
        balls: prev.balls + 1,
        fours: prev.fours + (runs === 4 ? 1 : 0),
        sixes: prev.sixes + (runs === 6 ? 1 : 0)
      }));
    }

    // Update bowler stats
    setCurrentBowler(prev => ({
      ...prev,
      runs: prev.runs + runs,
      balls: isWide || isNoBall ? prev.balls : prev.balls + 1,
      overs: Math.floor((isWide || isNoBall ? prev.balls : prev.balls + 1) / 6)
    }));

    // Add to recent balls
    let ballDesc = runs.toString();
    if (isBoundary && runs === 4) ballDesc = '4';
    if (isBoundary && runs === 6) ballDesc = '6';
    if (isWide) ballDesc = 'Wd';
    if (isNoBall) ballDesc = 'Nb';
    
    setRecentBalls(prev => [ballDesc, ...prev.slice(0, 5)]);

    // Rotate strike for odd runs (unless boundary)
    if (runs % 2 === 1 && !isBoundary) {
      setStriker(prev => ({ ...prev, isOnStrike: false }));
      setNonStriker(prev => ({ ...prev, isOnStrike: true }));
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
    }

    // Check if over is complete
    if (remainingBalls === 0 && !isWide && !isNoBall) {
      // Rotate strike at end of over
      setStriker(prev => ({ ...prev, isOnStrike: false }));
      setNonStriker(prev => ({ ...prev, isOnStrike: true }));
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
    }
  };

  const handleWicket = () => {
    const newWickets = getCurrentTeamWickets() + 1;
    
    if (currentInnings === 1) {
      setTeam1Wickets(newWickets);
    } else {
      setTeam2Wickets(newWickets);
    }

    setCurrentBowler(prev => ({ ...prev, wickets: prev.wickets + 1 }));
    setRecentBalls(prev => ['W', ...prev.slice(0, 5)]);

    // Mark striker as out
    setStriker(prev => ({ ...prev, isOut: true }));
    
    // Check if innings should end
    if (newWickets >= matchConfig.wickets || getCurrentTeamOvers() >= matchConfig.overs) {
      if (currentInnings === 1) {
        // Switch innings
        setCurrentInnings(2);
        setBattingTeam(matchConfig.team2Name);
        setBowlingTeam(matchConfig.team1Name);
        // Reset players for second innings
        setStriker({
          name: matchConfig.team2Players[0] || 'Player 1',
          runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: true
        });
        setNonStriker({
          name: matchConfig.team2Players[1] || 'Player 2',
          runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: false
        });
        setCurrentBowler({
          name: matchConfig.team1Players[0] || 'Bowler 1',
          overs: 0, balls: 0, runs: 0, wickets: 0
        });
      } else {
        // Match finished
        onEndMatch();
      }
    }
  };

  const getRequiredRunRate = () => {
    if (currentInnings === 1) return 0;
    const target = team1Score + 1;
    const remaining = getCurrentTeamScore();
    const ballsLeft = (matchConfig.overs * 6) - getCurrentTeamBalls();
    const oversLeft = ballsLeft / 6;
    return oversLeft > 0 ? ((target - remaining) / oversLeft).toFixed(2) : 0;
  };

  const getCurrentRunRate = () => {
    const score = getCurrentTeamScore();
    const overs = getCurrentTeamOvers() + (getCurrentTeamBalls() % 6) / 6;
    return overs > 0 ? (score / overs).toFixed(2) : '0.00';
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                <h1 className="text-xl font-bold">Live Cricket Match</h1>
              </div>
              <Badge variant="secondary">
                Innings {currentInnings}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Main Scoreboard */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{battingTeam}</h2>
                <p className="text-muted-foreground">vs {bowlingTeam}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {getCurrentTeamScore()}/{getCurrentTeamWickets()}
                </div>
                <div className="text-lg text-muted-foreground">
                  {getCurrentTeamOvers()}.{getCurrentTeamBalls() % 6} overs
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Current RR: {getCurrentRunRate()}</span>
                </div>
                {currentInnings === 2 && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">Required RR: {getRequiredRunRate()}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm">Recent balls:</div>
                <div className="flex gap-1">
                  {recentBalls.map((ball, index) => (
                    <Badge 
                      key={index} 
                      variant={ball === 'W' ? 'destructive' : ball === '4' || ball === '6' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ball}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Current Players */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-accent">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Current Batsmen</h3>
                    <Users className="w-4 h-4" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className={`p-2 rounded ${striker.isOnStrike ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <div className="flex justify-between">
                        <span className="font-medium">{striker.name}</span>
                        {striker.isOnStrike && <Zap className="w-4 h-4" />}
                      </div>
                      <div className="text-sm">
                        {striker.runs} ({striker.balls}) • 4s: {striker.fours} • 6s: {striker.sixes}
                      </div>
                    </div>
                    
                    <div className={`p-2 rounded ${nonStriker.isOnStrike ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <div className="flex justify-between">
                        <span className="font-medium">{nonStriker.name}</span>
                        {nonStriker.isOnStrike && <Zap className="w-4 h-4" />}
                      </div>
                      <div className="text-sm">
                        {nonStriker.runs} ({nonStriker.balls}) • 4s: {nonStriker.fours} • 6s: {nonStriker.sixes}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Current Bowler</h3>
                    <Target className="w-4 h-4" />
                  </div>
                  
                  <div className="p-2 bg-muted rounded">
                    <div className="font-medium">{currentBowler.name}</div>
                    <div className="text-sm">
                      {currentBowler.overs}.{currentBowler.balls % 6} overs • 
                      {currentBowler.runs} runs • 
                      {currentBowler.wickets} wickets
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Buttons */}
        <div className="grid grid-cols-4 gap-3">
          {/* Runs */}
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
          
          {/* Boundaries */}
          <Button
            variant="default"
            size="lg"
            onClick={() => updateScore(4, true)}
            className="h-16 text-lg font-semibold bg-cricket-boundary text-white col-span-2"
          >
            FOUR
          </Button>
          
          <Button
            variant="default"
            size="lg"
            onClick={() => updateScore(6, true)}
            className="h-16 text-lg font-semibold bg-cricket-six text-white col-span-2"
          >
            SIX
          </Button>

          {/* Extras & Wicket */}
          <Button
            variant="outline"
            onClick={() => updateScore(1, false, true)}
            className="h-12"
          >
            Wide
          </Button>
          <Button
            variant="outline"
            onClick={() => updateScore(1, false, false, true)}
            className="h-12"
          >
            No Ball
          </Button>
          <Button
            variant="outline"
            onClick={() => updateScore(1)}
            className="h-12"
          >
            Bye
          </Button>
          <Button
            variant="destructive"
            onClick={handleWicket}
            className="h-12 font-semibold"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            WICKET
          </Button>
        </div>

        {/* Match Status */}
        {currentInnings === 2 && (
          <Card className="bg-accent">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Target</div>
                <div className="text-2xl font-bold">{team1Score + 1}</div>
                <div className="text-sm">
                  {team2Score < team1Score + 1 
                    ? `${(team1Score + 1) - team2Score} runs needed` 
                    : team2Score >= team1Score + 1 
                    ? `${matchConfig.team2Name} wins!` 
                    : 'Match tied!'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Undo
          </Button>
          <Button variant="outline" onClick={onEndMatch} className="flex-1">
            End Match
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveScoring;