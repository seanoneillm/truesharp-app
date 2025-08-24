'use client';

import { getMarketConfigForSport } from '@/lib/types/sports-markets';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export type MainTabType = 'Main Lines' | 'Player Props' | 'Team Props' | 'Game Props';

interface HierarchicalTabsProps {
  sportKey: string;
  activeMainTab: MainTabType;
  activeSubTab?: string;
  onMainTabChange: (tab: MainTabType) => void;
  onSubTabChange: (subTab: string) => void;
}

export default function HierarchicalTabs({
  sportKey,
  activeMainTab,
  activeSubTab,
  onMainTabChange,
  onSubTabChange
}: HierarchicalTabsProps) {
  const [expandedTab, setExpandedTab] = useState<MainTabType | null>(
    activeMainTab !== 'Main Lines' ? activeMainTab : null
  );

  const marketConfig = getMarketConfigForSport(sportKey);
  
  if (!marketConfig) {
    return null;
  }

  const mainTabs = [
    { id: 'Player Props' as MainTabType, label: 'Players', icon: '👤', hasSubtabs: true },
    { id: 'Team Props' as MainTabType, label: 'Teams', icon: '🏆', hasSubtabs: true },
    { id: 'Game Props' as MainTabType, label: 'Game', icon: '🎯', hasSubtabs: true }
  ];

  const handleMainTabClick = (tabId: MainTabType) => {
    onMainTabChange(tabId);
    
    if (tabId === 'Player Props') {
      // For player props, expand and set first subcategory as active
      setExpandedTab(tabId);
      if (marketConfig.playerProps && marketConfig.playerProps.length > 0) {
        onSubTabChange(marketConfig.playerProps[0]!.id);
      }
    } else if (tabId === 'Team Props') {
      // For team props, expand and show team prop markets
      setExpandedTab(tabId);
      onSubTabChange('team-basic'); // Default sub-tab for team props
    } else if (tabId === 'Game Props') {
      // For game props, expand and show game prop markets
      setExpandedTab(tabId);
      onSubTabChange('game-basic'); // Default sub-tab for game props
    } else {
      // For other tabs, collapse any expanded tabs
      setExpandedTab(null);
      onSubTabChange('');
    }
  };

  const handleSubTabClick = (subTabId: string) => {
    onSubTabChange(subTabId);
  };

  const toggleExpanded = (tabId: MainTabType) => {
    if (tabId === 'Player Props') {
      setExpandedTab(expandedTab === tabId ? null : tabId);
      if (expandedTab !== tabId && marketConfig.playerProps && marketConfig.playerProps.length > 0) {
        onSubTabChange(marketConfig.playerProps[0]!.id);
      }
    } else if (tabId === 'Team Props') {
      setExpandedTab(expandedTab === tabId ? null : tabId);
      if (expandedTab !== tabId) {
        onSubTabChange('team-basic');
      }
    } else if (tabId === 'Game Props') {
      setExpandedTab(expandedTab === tabId ? null : tabId);
      if (expandedTab !== tabId) {
        onSubTabChange('game-basic');
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-4 sm:px-6 py-3">
        {/* Main Tabs */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {mainTabs.map((tab) => (
            <div key={tab.id} className="flex-shrink-0">
              <button
                onClick={() => handleMainTabClick(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeMainTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-blue-50 bg-slate-50 border border-slate-200'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                {tab.hasSubtabs && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(tab.id);
                    }}
                    className={`ml-1 transition-transform duration-200 cursor-pointer ${
                      expandedTab === tab.id ? 'rotate-90' : ''
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Sub-tabs for different prop types */}
        {expandedTab === 'Player Props' && marketConfig.playerProps && marketConfig.playerProps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {marketConfig.playerProps.map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubTabClick(subcategory.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeSubTab === subcategory.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
                  }`}
                >
                  {subcategory.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {expandedTab === 'Team Props' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'team-basic', label: 'Basic Stats' },
                { id: 'team-advanced', label: 'Advanced' },
                { id: 'team-special', label: 'Special' }
              ].map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubTabClick(subcategory.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeSubTab === subcategory.id
                      ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
                  }`}
                >
                  {subcategory.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {expandedTab === 'Game Props' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'game-basic', label: 'Game Flow' },
                { id: 'game-timing', label: 'Timing' },
                { id: 'game-special', label: 'Special Events' }
              ].map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubTabClick(subcategory.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeSubTab === subcategory.id
                      ? 'bg-purple-100 text-purple-700 border border-purple-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200'
                  }`}
                >
                  {subcategory.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}