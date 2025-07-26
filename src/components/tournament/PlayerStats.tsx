import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Award, Target } from 'lucide-react';
import { Tournament } from '@/pages/Tournament';

interface PlayerStatsProps {
  tournament: Tournament;
}

// Mock player statistics - in a real app, this would come from match data
const generateMockStats = (teams: string[]) => {
  const batsmen = teams.flatMap(team => [
    { name: `${team} Player 1`, team, runs: Math.floor(Math.random() * 300) + 100, matches: Math.floor(Math.random() * 5) + 3, average: 0, strikeRate: 0 },
    { name: `${team} Player 2`, team, runs: Math.floor(Math.random() * 250) + 80, matches: Math.floor(Math.random() * 5) + 2, average: 0, strikeRate: 0 },
    { name: `${team} Player 3`, team, runs: Math.floor(Math.random() * 200) + 60, matches: Math.floor(Math.random() * 4) + 2, average: 0, strikeRate: 0 }
  ]).map(player => ({
    ...player,
    average: Number((player.runs / player.matches).toFixed(2)),
    strikeRate: Number((120 + Math.random() * 60).toFixed(2))
  }));

  const bowlers = teams.flatMap(team => [
    { name: `${team} Bowler 1`, team, wickets: Math.floor(Math.random() * 15) + 5, matches: Math.floor(Math.random() * 5) + 3, average: 0, economy: 0 },
    { name: `${team} Bowler 2`, team, wickets: Math.floor(Math.random() * 12) + 3, matches: Math.floor(Math.random() * 4) + 2, average: 0, economy: 0 }
  ]).map(player => ({
    ...player,
    average: Number((15 + Math.random() * 10).toFixed(2)),
    economy: Number((6 + Math.random() * 3).toFixed(2))
  }));

  return { batsmen, bowlers };
};

const PlayerStats = ({ tournament }: PlayerStatsProps) => {
  const { batsmen, bowlers } = generateMockStats(tournament.teams);

  const topBatsmen = batsmen.sort((a, b) => b.runs - a.runs).slice(0, 10);
  const topBowlers = bowlers.sort((a, b) => b.wickets - a.wickets).slice(0, 10);

  return (
    <Tabs defaultValue="batting" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="batting">Batting Stats</TabsTrigger>
        <TabsTrigger value="bowling">Bowling Stats</TabsTrigger>
      </TabsList>

      <TabsContent value="batting">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Run Scorers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Rank</th>
                    <th className="text-left p-2">Player</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-center p-2">Matches</th>
                    <th className="text-center p-2">Runs</th>
                    <th className="text-center p-2">Average</th>
                    <th className="text-center p-2">Strike Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topBatsmen.map((player, index) => (
                    <tr 
                      key={player.name}
                      className={`border-b hover:bg-muted/50 ${
                        index === 0 ? 'bg-cricket-gold/10' : ''
                      }`}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {index + 1}
                          {index === 0 && <Award className="w-4 h-4 text-cricket-gold" />}
                        </div>
                      </td>
                      <td className="p-2 font-medium">{player.name}</td>
                      <td className="p-2">
                        <Badge variant="outline">{player.team}</Badge>
                      </td>
                      <td className="text-center p-2">{player.matches}</td>
                      <td className="text-center p-2 font-bold text-cricket-gold">{player.runs}</td>
                      <td className="text-center p-2">{player.average}</td>
                      <td className="text-center p-2">{player.strikeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cricket-gold">
                    {Math.max(...topBatsmen.map(p => p.runs))}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Score</div>
                  <div className="text-xs">
                    {topBatsmen.find(p => p.runs === Math.max(...topBatsmen.map(b => b.runs)))?.name}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cricket-gold">
                    {Math.max(...topBatsmen.map(p => p.average)).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Best Average</div>
                  <div className="text-xs">
                    {topBatsmen.find(p => p.average === Math.max(...topBatsmen.map(b => b.average)))?.name}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cricket-gold">
                    {Math.max(...topBatsmen.map(p => p.strikeRate)).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Best Strike Rate</div>
                  <div className="text-xs">
                    {topBatsmen.find(p => p.strikeRate === Math.max(...topBatsmen.map(b => b.strikeRate)))?.name}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bowling">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Wicket Takers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Rank</th>
                    <th className="text-left p-2">Player</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-center p-2">Matches</th>
                    <th className="text-center p-2">Wickets</th>
                    <th className="text-center p-2">Average</th>
                    <th className="text-center p-2">Economy</th>
                  </tr>
                </thead>
                <tbody>
                  {topBowlers.map((player, index) => (
                    <tr 
                      key={player.name}
                      className={`border-b hover:bg-muted/50 ${
                        index === 0 ? 'bg-cricket-gold/10' : ''
                      }`}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {index + 1}
                          {index === 0 && <Award className="w-4 h-4 text-cricket-gold" />}
                        </div>
                      </td>
                      <td className="p-2 font-medium">{player.name}</td>
                      <td className="p-2">
                        <Badge variant="outline">{player.team}</Badge>
                      </td>
                      <td className="text-center p-2">{player.matches}</td>
                      <td className="text-center p-2 font-bold text-cricket-gold">{player.wickets}</td>
                      <td className="text-center p-2">{player.average}</td>
                      <td className="text-center p-2">{player.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cricket-gold">
                    {Math.max(...topBowlers.map(p => p.wickets))}
                  </div>
                  <div className="text-sm text-muted-foreground">Most Wickets</div>
                  <div className="text-xs">
                    {topBowlers.find(p => p.wickets === Math.max(...topBowlers.map(b => b.wickets)))?.name}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cricket-gold">
                    {Math.min(...topBowlers.map(p => p.average)).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Best Average</div>
                  <div className="text-xs">
                    {topBowlers.find(p => p.average === Math.min(...topBowlers.map(b => b.average)))?.name}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-cricket-gold">
                    {Math.min(...topBowlers.map(p => p.economy)).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Best Economy</div>
                  <div className="text-xs">
                    {topBowlers.find(p => p.economy === Math.min(...topBowlers.map(b => b.economy)))?.name}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default PlayerStats;