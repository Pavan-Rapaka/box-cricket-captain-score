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
  isCurrentBowler: boolean;
}

interface ScoreboardProps {
  battingTeam: string;
  bowlingTeam: string;
  players: Player[];
  bowlers: BowlerStats[];
  score: number;
  wickets: number;
  overs: number;
  balls: number;
  target?: number;
  isSecondInnings: boolean;
  firstInningsScore?: number;
}

const Scoreboard = ({ 
  battingTeam, 
  bowlingTeam, 
  players, 
  bowlers, 
  score, 
  wickets, 
  overs, 
  balls,
  target,
  isSecondInnings,
  firstInningsScore
}: ScoreboardProps) => {
  const getStrikeRate = (runs: number, ballsFaced: number) => {
    return ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : '0.0';
  };

  const getEconomy = (runs: number, overs: number) => {
    return overs > 0 ? (runs / overs).toFixed(1) : '0.0';
  };

  return (
    <div className="space-y-4">
      {/* Current Score Summary */}
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
              <h3 className="font-semibold">{battingTeam}</h3>
              <p className="text-2xl font-bold">{score}/{wickets}</p>
              <p className="text-sm text-muted-foreground">{overs}.{balls % 6} overs</p>
            </div>
            {isSecondInnings && target && (
              <div>
                <h3 className="font-semibold">Target</h3>
                <p className="text-xl font-bold text-primary">{target}</p>
                <p className="text-sm text-muted-foreground">
                  Need {Math.max(0, target - score)} runs
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batting Scorecard */}
      <Card>
        <CardHeader>
          <CardTitle>{battingTeam} Batting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span>Batsman</span>
              <span>Runs</span>
              <span>Balls</span>
              <span>4s</span>
              <span>6s</span>
              <span>SR</span>
            </div>
            {players.map((player, index) => (
              <div key={index} className={`grid grid-cols-6 gap-2 text-sm py-1 ${
                player.isOnStrike ? 'bg-primary text-primary-foreground rounded px-2' : ''
              }`}>
                <span className="font-medium">
                  {player.name}
                  {player.isOnStrike && ' *'}
                  {player.isOut && (
                    <div className="text-xs text-muted-foreground">
                      {player.dismissalType}
                      {player.dismissedBy && ` b ${player.dismissedBy}`}
                      {player.fielder && ` c ${player.fielder}`}
                    </div>
                  )}
                </span>
                <span>{player.runs}</span>
                <span>{player.balls}</span>
                <span>{player.fours}</span>
                <span>{player.sixes}</span>
                <span>{getStrikeRate(player.runs, player.balls)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bowling Scorecard */}
      <Card>
        <CardHeader>
          <CardTitle>{bowlingTeam} Bowling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span>Bowler</span>
              <span>Overs</span>
              <span>Runs</span>
              <span>Wkts</span>
              <span>Econ</span>
            </div>
            {bowlers.map((bowler, index) => (
              <div key={index} className={`grid grid-cols-5 gap-2 text-sm py-1 ${
                bowler.isCurrentBowler ? 'bg-secondary text-secondary-foreground rounded px-2' : ''
              }`}>
                <span className="font-medium">
                  {bowler.name}
                  {bowler.isCurrentBowler && ' *'}
                </span>
                <span>{bowler.overs}</span>
                <span>{bowler.runs}</span>
                <span>{bowler.wickets}</span>
                <span>{getEconomy(bowler.runs, bowler.overs)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* First Innings Summary (if second innings) */}
      {isSecondInnings && firstInningsScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              First Innings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-lg font-semibold">
                {battingTeam === 'Team 1' ? 'Team 2' : 'Team 1'}: {firstInningsScore}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Scoreboard;