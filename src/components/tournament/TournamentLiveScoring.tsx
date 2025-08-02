import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Trophy, Target, Users, AlertTriangle, Zap, BarChart3, Eye, EyeOff, Share2, Copy } from 'lucide-react';
import { Tournament, TournamentMatch } from '@/pages/Tournament';
import Scoreboard from '../Scoreboard';
import { MatchConfig } from '../MatchSetup';
import InGamePlayerManagement from './InGamePlayerManagement';

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

interface WicketDetails {
  dismissalType: string;
  bowler: string;
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
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [currentBowler, setCurrentBowler] = useState('');
  const [previousBowler, setPreviousBowler] = useState('');
  const [wicketDetails, setWicketDetails] = useState<WicketDetails | null>(null);
  const [declared, setDeclared] = useState(false);
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  // Function to update players during the game
  const updateTeamPlayers = (team: string, players: string[]) => {
    if (team === match.team1) {
      setTeam1Players(players);
    } else {
      setTeam2Players(players);
    }
  };
  
  // Score state
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0);
  const [balls, setBalls] = useState(0);
  
  // First innings score
  const [firstInningsScore, setFirstInningsScore] = useState(0);
  const [firstInningsWickets, setFirstInningsWickets] = useState(0);
  
  // Store first innings data
  const [firstInningsPlayers, setFirstInningsPlayers] = useState<Player[]>([]);
  const [firstInningsBowlers, setFirstInningsBowlers] = useState<BowlerStats[]>([]);

  // Player state
  const [team1Players, setTeam1Players] = useState<string[]>(tournament.players[match.team1] || []);
  const [team2Players, setTeam2Players] = useState<string[]>(tournament.players[match.team2] || []);
  
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
  
  // Generate shareable link for spectators
  const generateShareableLink = () => {
    const baseUrl = window.location.origin;
    const spectateUrl = `${baseUrl}/tournament?spectate=${tournament.id}&match=${match.id}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(spectateUrl).then(() => {
      alert('Spectate link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      setShowShareDialog(true);
    });
  };
  
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
        const currentPlayers = battingTeam === match.team1 ? team1Players : team2Players;
        const remainingPlayers = currentPlayers.length - wickets - 1;
        
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
        const currentPlayers = battingTeam === match.team1 ? team1Players : team2Players;
        const remainingPlayers = currentPlayers.length - wickets - 1;
        
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
      
      setPreviousBowler(currentBowler);
      setCurrentBowler('');
      setShowBowlerSelect(true);
    }

    // Check if innings should end (based on tournament overs)
    const maxOvers = tournament.overs || 20;
    if (newOvers >= maxOvers) {
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

  const declareInnings = () => {
    setDeclared(true);
    if (currentInnings === 1) {
      setFirstInningsScore(score);
      setFirstInningsWickets(wickets);
      setShowInningsBreak(true);
    } else {
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
    
    // Check if innings should end - use tournament wickets logic same as single match
    const currentPlayers = battingTeam === match.team1 ? team1Players : team2Players;
    const maxWickets = tournament.lastManStands 
      ? tournament.playersPerTeam  // Last man stands: all players can get out
      : tournament.playersPerTeam - 1;  // Regular: all but one can get out
    
    if (newWickets >= maxWickets) {
      // Innings ends
      if (currentInnings === 1) {
        setFirstInningsScore(score);
        setFirstInningsWickets(newWickets);
        setShowInningsBreak(true);
      } else {
        finishMatch();
      }
    } else {
      // Check if this is the last batsman
      const remainingPlayers = tournament.playersPerTeam - newWickets - 1; // -1 for non-striker still batting
      
      // Only select new batsman if there are players available
      if (remainingPlayers > 0 && nextPlayerIndex < currentPlayers.length) {
        setShowNewBatsmanSelect(true);
      }
    }
  };

  const startSecondInnings = () => {
    // Store first innings data before resetting
    setFirstInningsPlayers([striker, nonStriker, ...allPlayers]);
    setFirstInningsBowlers([...bowlerStats]);
    
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
    setDeclared(false);
    
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
    const currentTeam = battingTeam;
    const opponentTeam = battingTeam === match.team1 ? match.team2 : match.team1;
    
    if (score >= target) {
      return `${currentTeam} wins by ${10 - wickets} wickets!`;
    } else if (overs >= 20 || wickets >= 10) {
      const margin = firstInningsScore - score;
      return `${opponentTeam} wins by ${margin} runs!`;
    }
    
    return "Match in progress";
  };

  const getBowlingTeamPlayers = () => {
    return battingTeam === match.team1 ? team2Players : team1Players;
  };

  const selectNewBatsman = (playerName: string) => {
    const currentPlayers = battingTeam === match.team1 ? team1Players : team2Players;
      
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

  if (showScoreboard) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Button onClick={() => setShowScoreboard(false)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Live Scoring
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Match Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Detailed scorecard coming soon...</p>
          </CardContent>
        </Card>
      </div>
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
            <p className="text-lg">{match.team1}: {firstInningsScore}/{firstInningsWickets}
              {declared && " (declared)"}
            </p>
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
    <div className="min-h-screen bg-background p-4 space-y-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={() => setShowScoreboard(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Scorecard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSpectatorMode(!spectatorMode)}
              className={spectatorMode ? 'bg-primary text-primary-foreground' : ''}
            >
              {spectatorMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {spectatorMode ? 'Exit Spectator' : 'Spectator Mode'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Match
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{match.team1} vs {match.team2}</h1>
            <div className="flex gap-2 justify-center">
              <Badge variant="secondary">Innings {currentInnings}</Badge>
              <Badge variant="outline">T20</Badge>
            </div>
          </div>
          <div className="w-20" />
        </div>

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
              
              {/* Only show non-striker if not out and conditions allow */}
              {!nonStriker.isOut && ((tournament.lastManStands && wickets < tournament.wickets) || (!tournament.lastManStands && wickets < (tournament.wickets - 1))) && (
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
              {tournament.lastManStands && wickets >= (tournament.wickets - 1) && !striker.isOut && (
                <div className="p-3 rounded bg-orange-100 text-orange-800 text-center">
                  <span className="font-medium">🏏 Last Man Standing</span>
                  <p className="text-sm mt-1">Single batsman continues</p>
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
                <div>Overs: {tournament.overs}</div>
                <div>Max Wickets: {tournament.wickets}</div>
                <div>Current Bowler: {currentBowler || 'Not selected'}</div>
                {currentInnings === 2 && (
                  <div className="text-primary font-semibold">
                    Target: {firstInningsScore + 1} runs
                  </div>
                )}
                {currentInnings === 1 && (
                  <div className="text-muted-foreground">
                    {Math.max(0, tournament.overs - overs)} overs remaining
                  </div>
                )}
                {currentInnings === 2 && (
                  <div className="text-muted-foreground">
                    Need {Math.max(0, firstInningsScore + 1 - score)} runs from {Math.max(0, (tournament.overs - overs) * 6 - (balls % 6))} balls
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scoring Buttons - Hidden in spectator mode */}
        {!spectatorMode && (
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
              
              {/* Declared runs buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const newScore = score + 1;
                    setScore(newScore);
                    // Don't change strike or update ball count for declared runs
                  }}
                  className="h-16 text-lg font-semibold"
                  disabled={!currentBowler}
                >
                  Single (No Strike Change)
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const newScore = score + 2;
                    setScore(newScore);
                    // Don't change strike or update ball count for declared runs
                  }}
                  className="h-16 text-lg font-semibold"
                  disabled={!currentBowler}
                >
                  Double (No Strike Change)
                </Button>
                 <Button
                   variant="outline"
                   size="lg"
                   onClick={declareInnings}
                   className="h-16 text-lg font-semibold"
                   disabled={currentInnings === 2}
                 >
                   Declare
                 </Button>
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
              <div className="grid grid-cols-5 gap-3">
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
                  variant="outline"
                  onClick={() => updateScore(1, false, true)}
                  disabled={!currentBowler}
                >
                  Leg Bye
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
        )}

        {/* In-Game Player Management */}
        {!spectatorMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Player Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InGamePlayerManagement
                team1={match.team1}
                team2={match.team2}
                team1Players={team1Players}
                team2Players={team2Players}
                onUpdatePlayers={updateTeamPlayers}
                maxPlayersPerTeam={tournament.playersPerTeam}
              />
            </CardContent>
          </Card>
        )}

        {/* Spectator Mode Info */}
        {spectatorMode && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <Eye className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Spectator Mode Active</h3>
              <p className="text-blue-700">
                You're watching the match in read-only mode. Scoring controls are hidden.
              </p>
            </CardContent>
          </Card>
        )}

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
                    {(battingTeam === match.team1 ? team1Players : team2Players).map((player) => (
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
                    {(battingTeam === match.team1 ? team1Players : team2Players)
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

        {/* New Batsman Selection Dialog */}
        <Dialog open={showNewBatsmanSelect} onOpenChange={() => {}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select New Batsman</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select onValueChange={(value) => selectNewBatsman(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose new batsman" />
                </SelectTrigger>
                <SelectContent>
                  {(battingTeam === match.team1 ? team1Players : team2Players)
                    .slice(nextPlayerIndex)
                    .map((player) => (
                      <SelectItem key={player} value={player}>
                        {player}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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

        {/* Share Match Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Match with Spectators
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with spectators so they can watch the live match in read-only mode.
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm flex-1 text-wrap break-all">
                    {window.location.origin}/tournament?spectate={tournament.id}&match={match.id}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/tournament?spectate=${tournament.id}&match=${match.id}`);
                      // You could add a toast here
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowShareDialog(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TournamentLiveScoring;