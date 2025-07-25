import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trophy, Target, Users, AlertTriangle, Zap, Camera, BarChart3 } from 'lucide-react';
import { MatchConfig } from './MatchSetup';
import Scoreboard from './Scoreboard';

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

interface InningsData {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: number;
  declared: boolean;
  allOut: boolean;
  team: string;
  players: Player[];
  bowlerStats: BowlerStats[];
}

interface MatchState {
  format: string;
  innings: InningsData[];
  currentInnings: number;
  battingTeam: string;
  result?: string;
  superOverData?: {
    team1Score: number;
    team2Score: number;
    team1Boundaries: number;
    team2Boundaries: number;
  };
}

interface BowlerStats {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  ballsBowled: number;
}

interface WicketDetails {
  dismissalType: string;
  bowler: string;
  fielder?: string;
}

interface LiveScoringProps {
  matchConfig: MatchConfig;
  onEndMatch: () => void;
}

const LiveScoring = ({ matchConfig, onEndMatch }: LiveScoringProps) => {
  const [matchState, setMatchState] = useState<MatchState>({
    format: matchConfig.format,
    innings: [],
    currentInnings: 1,
    battingTeam: matchConfig.firstBatting,
  });
  
  const [currentInnings, setCurrentInnings] = useState(1);
  const [battingTeam, setBattingTeam] = useState(matchConfig.firstBatting);
  const [showWicketDialog, setShowWicketDialog] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [showBatsmanSelect, setShowBatsmanSelect] = useState(true); // Show at start
  const [isSuperOver, setIsSuperOver] = useState(false);
  const [superOverRound, setSuperOverRound] = useState(1);
  const [showNewBatsmanSelect, setShowNewBatsmanSelect] = useState(false);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [currentBowler, setCurrentBowler] = useState('');
  const [previousBowler, setPreviousBowler] = useState('');
  const [matchComplete, setMatchComplete] = useState(false);
  const [wicketDetails, setWicketDetails] = useState<WicketDetails | null>(null);
  
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
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [bowlerStats, setBowlerStats] = useState<BowlerStats[]>([]);
  
  // Store first innings data
  const [firstInningsPlayers, setFirstInningsPlayers] = useState<Player[]>([]);
  const [firstInningsBowlers, setFirstInningsBowlers] = useState<BowlerStats[]>([]);

  const updateScore = (runs: number, isBoundary = false, isExtra = false) => {
    // Prevent scoring if batsmen or bowler not selected
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

    // Update striker stats (only if not an extra)
    if (!isExtra) {
      setStriker(prev => ({
        ...prev,
        runs: prev.runs + runs,
        balls: prev.balls + 1,
        fours: prev.fours + (runs === 4 ? 1 : 0),
        sixes: prev.sixes + (runs === 6 ? 1 : 0)
      }));

      // Rotate strike for odd runs (unless boundary) and only if both batsmen are not out
      if (runs % 2 === 1 && !isBoundary && !striker.isOut && !nonStriker.isOut) {
        const remainingPlayers = (battingTeam === matchConfig.team1Name 
          ? matchConfig.team1Players.length 
          : matchConfig.team2Players.length) - wickets - 1;
        
        // Only rotate if there's more than 1 batsman left
        if (remainingPlayers > 0) {
          const temp = striker;
          setStriker({ ...nonStriker, isOnStrike: true });
          setNonStriker({ ...temp, isOnStrike: false });
        }
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
      // Rotate strike at end of over only if both batsmen are not out
      if (!striker.isOut && !nonStriker.isOut) {
        const remainingPlayers = (battingTeam === matchConfig.team1Name 
          ? matchConfig.team1Players.length 
          : matchConfig.team2Players.length) - wickets - 1;
        
        // Only rotate if there's more than 1 batsman left
        if (remainingPlayers > 0) {
          const temp = striker;
          setStriker({ ...nonStriker, isOnStrike: true });
          setNonStriker({ ...temp, isOnStrike: false });
        }
      }
      
      // Update bowler overs
      setBowlerStats(prev => prev.map(bowler => 
        bowler.name === currentBowler 
          ? { ...bowler, overs: bowler.overs + 1 }
          : bowler
      ));
      
      // Set previous bowler to prevent consecutive overs
      setPreviousBowler(currentBowler);
      setCurrentBowler('');
      
      // Show bowler selection dialog
      setShowBowlerSelect(true);
    }

    // Check if innings should end
    if (newOvers >= matchConfig.overs) {
      if (isSuperOver) {
        handleSuperOverComplete();
      } else if (currentInnings === 1) {
        setFirstInningsScore(newScore);
        setFirstInningsWickets(wickets);
        setShowInningsBreak(true);
      } else {
        finishMatch();
      }
    }
    
    // Check if target is chased in second innings
    if (currentInnings === 2 && newScore > firstInningsScore && !isSuperOver) {
      finishMatch();
    }
    
    // Check if Super Over target is chased
    if (isSuperOver && superOverRound === 2 && matchState.superOverData && newScore > matchState.superOverData.team1Score) {
      finishSuperOver();
    }
  };

  const handleWicket = () => {
    setShowWicketDialog(true);
  };

  const processWicket = (dismissalType: string, fielder?: string) => {
    const newWickets = wickets + 1;
    setWickets(newWickets);
    
    // Determine dismissedBy based on dismissal type
    let dismissedBy = currentBowler;
    if (dismissalType === 'Run Out') {
      dismissedBy = fielder || 'Unknown';
    } else if (dismissalType === 'Stumped') {
      dismissedBy = `${fielder || 'Keeper'} (b ${currentBowler})`;
    }
    
    // Update striker as out with dismissal details
    setStriker(prev => ({
      ...prev,
      isOut: true,
      dismissalType,
      dismissedBy: dismissedBy,
      fielder: fielder
    }));
    
    // Update bowler stats for wicket (only if not run out)
    if (dismissalType !== 'Run Out') {
      setBowlerStats(prev => prev.map(bowler => 
        bowler.name === currentBowler 
          ? { ...bowler, wickets: bowler.wickets + 1 }
          : bowler
      ));
    }
    
    // Add to all players list
    setAllPlayers(prev => [...prev, { ...striker, isOut: true, dismissalType, dismissedBy, fielder }]);
    
    setShowWicketDialog(false);
    
    // Check if innings should end
    if (newWickets >= matchConfig.wickets) {
      if (isSuperOver) {
        handleSuperOverComplete();
      } else if (currentInnings === 1) {
        setFirstInningsScore(score);
        setFirstInningsWickets(newWickets);
        setShowInningsBreak(true);
      } else {
        finishMatch();
      }
    } else {
      // Check if this is the last batsman (only 1 remaining)
      const currentPlayers = matchConfig.firstBatting === matchConfig.team1Name 
        ? matchConfig.team1Players 
        : matchConfig.team2Players;
      
      const remainingPlayers = currentPlayers.length - newWickets - 1; // -1 for non-striker still batting
      
      if (remainingPlayers <= 0) {
        // Last man stands - innings should end after this ball/over
        // Don't end immediately, let the last batsman continue
        console.log("Last man standing, but continuing...");
      } else if (nextPlayerIndex < currentPlayers.length) {
        setShowNewBatsmanSelect(true);
      }
    }
  };

  const startSecondInnings = () => {
    // Store first innings data before resetting
    setFirstInningsPlayers([striker, nonStriker, ...allPlayers]);
    setFirstInningsBowlers([...bowlerStats]);
    
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
    setPreviousBowler('');
    setAllPlayers([]);
    setBowlerStats([]);
    setShowBatsmanSelect(true); // Show batsman selection for second innings
    
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
    // Check if Super Over is needed
    if (matchConfig.format !== 'Super Over' && currentInnings === 2 && score === firstInningsScore) {
      // Tied match - start Super Over
      setIsSuperOver(true);
      startSuperOver();
      return;
    }
    
    setMatchComplete(true);
    setShowMatchResult(true);
  };

  const startSuperOver = () => {
    // Set Super Over configuration
    const superOverConfig = { ...matchConfig, overs: 1, format: 'Super Over' };
    
    // Reset for Super Over
    setCurrentInnings(1);
    setSuperOverRound(1);
    setBattingTeam(matchConfig.firstBatting); // Original team that batted first goes first in Super Over
    
    // Reset score states
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
    
    // Reset players for Super Over
    const battingPlayers = matchConfig.firstBatting === matchConfig.team1Name 
      ? matchConfig.team1Players 
      : matchConfig.team2Players;
    
    setStriker({
      name: battingPlayers[0] || 'Player 1',
      runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: true
    });
    setNonStriker({
      name: battingPlayers[1] || 'Player 2',
      runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isOnStrike: false
    });
  };

  const handleSuperOverComplete = () => {
    if (superOverRound === 1) {
      // Store first Super Over data and start second
      if (!matchState.superOverData) {
        setMatchState(prev => ({
          ...prev,
          superOverData: {
            team1Score: battingTeam === matchConfig.team1Name ? score : 0,
            team2Score: battingTeam === matchConfig.team2Name ? score : 0,
            team1Boundaries: battingTeam === matchConfig.team1Name ? (striker.fours + striker.sixes + nonStriker.fours + nonStriker.sixes) : 0,
            team2Boundaries: battingTeam === matchConfig.team2Name ? (striker.fours + striker.sixes + nonStriker.fours + nonStriker.sixes) : 0,
          }
        }));
      }
      
      // Start second Super Over
      setSuperOverRound(2);
      setBattingTeam(battingTeam === matchConfig.team1Name ? matchConfig.team2Name : matchConfig.team1Name);
      
      // Reset for second Super Over
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
      
      const newBattingPlayers = battingTeam === matchConfig.team1Name 
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
    } else {
      // Both Super Overs complete - determine winner
      finishSuperOver();
    }
  };

  const finishSuperOver = () => {
    setMatchComplete(true);
    setShowMatchResult(true);
  };

  const getMatchResult = () => {
    if (isSuperOver) {
      if (superOverRound === 1) return "Super Over in progress";
      if (!matchState.superOverData) return "Super Over in progress";
      
      const team1Score = battingTeam === matchConfig.team1Name ? score : matchState.superOverData.team1Score;
      const team2Score = battingTeam === matchConfig.team2Name ? score : matchState.superOverData.team2Score;
      
      if (team1Score > team2Score) {
        return `${matchConfig.team1Name} wins Super Over by ${team1Score - team2Score} runs!`;
      } else if (team2Score > team1Score) {
        return `${matchConfig.team2Name} wins Super Over by ${team2Score - team1Score} runs!`;
      } else {
        // If scores are tied, check boundaries
        const team1Boundaries = battingTeam === matchConfig.team1Name 
          ? (striker.fours + striker.sixes + nonStriker.fours + nonStriker.sixes) 
          : matchState.superOverData.team1Boundaries;
        const team2Boundaries = battingTeam === matchConfig.team2Name 
          ? (striker.fours + striker.sixes + nonStriker.fours + nonStriker.sixes) 
          : matchState.superOverData.team2Boundaries;
          
        if (team1Boundaries > team2Boundaries) {
          return `${matchConfig.team1Name} wins Super Over on boundaries (${team1Boundaries} vs ${team2Boundaries})!`;
        } else if (team2Boundaries > team1Boundaries) {
          return `${matchConfig.team2Name} wins Super Over on boundaries (${team2Boundaries} vs ${team1Boundaries})!`;
        } else {
          return "Super Over tied - Another Super Over needed!";
        }
      }
    }
    
    if (matchConfig.format === 'Test') {
      // Test match result logic
      if (currentInnings <= 2) return "Test match in progress";
      // Add Test match specific result logic here
      return "Test match in progress";
    }
    
    if (currentInnings === 1 && !isSuperOver) return "Match in progress";
    
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

  const selectNewBatsman = (playerName: string) => {
    const currentPlayers = matchConfig.firstBatting === matchConfig.team1Name 
      ? matchConfig.team1Players 
      : matchConfig.team2Players;
      
    setStriker({
      name: playerName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      isOnStrike: true
    });
    setNextPlayerIndex(prev => prev + 1);
    setShowNewBatsmanSelect(false);
  };

  const getAvailableBowlers = () => {
    return getBowlingTeamPlayers().filter(player => player !== previousBowler);
  };

  const initializeBowlerStats = (bowlerName: string) => {
    setBowlerStats(prev => {
      const existing = prev.find(b => b.name === bowlerName);
      if (!existing) {
        return [...prev, { name: bowlerName, overs: 0, maidens: 0, runs: 0, wickets: 0, ballsBowled: 0 }];
      }
      return prev;
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEndMatch}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              End Match
            </Button>
            <Button variant="outline" onClick={() => setShowScoreboard(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Scorecard
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{matchConfig.team1Name} vs {matchConfig.team2Name}</h1>
            <div className="flex gap-2 justify-center">
              <Badge variant="secondary">
                {isSuperOver ? `Super Over ${superOverRound}` : `Innings ${currentInnings}`}
              </Badge>
              <Badge variant="outline">{matchConfig.format}</Badge>
            </div>
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
              
              {/* Only show non-striker if not out and there are batsmen remaining */}
              {!nonStriker.isOut && (wickets < matchConfig.wickets - 1) && (
                <div className={`p-3 rounded ${nonStriker.isOnStrike ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{nonStriker.name}</span>
                    {nonStriker.isOnStrike && <Zap className="w-4 h-4" />}
                  </div>
                  <div className="text-sm">
                    {nonStriker.runs} ({nonStriker.balls}) • 4s: {nonStriker.fours} • 6s: {nonStriker.sixes}
                  </div>
                </div>
              )}
              
              {/* Show "Last Man Standing" message when appropriate */}
              {wickets >= matchConfig.wickets - 1 && (
                <div className="p-3 rounded bg-orange-100 text-orange-800 text-center">
                  <span className="font-medium">Last Man Standing</span>
                </div>
              )}
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
            {(showBatsmanSelect || !currentBowler) && (
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-center">
                {showBatsmanSelect ? 'Please select batsmen first' : 'Please select a bowler before scoring'}
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
                onClick={() => updateScore(1, false, true)}
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {dismissalTypes.map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => setWicketDetails({ dismissalType: type, bowler: currentBowler })}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              
              {wicketDetails && ['Caught', 'Run Out', 'Stumped'].includes(wicketDetails.dismissalType) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {wicketDetails.dismissalType === 'Caught' ? 'Caught by:' : 
                     wicketDetails.dismissalType === 'Run Out' ? 'Run out by:' : 'Stumped by (Keeper):'}
                  </label>
                  <Select onValueChange={(value) => setWicketDetails(prev => prev ? { ...prev, fielder: value } : null)}>
                    <SelectTrigger>
                      <SelectValue placeholder={wicketDetails.dismissalType === 'Stumped' ? 'Select keeper' : 'Select fielder'} />
                    </SelectTrigger>
                    <SelectContent>
                      {getBowlingTeamPlayers()
                        .filter(player => wicketDetails.dismissalType !== 'Stumped' || player !== currentBowler)
                        .map((player) => (
                        <SelectItem key={player} value={player}>
                          {player}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {wicketDetails && (
                <Button 
                  onClick={() => {
                    processWicket(wicketDetails.dismissalType, wicketDetails.fielder);
                    setWicketDetails(null);
                  }}
                  className="w-full"
                  disabled={['Caught', 'Run Out', 'Stumped'].includes(wicketDetails.dismissalType) && !wicketDetails.fielder}
                >
                  Confirm Wicket
                </Button>
              )}
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

        {/* Batsman Selection Dialog */}
        <Dialog open={showBatsmanSelect} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Opening Batsmen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Striker (on strike):</label>
                <Select onValueChange={(value) => setStriker(prev => ({ ...prev, name: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose striker" />
                  </SelectTrigger>
                  <SelectContent>
                    {(battingTeam === matchConfig.team1Name ? matchConfig.team1Players : matchConfig.team2Players).map((player) => (
                      <SelectItem key={player} value={player}>
                        {player}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Non-striker:</label>
                <Select onValueChange={(value) => setNonStriker(prev => ({ ...prev, name: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose non-striker" />
                  </SelectTrigger>
                  <SelectContent>
                    {(battingTeam === matchConfig.team1Name ? matchConfig.team1Players : matchConfig.team2Players)
                      .filter(player => player !== striker.name)
                      .map((player) => (
                        <SelectItem key={player} value={player}>
                          {player}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => {
                  setShowBatsmanSelect(false);
                  setShowBowlerSelect(true);
                }} 
                className="w-full"
                disabled={!striker.name || !nonStriker.name || striker.name === nonStriker.name}
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showBowlerSelect} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {balls === 0 ? 'Select Bowler to Start' : 'Select Bowler for Next Over'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select onValueChange={(value) => {
                setCurrentBowler(value);
                initializeBowlerStats(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose bowler" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableBowlers().map((player) => (
                    <SelectItem key={player} value={player}>
                      {player}
                      {player === previousBowler && ' (Previous bowler)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {previousBowler && (
                <p className="text-sm text-muted-foreground">
                  Note: {previousBowler} cannot bowl consecutive overs
                </p>
              )}
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
                <Button variant="outline" onClick={() => {
                  // Simple photo capture simulation
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    canvas.width = 800;
                    canvas.height = 600;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, 800, 600);
                    ctx.fillStyle = '#000000';
                    ctx.font = '24px Arial';
                    ctx.fillText(`${getMatchResult()}`, 50, 100);
                    ctx.fillText(`${matchConfig.firstBatting}: ${firstInningsScore}/${firstInningsWickets}`, 50, 150);
                    ctx.fillText(`${battingTeam}: ${score}/${wickets}`, 50, 200);
                    
                    // Download the image
                    const link = document.createElement('a');
                    link.download = `match-result-${Date.now()}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                }}>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" onClick={() => setShowScoreboard(true)}>
                  View Stats
                </Button>
              </div>
              
              <Button onClick={onEndMatch} className="w-full">
                New Match
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Batsman Selection Dialog */}
        <Dialog open={showNewBatsmanSelect} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Next Batsman</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {striker.name} is out. Select the next batsman:
              </p>
              <div className="space-y-2">
                {(battingTeam === matchConfig.team1Name ? matchConfig.team1Players : matchConfig.team2Players)
                  .slice(nextPlayerIndex)
                  .map((player) => (
                    <Button
                      key={player}
                      variant="outline"
                      onClick={() => selectNewBatsman(player)}
                      className="w-full justify-start"
                    >
                      {player}
                    </Button>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Comprehensive Scoreboard Dialog */}
        <Dialog open={showScoreboard} onOpenChange={setShowScoreboard}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comprehensive Scorecard</DialogTitle>
            </DialogHeader>
            <Scoreboard
              matchConfig={matchConfig}
              currentInnings={currentInnings}
              battingTeam={battingTeam}
              bowlingTeam={battingTeam === matchConfig.team1Name ? matchConfig.team2Name : matchConfig.team1Name}
              striker={striker}
              nonStriker={nonStriker}
              allPlayers={allPlayers}
              bowlers={bowlerStats.map(bowler => ({
                ...bowler,
                isCurrentBowler: bowler.name === currentBowler
              }))}
              score={score}
              wickets={wickets}
              overs={overs}
              balls={balls}
              target={currentInnings === 2 ? firstInningsScore + 1 : undefined}
              isSecondInnings={currentInnings === 2}
              firstInningsScore={firstInningsScore}
              firstInningsWickets={firstInningsWickets}
              firstInningsPlayers={firstInningsPlayers}
              firstInningsBowlers={firstInningsBowlers}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LiveScoring;