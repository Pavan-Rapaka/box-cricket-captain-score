import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Calendar, Users, BarChart3, Home } from 'lucide-react';
import { Tournament } from '@/pages/Tournament';
import MatchSchedule from './MatchSchedule';
import PointsTable from './PointsTable';
import PlayerStats from './PlayerStats';

interface TournamentDashboardProps {
  tournament: Tournament;
  onBack: () => void;
  onUpdateTournament: (tournament: Tournament) => void;
}

const TournamentDashboard = ({ tournament, onBack, onUpdateTournament }: TournamentDashboardProps) => {
  const completedMatches = tournament.matches.filter(m => m.status === 'completed').length;
  const totalMatches = tournament.matches.length;
  const progressPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => window.location.href = '/'}>
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-cricket-gold" />
              <h1 className="text-2xl font-bold text-foreground">{tournament.name}</h1>
              <Badge variant={
                tournament.status === 'completed' ? 'default' :
                tournament.status === 'ongoing' ? 'destructive' : 'secondary'
              }>
                {tournament.status}
              </Badge>
            </div>
            <p className="text-muted-foreground capitalize">
              {tournament.format.replace('-', ' ')} • Started {tournament.startDate.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teams</p>
                  <p className="text-xl font-bold">{tournament.teams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Matches</p>
                  <p className="text-xl font-bold">{completedMatches}/{totalMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold">{Math.round(progressPercentage)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Leader</p>
                  <p className="text-lg font-bold">
                    {tournament.pointsTable.length > 0 
                      ? tournament.pointsTable.sort((a, b) => b.points - a.points)[0]?.team || 'TBD'
                      : 'TBD'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="table">Points Table</TabsTrigger>
            <TabsTrigger value="stats">Player Stats</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <MatchSchedule 
              tournament={tournament}
              onUpdateTournament={onUpdateTournament}
            />
          </TabsContent>

          <TabsContent value="table">
            <PointsTable tournament={tournament} />
          </TabsContent>

          <TabsContent value="stats">
            <PlayerStats tournament={tournament} />
          </TabsContent>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Format Details</h4>
                    <p className="text-muted-foreground">
                      {tournament.format === 'round-robin' && 'Each team plays every other team once'}
                      {tournament.format === 'tri-series' && 'Three teams playing round-robin format'}
                      {tournament.format === 'knockout' && 'Single elimination tournament'}
                      {tournament.format === 'league' && 'League format with potential playoffs'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Participating Teams</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tournament.teams.map(team => (
                        <Badge key={team} variant="outline">{team}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold">Tournament Progress</h4>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-cricket-gold h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {completedMatches} of {totalMatches} matches completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TournamentDashboard;