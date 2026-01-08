
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: AppView.CHAT, label: 'Chat', icon: 'fa-comment-dots', color: 'text-blue-400' },
    { id: AppView.IMAGE, label: 'Images', icon: 'fa-image', color: 'text-purple-400' },
    { id: AppView.LIVE, label: 'Live', icon: 'fa-microphone-lines', color: 'text-rose-400' },
  ];

  return (
    <aside className="w-20 md:w-64 border-r border-slate-800 flex flex-col bg-slate-950">
      <div className="p-6 hidden md:flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
          <i className="fa-solid fa-bolt text-white"></i>
        </div>
        <span className="text-lg font-bold tracking-tighter">GEMINI STUDIO</span>
      </div>
      
      <div className="p-4 md:hidden flex justify-center">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
          <i className="fa-solid fa-bolt text-white"></i>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center justify-center md:justify-start gap-4 p-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-slate-800 text-white shadow-inner' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-lg md:text-xl w-6 text-center ${currentView === item.id ? item.color : ''}`}></i>
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-900">
        <div className="hidden md:block p-4 bg-slate-900 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-500 mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold uppercase tracking-wider">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
