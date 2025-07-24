import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock } from 'lucide-react';

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
  ballsBowled?: number;
  isCurrentBowler?: boolean;
}

interface MatchConfig {
  team1Name: string;
  team2Name: string;
  team1Players: string[];
  team2Players: string[];
  overs: number;
  wickets: number;
  tossWinner: string;
  firstBatting: string;
}

interface ScoreboardProps {
  matchConfig: MatchConfig;
  currentInnings: number;
  battingTeam: string;
  bowlingTeam: string;
  striker: Player;
  nonStriker: Player;
  allPlayers: Player[];
  bowlers: BowlerStats[];
  score: number;
  wickets: number;
  overs: number;
  balls: number;
  target?: number;
  isSecondInnings: boolean;
  firstInningsScore?: number;
  firstInningsWickets?: number;
  firstInningsPlayers?: Player[];
  firstInningsBowlers?: BowlerStats[];
}

const Scoreboard = ({ 
  matchConfig,
  currentInnings,
  battingTeam, 
  bowlingTeam, 
  striker,
  nonStriker,
  allPlayers,
  bowlers, 
  score, 
  wickets, 
  overs, 
  balls,
  target,
  isSecondInnings,
  firstInningsScore,
  firstInningsWickets,
  firstInningsPlayers,
  firstInningsBowlers
}: ScoreboardProps) => {
  const getStrikeRate = (runs: number, ballsFaced: number) => {
    return ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : '0.0';
  };

  const getEconomy = (runs: number, overs: number) => {
    return overs > 0 ? (runs / overs).toFixed(1) : '0.0';
  };

  // Get all current players (played and available)
  const getAllCurrentPlayers = () => {
    const currentTeamPlayers = battingTeam === matchConfig.team1Name 
      ? matchConfig.team1Players 
      : matchConfig.team2Players;
    
    const playedPlayers = [striker, nonStriker, ...allPlayers];
    const availablePlayers = currentTeamPlayers
      .filter(name => !playedPlayers.some(p => p.name === name))
      .map(name => ({
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        isOnStrike: false,
        dismissalType: undefined,
        dismissedBy: undefined,
        fielder: undefined
      }));
    
    return [...playedPlayers, ...availablePlayers];
  };

  // Get first innings players for display
  const getFirstInningsPlayers = () => {
    if (!firstInningsPlayers) return [];
    const firstBattingTeamPlayers = matchConfig.firstBatting === matchConfig.team1Name 
      ? matchConfig.team1Players 
      : matchConfig.team2Players;
    
    const playedInFirst = firstInningsPlayers;
    const availableInFirst = firstBattingTeamPlayers
      .filter(name => !playedInFirst.some(p => p.name === name))
      .map(name => ({
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        isOnStrike: false,
        dismissalType: undefined,
        dismissedBy: undefined,
        fielder: undefined
      }));
    
    return [...playedInFirst, ...availableInFirst];
  };

  return (
    <div className="space-y-4">
      {/* Match Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Match Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">{matchConfig.team1Name} vs {matchConfig.team2Name}</h3>
              <p className="text-sm text-muted-foreground">{matchConfig.overs} overs • {matchConfig.wickets} wickets</p>
              <p className="text-sm">Toss: {matchConfig.tossWinner} chose to {matchConfig.firstBatting === matchConfig.tossWinner ? 'bat' : 'bowl'}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline">Innings {currentInnings}</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {battingTeam} batting
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Innings Score */}
      <Card>
        <CardHeader>
          <CardTitle>Current Innings - {battingTeam}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold">{score}/{wickets}</p>
              <p className="text-sm text-muted-foreground">{overs}.{balls % 6} overs</p>
            </div>
            {isSecondInnings && target && (
              <div>
                <h3 className="font-semibold">Target: {target}</h3>
                <p className="text-sm text-muted-foreground">
                  Need {Math.max(0, target - score)} runs
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Innings Batting */}
      <Card>
        <CardHeader>
          <CardTitle>{battingTeam} Batting (Innings {currentInnings})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span>Batsman</span>
              <span>Status</span>
              <span>Runs</span>
              <span>Balls</span>
              <span>4s</span>
              <span>6s</span>
              <span>SR</span>
            </div>
            {getAllCurrentPlayers().map((player, index) => (
              <div key={index} className={`grid grid-cols-7 gap-2 text-sm py-1 ${
                player.isOnStrike ? 'bg-primary text-primary-foreground rounded px-2' : ''
              }`}>
                <span className="font-medium">
                  {player.name}
                  {player.isOnStrike && ' *'}
                </span>
                <span className="text-xs">
                  {player.isOut ? (
                    <div>
                      <div>{player.dismissalType}</div>
                      {player.dismissedBy && <div>b {player.dismissedBy}</div>}
                      {player.fielder && <div>c {player.fielder}</div>}
                    </div>
                  ) : player.balls > 0 ? 'Batting' : 'To Bat'}
                </span>
                <span>{player.runs}</span>
                <span>{player.balls}</span>
                <span>{player.fours}</span>
                <span>{player.sixes}</span>
                <span>{player.balls > 0 ? getStrikeRate(player.runs, player.balls) : '-'}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Innings Bowling */}
      <Card>
        <CardHeader>
          <CardTitle>{bowlingTeam} Bowling (Innings {currentInnings})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span>Bowler</span>
              <span>Overs</span>
              <span>Maidens</span>
              <span>Runs</span>
              <span>Wickets</span>
              <span>Economy</span>
            </div>
            {bowlers.map((bowler, index) => (
              <div key={index} className={`grid grid-cols-6 gap-2 text-sm py-1 ${
                bowler.isCurrentBowler ? 'bg-secondary text-secondary-foreground rounded px-2' : ''
              }`}>
                <span className="font-medium">
                  {bowler.name}
                  {bowler.isCurrentBowler && ' *'}
                </span>
                <span>{bowler.overs}</span>
                <span>{bowler.maidens}</span>
                <span>{bowler.runs}</span>
                <span>{bowler.wickets}</span>
                <span>{getEconomy(bowler.runs, bowler.overs)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* First Innings Details (if second innings) */}
      {isSecondInnings && firstInningsScore !== undefined && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                First Innings Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {matchConfig.firstBatting}: {firstInningsScore}/{firstInningsWickets || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Target for {battingTeam}: {firstInningsScore + 1} runs
                </p>
              </div>
            </CardContent>
          </Card>

          {firstInningsPlayers && firstInningsPlayers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{matchConfig.firstBatting} Batting (First Innings)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                    <span>Batsman</span>
                    <span>Status</span>
                    <span>Runs</span>
                    <span>Balls</span>
                    <span>4s</span>
                    <span>6s</span>
                    <span>SR</span>
                  </div>
                  {getFirstInningsPlayers().map((player, index) => (
                    <div key={index} className="grid grid-cols-7 gap-2 text-sm py-1">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-xs">
                        {player.isOut ? (
                          <div>
                            <div>{player.dismissalType}</div>
                            {player.dismissedBy && <div>b {player.dismissedBy}</div>}
                            {player.fielder && <div>c {player.fielder}</div>}
                          </div>
                        ) : player.balls > 0 ? 'Not Out' : 'Did Not Bat'}
                      </span>
                      <span>{player.runs}</span>
                      <span>{player.balls}</span>
                      <span>{player.fours}</span>
                      <span>{player.sixes}</span>
                      <span>{player.balls > 0 ? getStrikeRate(player.runs, player.balls) : '-'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {firstInningsBowlers && firstInningsBowlers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{battingTeam} Bowling (First Innings)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                    <span>Bowler</span>
                    <span>Overs</span>
                    <span>Maidens</span>
                    <span>Runs</span>
                    <span>Wickets</span>
                    <span>Economy</span>
                  </div>
                  {firstInningsBowlers.map((bowler, index) => (
                    <div key={index} className="grid grid-cols-6 gap-2 text-sm py-1">
                      <span className="font-medium">{bowler.name}</span>
                      <span>{bowler.overs}</span>
                      <span>{bowler.maidens}</span>
                      <span>{bowler.runs}</span>
                      <span>{bowler.wickets}</span>
                      <span>{getEconomy(bowler.runs, bowler.overs)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Scoreboard;