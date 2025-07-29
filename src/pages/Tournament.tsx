import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trophy, Users, Calendar, BarChart3, Settings, Plus, Home, Edit, Trash2 } from 'lucide-react';
import TournamentSetup from '@/components/tournament/TournamentSetup';
import TournamentDashboard from '@/components/tournament/TournamentDashboard';
import PlayerStats from '@/components/tournament/PlayerStats';
import MatchSchedule from '@/components/tournament/MatchSchedule';
import PointsTable from '@/components/tournament/PointsTable';

export interface Tournament {
  id: string;
  name: string;
  format: 'round-robin' | 'knockout' | 'league' | 'tri-series';
  teams: string[];
  players: Record<string, string[]>; // team -> array of player names
  status: 'setup' | 'ongoing' | 'completed';
  startDate: Date;
  endDate?: Date;
  matches: TournamentMatch[];
  pointsTable: TeamStanding[];
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  team1: string;
  team2: string;
  matchNumber: number;
  round?: string;
  scheduledDate: Date;
  status: 'scheduled' | 'ongoing' | 'completed';
  result?: {
    winner: string;
    team1Score: string;
    team2Score: string;
    margin: string;
  };
}

export interface TeamStanding {
  team: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  netRunRate: number;
}

const Tournament = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'setup' | 'dashboard' | 'edit'>('list');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  const handleCreateTournament = (tournament: Tournament) => {
    setTournaments(prev => [...prev, tournament]);
    setCurrentView('list');
  };

  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setCurrentView('dashboard');
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setCurrentView('edit');
  };

  const handleUpdateTournament = (updatedTournament: Tournament) => {
    setTournaments(prev => prev.map(t => t.id === updatedTournament.id ? updatedTournament : t));
    setCurrentView('list');
    setEditingTournament(null);
  };

  const handleDeleteTournament = (tournamentId: string) => {
    setTournaments(prev => prev.filter(t => t.id !== tournamentId));
  };

  if (currentView === 'setup') {
    return (
      <TournamentSetup 
        onCreateTournament={handleCreateTournament}
        onCancel={() => setCurrentView('list')}
      />
    );
  }

  if (currentView === 'edit' && editingTournament) {
    return (
      <TournamentSetup 
        tournament={editingTournament}
        onCreateTournament={handleUpdateTournament}
        onCancel={() => setCurrentView('list')}
        isEditing={true}
      />
    );
  }

  if (currentView === 'dashboard' && selectedTournament) {
    return (
      <TournamentDashboard 
        tournament={selectedTournament}
        onBack={() => setCurrentView('list')}
        onUpdateTournament={(updated) => {
          setTournaments(prev => prev.map(t => t.id === updated.id ? updated : t));
          setSelectedTournament(updated);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-cricket-gold" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tournament Manager</h1>
              <p className="text-muted-foreground">Organize and track cricket tournaments</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/'} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button onClick={() => setCurrentView('setup')} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Tournament
            </Button>
          </div>
        </div>

        {/* Tournament List */}
        {tournaments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tournaments Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first tournament to get started</p>
              <Button onClick={() => setCurrentView('setup')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{tournament.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {tournament.format.replace('-', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        tournament.status === 'completed' ? 'default' :
                        tournament.status === 'ongoing' ? 'destructive' : 'secondary'
                      }>
                        {tournament.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTournament(tournament)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{tournament.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTournament(tournament.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{tournament.teams.length} teams</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{tournament.startDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="w-4 h-4" />
                      <span>{tournament.matches.filter(m => m.status === 'completed').length}/{tournament.matches.length} matches</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => handleSelectTournament(tournament)}
                    >
                      View Tournament
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournament;