import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp } from 'lucide-react';
import { Tournament } from '@/pages/Tournament';

interface PointsTableProps {
  tournament: Tournament;
}

const PointsTable = ({ tournament }: PointsTableProps) => {
  const sortedStandings = [...tournament.pointsTable].sort((a, b) => {
    // Sort by points first, then by net run rate
    if (b.points !== a.points) return b.points - a.points;
    return b.netRunRate - a.netRunRate;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Points Table
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Pos</th>
                <th className="text-left p-2">Team</th>
                <th className="text-center p-2">Played</th>
                <th className="text-center p-2">Won</th>
                <th className="text-center p-2">Lost</th>
                <th className="text-center p-2">Tied</th>
                <th className="text-center p-2">NR</th>
                <th className="text-center p-2">Points</th>
                <th className="text-center p-2">NRR</th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((standing, index) => (
                <tr 
                  key={standing.team}
                  className={`border-b hover:bg-muted/50 ${
                    index === 0 ? 'bg-cricket-gold/10' : ''
                  }`}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {index + 1}
                      {index === 0 && <Trophy className="w-4 h-4 text-cricket-gold" />}
                    </div>
                  </td>
                  <td className="p-2 font-medium">{standing.team}</td>
                  <td className="text-center p-2">{standing.played}</td>
                  <td className="text-center p-2 text-green-600">{standing.won}</td>
                  <td className="text-center p-2 text-red-600">{standing.lost}</td>
                  <td className="text-center p-2">{standing.tied}</td>
                  <td className="text-center p-2">{standing.noResult}</td>
                  <td className="text-center p-2">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {standing.points}
                    </Badge>
                  </td>
                  <td className="text-center p-2">
                    <div className="flex items-center justify-center gap-1">
                      {standing.netRunRate.toFixed(3)}
                      {standing.netRunRate > 0 && (
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-sm text-muted-foreground space-y-2">
          <h4 className="font-semibold">Points System:</h4>
          <ul className="space-y-1">
            <li>• Win: 2 points</li>
            <li>• Tie: 1 point</li>
            <li>• Loss: 0 points</li>
            <li>• No Result: 1 point</li>
          </ul>
        </div>

        {tournament.format === 'tri-series' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Tri-Series Format</h4>
            <p className="text-sm text-blue-700">
              In a tri-series, each team plays the other teams multiple times. 
              The team with the most points at the end wins the series.
            </p>
          </div>
        )}

        {tournament.format === 'knockout' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">Knockout Format</h4>
            <p className="text-sm text-amber-700">
              Single elimination format. Teams advance to the next round by winning their matches.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsTable;