
import React, { useState } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageView from './components/ImageView';
import LiveView from './components/LiveView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatView />;
      case AppView.IMAGE:
        return <ImageView />;
      case AppView.LIVE:
        return <LiveView />;
      default:
        return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-slate-900/50 backdrop-blur-md z-10">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            {currentView === AppView.CHAT && "Advanced Chat"}
            {currentView === AppView.IMAGE && "Visionary Images"}
            {currentView === AppView.LIVE && "Real-time Live Audio"}
          </h1>
        </header>
        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
