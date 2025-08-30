'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Twitter, Instagram, Copy, Eye, EyeOff, MessageCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { TrueSharpShield } from '@/components/ui/truesharp-shield';
import { OpenBet } from '@/lib/queries/open-bets';

// Use OpenBet type from queries instead of local Bet type

interface Strategy {
  id: string;
  name: string;
  user_id: string;
  profiles: {
    username: string;
  };
}

interface ShareStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyId: string;
  strategy?: Strategy;
  openBets?: OpenBet[];
}

export default function ShareStrategyModal({ isOpen, onClose, strategyId, strategy: propStrategy, openBets: propOpenBets }: ShareStrategyModalProps) {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [allBets, setAllBets] = useState<OpenBet[]>([]);
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const shareImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // If we have open bets as props (even if empty), use them directly
      if (propOpenBets !== undefined) {
        console.log('ShareStrategyModal - Using prop open bets:', propOpenBets);
        setAllBets(propOpenBets);
        setSelectedBets(new Set(propOpenBets.map(bet => bet.id)));
        // Still fetch strategy details if not provided as prop
        if (propStrategy) {
          setStrategy(propStrategy);
          setIsLoading(false);
        } else {
          // Fetch strategy details only
          fetchStrategyDetails();
        }
      } else if (strategyId) {
        // Fallback to API fetch if props not provided
        fetchOpenBets();
      }
    }
  }, [isOpen, strategyId, propStrategy, propOpenBets]);

  const fetchStrategyDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/strategies/${strategyId}/open-bets`);
      const data = await response.json();
      
      console.log('ShareStrategyModal - Strategy details API Response:', data);
      
      // Set strategy details
      if (data.strategy) {
        setStrategy(data.strategy);
      }
    } catch (error) {
      console.error('Error fetching strategy details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOpenBets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/strategies/${strategyId}/open-bets`);
      const data = await response.json();
      
      console.log('ShareStrategyModal - Full API Response:', data);
      console.log('ShareStrategyModal - Response status:', response.status);
      console.log('ShareStrategyModal - OpenBets array:', data.openBets);
      console.log('ShareStrategyModal - OpenBets length:', data.openBets?.length);
      
      // Always set strategy and process response, even if empty
      setStrategy(data.strategy);
      
      if (response.ok && data.openBets) {
        const bets = data.openBets.map((item: any) => item.bets).filter(Boolean);
        console.log('ShareStrategyModal - Mapped bets:', bets);
        console.log('ShareStrategyModal - Mapped bets length:', bets.length);
        setAllBets(bets);
        setSelectedBets(new Set(bets.map((bet: OpenBet) => bet.id)));
      } else {
        // Handle case where API works but returns empty bets
        console.log('ShareStrategyModal - No bets found, setting empty arrays');
        setAllBets([]);
        setSelectedBets(new Set());
      }
    } catch (error) {
      console.error('Error fetching open bets:', error);
      // Set empty state on error to stop loading
      setAllBets([]);
      setSelectedBets(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBetSelection = (betId: string) => {
    const newSelected = new Set(selectedBets);
    if (newSelected.has(betId)) {
      newSelected.delete(betId);
    } else {
      newSelected.add(betId);
    }
    setSelectedBets(newSelected);
  };

  const getStatusIcon = (status: string = 'pending') => {
    switch (status) {
      case 'won':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'lost':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'void':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  };

  const getStatusColor = (status: string = 'pending') => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      case 'void':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  };

  const formatBetDescription = (bet: OpenBet) => {
    let description = bet.bet_description || '';
    
    if (bet.line_value !== null && bet.line_value !== undefined) {
      if (bet.bet_type === 'spread') {
        description += ` ${bet.line_value > 0 ? '+' : ''}${bet.line_value}`;
      } else if (bet.bet_type === 'total') {
        description += ` ${bet.line_value}`;
      }
    }
    
    return description;
  };

  const formatBetDisplay = (bet: OpenBet) => {
    const teams = bet.home_team && bet.away_team 
      ? `${bet.away_team} @ ${bet.home_team}`
      : bet.bet_description;
    
    // Format line with side first, then line value, then market type
    // e.g., "over 9.5 total runs", "under 47.5 total points", "home -3.5 spread"
    let line = '';
    
    // Start with side if available
    if (bet.side) {
      line = bet.side;
      
      // Add line value if available
      if (bet.line_value !== undefined && bet.line_value !== null) {
        line += ` ${bet.line_value}`;
      }
      
      // Add market type (bet_type) at the end
      if (bet.bet_type) {
        // Convert bet_type to more readable format
        const marketTypeMap: { [key: string]: string } = {
          'total': 'total',
          'spread': 'spread',
          'moneyline': 'moneyline',
          'player_prop': 'player prop',
          'game_prop': 'game prop',
          'first_half': 'first half',
          'quarter': 'quarter',
          'period': 'period'
        };
        const marketType = marketTypeMap[bet.bet_type] || bet.bet_type;
        line += ` ${marketType}`;
      }
    } else {
      // Fallback if no side available
      if (bet.line_value !== undefined && bet.line_value !== null) {
        line = `${bet.line_value}`;
        if (bet.bet_type) {
          const marketTypeMap: { [key: string]: string } = {
            'total': 'total',
            'spread': 'spread', 
            'moneyline': 'moneyline',
            'player_prop': 'player prop',
            'game_prop': 'game prop',
            'first_half': 'first half',
            'quarter': 'quarter',
            'period': 'period'
          };
          const marketType = marketTypeMap[bet.bet_type] || bet.bet_type;
          line += ` ${marketType}`;
        }
      } else {
        line = bet.bet_type || 'bet';
      }
    }
    
    const odds = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`;
    
    return {
      teams,
      line,
      odds,
      gameDate: bet.game_date ? new Date(bet.game_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }) : 'TBD'
    };
  };

  const generateImage = async () => {
    if (!shareImageRef.current) {
      console.error('shareImageRef.current is null');
      return null;
    }
    
    console.log('shareImageRef element:', shareImageRef.current);
    console.log('Element dimensions:', shareImageRef.current.offsetWidth, 'x', shareImageRef.current.offsetHeight);
    
    setIsGenerating(true);
    try {
      // Wait for any pending renders
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const element = shareImageRef.current;
      const rect = element.getBoundingClientRect();
      console.log('Element rect:', rect);
      
      if (rect.width === 0 || rect.height === 0) {
        console.error('Element has zero dimensions');
        return null;
      }
      
      // Get device pixel ratio for high-DPI displays
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = Math.max(3, pixelRatio * 2); // Use at least 3x scale for crisp images
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: scale,
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for cleaner console
        width: element.scrollWidth,
        height: element.scrollHeight,
        letterRendering: true, // Better text rendering
        removeContainer: true, // Clean up temporary elements
        imageTimeout: 15000, // Longer timeout for complex images
        onclone: function(clonedDoc) {
          // Ensure fonts are loaded in cloned document
          const clonedElement = clonedDoc.querySelector('[data-html2canvas-clone]') || clonedDoc.body;
          if (clonedElement) {
            clonedElement.style.fontSmooth = 'always';
            clonedElement.style.webkitFontSmoothing = 'antialiased';
            clonedElement.style.textRendering = 'optimizeLegibility';
          }
        }
      });
      
      console.log('Canvas generated successfully:', canvas.width, 'x', canvas.height);
      
      // Test if canvas has content by checking if it's not blank
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      const isBlank = imageData?.data.every((pixel, index) => {
        // Check if every pixel is white (255, 255, 255, 255) or transparent
        return index % 4 === 3 ? true : pixel === 255;
      });
      
      if (isBlank) {
        console.error('Generated canvas appears to be blank');
      }
      
      return canvas;
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    console.log('Starting high-quality download...');
    const canvas = await generateImage();
    console.log('Canvas result:', canvas);
    if (canvas) {
      // Use maximum quality PNG
      const link = document.createElement('a');
      const fileName = `${(strategy?.name || 'strategy').replace(/[^a-z0-9]/gi, '_').toLowerCase()}-open-bets.png`;
      link.download = fileName;
      
      // Generate high-quality PNG (no compression)
      link.href = canvas.toDataURL('image/png');
      
      link.click();
      console.log('High-quality download triggered:', fileName);
    } else {
      console.error('Failed to generate canvas');
    }
  };

  const handleShare = async (platform: 'twitter' | 'instagram' | 'discord') => {
    const canvas = await generateImage();
    if (canvas) {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 1.0); // Maximum quality
      });
      
      if (navigator.share) {
        try {
          await navigator.share({
            files: [new File([blob], 'strategy-bets.png', { type: 'image/png' })],
            title: `${strategy?.name} - Open Bets`,
            text: `Check out these open bets from ${strategy?.profiles.username} on TrueSharp!`
          });
        } catch (error) {
          // Fallback to platform-specific URLs
          fallbackShare(platform);
        }
      } else {
        fallbackShare(platform);
      }
    }
  };

  const fallbackShare = async (platform: string) => {
    const username = strategy?.profiles.username || 'a pro bettor';
    const strategyName = strategy?.name || 'betting strategy';
    
    if (platform === 'twitter') {
      // For Twitter, we need to generate the image and create a data URL
      const canvas = await generateImage();
      if (canvas) {
        const imageDataUrl = canvas.toDataURL('image/png');
        const text = `🎯 Check out "${strategyName}" by ${username} on TrueSharp! 📊 Professional sports betting strategies with verified performance. #SportsBetting #TrueSharp #BettingStrategy`;
        
        // Create Twitter intent with image data URL at the end
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ')}&url=${encodeURIComponent(imageDataUrl)}`;
        window.open(tweetUrl, '_blank');
        return;
      }
    }
    
    // Fallback for other platforms or if image generation fails
    const text = `🎯 Check out "${strategyName}" by ${username} on TrueSharp! 📊 Professional sports betting strategies with verified performance.`;
    const baseUrl = window.location.origin;
    let shareUrl = `${baseUrl}/marketplace`;
    
    if (strategy?.user_id) {
      shareUrl = `${baseUrl}/marketplace?seller=${strategy.user_id}`;
    }
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=SportsBetting,TrueSharp,BettingStrategy`,
      discord: `https://discord.com/channels/@me`,
      instagram: shareUrl
    };
    
    if (platform === 'instagram') {
      navigator.clipboard.writeText(`${text} ${shareUrl}`);
      alert('Message and link copied! Share on Instagram Stories or posts.');
    } else if (platform === 'discord') {
      navigator.clipboard.writeText(`${text} ${shareUrl}`);
      window.open(urls.discord, '_blank');
      alert('Message copied! Paste it in Discord.');
    } else {
      window.open(urls[platform as keyof typeof urls], '_blank');
    }
  };

  const copyLink = () => {
    const baseUrl = window.location.origin;
    let shareUrl = `${baseUrl}/marketplace`;
    
    // If we have strategy info, try to create a better URL
    if (strategy?.user_id) {
      shareUrl = `${baseUrl}/marketplace?seller=${strategy.user_id}`;
    }
    
    navigator.clipboard.writeText(shareUrl);
    alert('Strategy link copied to clipboard!');
  };

  const selectedBetsList = allBets.filter(bet => selectedBets.has(bet.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Share Strategy Bets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* Left side - Bet selection */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Open Bets ({allBets.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`flex items-center gap-2 px-3 py-1 rounded ${
                    isPreviewMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                  }`}
                >
                  {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                  {isPreviewMode ? 'Preview' : 'Clear'}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading bets...</div>
            ) : (
              <div className="space-y-3">
                {allBets.map((bet) => {
                  const display = formatBetDisplay(bet);
                  const isSelected = selectedBets.has(bet.id);
                  const status = bet.status || 'pending';
                  
                  return (
                    <div
                      key={bet.id}
                      className={`relative bg-gradient-to-r from-gray-50 to-white rounded-lg border p-3 hover:shadow-sm transition-all duration-200 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {formatBetDescription(bet)}
                            </div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {bet.sport}
                              </span>
                              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                {display.odds}
                              </span>
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {bet.bet_type?.charAt(0).toUpperCase() + bet.bet_type?.slice(1) || 'Bet'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {bet.home_team && bet.away_team ? `${bet.away_team} vs ${bet.home_team}` : display.teams} • {display.gameDate}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleBetSelection(bet.id)}
                          className={`ml-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                              : 'border-gray-300 hover:border-red-400 hover:text-red-500'
                          }`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                        status === 'won' ? 'bg-green-500' :
                        status === 'lost' ? 'bg-red-500' :
                        status === 'void' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right side - Preview */}
          <div className="w-1/2 p-6 overflow-y-auto bg-gray-50">
            <h3 className="font-semibold mb-4">Preview ({selectedBetsList.length} bets)</h3>
            
            <div ref={shareImageRef} className="bg-white p-6 rounded-lg shadow-sm" style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              textRendering: 'optimizeLegibility',
              lineHeight: '1.5'
            }}>
              {/* TrueSharp Branding */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-3">
                  <TrueSharpShield className="w-10 h-10" variant="default" />
                  <span className="text-2xl font-bold text-gray-800">TrueSharp</span>
                </div>
              </div>

              {/* Strategy Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">{strategy?.name}</h2>
                <p className="text-gray-600">by @{strategy?.profiles.username}</p>
              </div>

              {/* Bets - styled like Today's Bets */}
              <div className="space-y-4">
                {selectedBetsList.map((bet) => {
                  const display = formatBetDisplay(bet);
                  const status = bet.status || 'pending';
                  
                  return (
                    <div
                      key={bet.id}
                      className="relative bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {isPreviewMode ? (
                                  <span className="inline-block bg-gray-300 text-transparent px-2 py-1 rounded text-xs font-mono">
                                    {'●'.repeat(Math.max(12, Math.floor(formatBetDescription(bet).length * 0.8)))}
                                  </span>
                                ) : (
                                  formatBetDescription(bet)
                                )}
                              </h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {bet.sport}
                              </span>
                              {isPreviewMode ? (
                                <>
                                  <span className="inline-block bg-gray-300 text-transparent px-2 py-0.5 rounded text-xs font-mono">
                                    {'●●●●'}
                                  </span>
                                  <span className="inline-block bg-gray-300 text-transparent px-2 py-0.5 rounded text-xs font-mono">
                                    {'●●●●●'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                    {display.odds}
                                  </span>
                                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    {bet.bet_type?.charAt(0).toUpperCase() + bet.bet_type?.slice(1) || 'Bet'}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              {bet.home_team && bet.away_team ? `${bet.away_team} vs ${bet.home_team}` : display.teams} • {display.gameDate}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                        status === 'won' ? 'bg-green-500' :
                        status === 'lost' ? 'bg-red-500' :
                        status === 'void' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                    </div>
                  );
                })}
              </div>

              {selectedBetsList.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Select bets to preview
                </div>
              )}
            </div>

            {/* Share Actions */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleDownload}
                disabled={selectedBetsList.length === 0 || isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Download size={16} />
                {isGenerating ? 'Generating...' : 'Download PNG'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShare('twitter')}
                  disabled={selectedBetsList.length === 0}
                  className="flex items-center justify-center gap-2 bg-black text-white py-2 px-3 rounded hover:bg-gray-800 disabled:opacity-50"
                >
                  <Twitter size={16} />
                  X (Twitter)
                </button>
                <button
                  onClick={() => handleShare('discord')}
                  disabled={selectedBetsList.length === 0}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-3 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  <MessageCircle size={16} />
                  Discord
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleShare('instagram')}
                  disabled={selectedBetsList.length === 0}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-3 rounded hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                >
                  <Instagram size={16} />
                  Instagram
                </button>
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-3 rounded hover:bg-gray-700"
                >
                  <Copy size={16} />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}