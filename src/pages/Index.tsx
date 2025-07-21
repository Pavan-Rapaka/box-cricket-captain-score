import { useState } from 'react';
import MatchSetup, { MatchConfig } from '@/components/MatchSetup';
import LiveScoring from '@/components/LiveScoring';

const Index = () => {
  const [currentView, setCurrentView] = useState<'setup' | 'scoring'>('setup');
  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);

  const handleStartMatch = (config: MatchConfig) => {
    setMatchConfig(config);
    setCurrentView('scoring');
  };

  const handleEndMatch = () => {
    setCurrentView('setup');
    setMatchConfig(null);
  };

  if (currentView === 'setup') {
    return <MatchSetup onStartMatch={handleStartMatch} />;
  }

  if (currentView === 'scoring' && matchConfig) {
    return <LiveScoring matchConfig={matchConfig} onEndMatch={handleEndMatch} />;
  }

  return null;
};

export default Index;
