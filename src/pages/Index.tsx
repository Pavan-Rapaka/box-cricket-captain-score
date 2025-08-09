import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Calendar, BarChart3 } from 'lucide-react';
import MatchSetup, { MatchConfig } from '@/components/MatchSetup';
import LiveScoring from '@/components/LiveScoring';

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'setup' | 'scoring'>('home');
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const isSpectateMode = searchParams.get('spectate') === 'true' || !!matchId;

  const handleStartMatch = (config: MatchConfig) => {
    setMatchConfig(config);
    setCurrentView('scoring');
  };

  const handleEndMatch = () => {
    setCurrentView('home');
    setMatchConfig(null);
  };

  useEffect(() => {
    if (isSpectateMode && matchId) {
      // In spectate mode, show a message or load spectate view
      setCurrentView('home'); // For now, redirect to home with spectate info
    }
  }, [isSpectateMode, matchId]);

  if (currentView === 'setup') {
    return <MatchSetup onStartMatch={handleStartMatch} onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'scoring' && matchConfig) {
    return <LiveScoring matchConfig={matchConfig} onEndMatch={handleEndMatch} isSpectateMode={isSpectateMode} />;
  }

  if (isSpectateMode && matchId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Trophy className="w-16 h-16 text-cricket-gold mx-auto" />
          <h1 className="text-2xl font-bold">Match Spectate Mode</h1>
          <p className="text-muted-foreground">
            This match is being shared with you. Wait for the match to start or contact the organizer.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Home page with navigation
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Trophy className="w-16 h-16 text-cricket-gold mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">Cricket Scorer</h1>
          <p className="text-muted-foreground text-lg">Professional cricket scoring and tournament management</p>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="w-6 h-6 text-cricket-gold" />
                Single Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Score a single cricket match with live ball-by-ball commentary and statistics.
              </p>
              <Button 
                onClick={() => setCurrentView('setup')} 
                className="w-full"
              >
                Start New Match
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-cricket-gold" />
                Tournament Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Organize and manage cricket tournaments with multiple teams, scheduling, and standings.
              </p>
              <Link to="/tournament">
                <Button className="w-full">
                  Manage Tournaments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-cricket-gold mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Match Scheduling</h3>
              <p className="text-sm text-muted-foreground">Schedule and track matches across tournaments</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-cricket-gold mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Player Statistics</h3>
              <p className="text-sm text-muted-foreground">Track individual and team performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-cricket-gold mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Points Table</h3>
              <p className="text-sm text-muted-foreground">Live standings and tournament rankings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
