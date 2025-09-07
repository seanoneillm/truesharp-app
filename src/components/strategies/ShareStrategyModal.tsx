'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Download,
  Twitter,
  Instagram,
  Copy,
  Eye,
  EyeOff,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { TrueSharpShield } from '@/components/ui/truesharp-shield'
import { OpenBet } from '@/lib/queries/open-bets'

// Use OpenBet type from queries instead of local Bet type

interface Strategy {
  id: string
  name: string
  user_id: string
  profiles: {
    username: string
  }
}

interface ShareStrategyModalProps {
  isOpen: boolean
  onClose: () => void
  strategyId: string
  strategy?: Strategy
  openBets?: OpenBet[]
}

export default function ShareStrategyModal({
  isOpen,
  onClose,
  strategyId,
  strategy: propStrategy,
  openBets: propOpenBets,
}: ShareStrategyModalProps) {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [allBets, setAllBets] = useState<OpenBet[]>([])
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set())
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const shareImageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // If we have open bets as props (even if empty), use them directly
      if (propOpenBets !== undefined) {
        console.log('ShareStrategyModal - Using prop open bets:', propOpenBets)
        setAllBets(propOpenBets)
        setSelectedBets(new Set(propOpenBets.map(bet => bet.id)))
        // Still fetch strategy details if not provided as prop
        if (propStrategy) {
          setStrategy(propStrategy)
          setIsLoading(false)
        } else {
          // Fetch strategy details only
          fetchStrategyDetails()
        }
      } else if (strategyId) {
        // Fallback to API fetch if props not provided
        fetchOpenBets()
      }
    }
  }, [isOpen, strategyId, propStrategy, propOpenBets])

  const fetchStrategyDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/strategies/${strategyId}/open-bets`)
      const data = await response.json()

      console.log('ShareStrategyModal - Strategy details API Response:', data)

      // Set strategy details
      if (data.strategy) {
        setStrategy(data.strategy)
      }
    } catch (error) {
      console.error('Error fetching strategy details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOpenBets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/strategies/${strategyId}/open-bets`)
      const data = await response.json()

      console.log('ShareStrategyModal - Full API Response:', data)
      console.log('ShareStrategyModal - Response status:', response.status)
      console.log('ShareStrategyModal - OpenBets array:', data.openBets)
      console.log('ShareStrategyModal - OpenBets length:', data.openBets?.length)

      // Always set strategy and process response, even if empty
      setStrategy(data.strategy)

      if (response.ok && data.openBets) {
        const bets = data.openBets.map((item: any) => item.bets).filter(Boolean)
        console.log('ShareStrategyModal - Mapped bets:', bets)
        console.log('ShareStrategyModal - Mapped bets length:', bets.length)
        setAllBets(bets)
        setSelectedBets(new Set(bets.map((bet: OpenBet) => bet.id)))
      } else {
        // Handle case where API works but returns empty bets
        console.log('ShareStrategyModal - No bets found, setting empty arrays')
        setAllBets([])
        setSelectedBets(new Set())
      }
    } catch (error) {
      console.error('Error fetching open bets:', error)
      // Set empty state on error to stop loading
      setAllBets([])
      setSelectedBets(new Set())
    } finally {
      setIsLoading(false)
    }
  }

  const toggleBetSelection = (betId: string) => {
    const newSelected = new Set(selectedBets)
    if (newSelected.has(betId)) {
      newSelected.delete(betId)
    } else {
      newSelected.add(betId)
    }
    setSelectedBets(newSelected)
  }

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
  }

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
  }

  const formatBetDescription = (bet: OpenBet) => {
    let description = bet.bet_description || ''

    if (bet.line_value !== null && bet.line_value !== undefined) {
      if (bet.bet_type === 'spread') {
        description += ` ${bet.line_value > 0 ? '+' : ''}${bet.line_value}`
      } else if (bet.bet_type === 'total') {
        description += ` ${bet.line_value}`
      }
    }

    return description
  }

  const formatBetDisplay = (bet: OpenBet) => {
    const teams =
      bet.home_team && bet.away_team ? `${bet.away_team} @ ${bet.home_team}` : bet.bet_description

    // Format line with side first, then line value, then market type
    // e.g., "over 9.5 total runs", "under 47.5 total points", "home -3.5 spread"
    let line = ''

    // Start with side if available
    if (bet.side) {
      line = bet.side

      // Add line value if available
      if (bet.line_value !== undefined && bet.line_value !== null) {
        line += ` ${bet.line_value}`
      }

      // Add market type (bet_type) at the end
      if (bet.bet_type) {
        // Convert bet_type to more readable format
        const marketTypeMap: { [key: string]: string } = {
          total: 'total',
          spread: 'spread',
          moneyline: 'moneyline',
          player_prop: 'player prop',
          game_prop: 'game prop',
          first_half: 'first half',
          quarter: 'quarter',
          period: 'period',
        }
        const marketType = marketTypeMap[bet.bet_type] || bet.bet_type
        line += ` ${marketType}`
      }
    } else {
      // Fallback if no side available
      if (bet.line_value !== undefined && bet.line_value !== null) {
        line = `${bet.line_value}`
        if (bet.bet_type) {
          const marketTypeMap: { [key: string]: string } = {
            total: 'total',
            spread: 'spread',
            moneyline: 'moneyline',
            player_prop: 'player prop',
            game_prop: 'game prop',
            first_half: 'first half',
            quarter: 'quarter',
            period: 'period',
          }
          const marketType = marketTypeMap[bet.bet_type] || bet.bet_type
          line += ` ${marketType}`
        }
      } else {
        line = bet.bet_type || 'bet'
      }
    }

    const odds = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`

    return {
      teams,
      line,
      odds,
      gameDate: bet.game_date
        ? new Date(bet.game_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'TBD',
    }
  }

  const generateImage = async () => {
    if (!shareImageRef.current) {
      console.error('shareImageRef.current is null')
      return null
    }

    const element = shareImageRef.current
    console.log('shareImageRef element:', element)
    console.log(
      'Element dimensions:',
      element.offsetWidth,
      'x',
      element.offsetHeight
    )

    setIsGenerating(true)
    try {
      // Force a layout recalculation and wait for any pending renders
      element.style.display = 'block'
      element.style.visibility = 'visible'
      element.style.opacity = '1'
      
      // Wait longer for all content to render, especially SVGs
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Force browser reflow
      element.offsetHeight
      
      const rect = element.getBoundingClientRect()
      console.log('Element rect:', rect)

      if (rect.width === 0 || rect.height === 0) {
        console.error('Element has zero dimensions:', rect)
        return null
      }

      // Check if element is actually visible
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        console.error('Element is not visible')
        return null
      }

      // Use a more conservative scale for better compatibility
      const pixelRatio = window.devicePixelRatio || 1
      const scale = Math.min(3, pixelRatio * 2) // More conservative scaling

      console.log('Generating canvas with scale:', scale, 'pixelRatio:', pixelRatio)

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher scale for better quality (3x for ultra-crisp text)
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: 600, // Fixed width matching container
        height: element.scrollHeight + 20, // Add small buffer for content
        removeContainer: false,
        imageTimeout: 20000, // Longer timeout for high-quality rendering
        foreignObjectRendering: false,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        // Enhanced rendering options
        ignoreElements: (element) => {
          // Skip elements that might interfere with rendering
          return element.classList?.contains('shadow-lg') && element !== shareImageRef.current
        },
        onclone: function (clonedDoc) {
          console.log('html2canvas onclone - preparing high-quality image')
          
          // Find the main container
          const clonedContainer = clonedDoc.querySelector('[data-image-container]') || 
                                 clonedDoc.querySelector('div')
          
          if (clonedContainer) {
            const container = clonedContainer as HTMLElement
            
            // Enhanced container styling for better rendering
            container.style.setProperty('width', '600px', 'important')
            container.style.setProperty('padding', '40px', 'important')
            container.style.setProperty('padding-bottom', '48px', 'important')
            container.style.setProperty('box-sizing', 'border-box', 'important')
            container.style.setProperty('background-color', '#ffffff', 'important')
            container.style.setProperty('position', 'relative', 'important')
            container.style.setProperty('overflow', 'visible', 'important')
            container.style.setProperty('display', 'block', 'important')
            container.style.setProperty('visibility', 'visible', 'important')
            container.style.setProperty('border-radius', '12px', 'important')
            container.style.setProperty('box-shadow', 'none', 'important') // Remove shadow for cleaner image
          }
          
          // Enhanced text rendering for all elements
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            if (htmlEl.style) {
              htmlEl.style.setProperty('visibility', 'visible', 'important')
              htmlEl.style.setProperty('opacity', '1', 'important')
              htmlEl.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important')
              htmlEl.style.setProperty('-moz-osx-font-smoothing', 'grayscale', 'important')
              htmlEl.style.setProperty('text-rendering', 'optimizeLegibility', 'important')
              htmlEl.style.setProperty('font-kerning', 'normal', 'important')
              htmlEl.style.setProperty('font-variant-ligatures', 'common-ligatures', 'important')
              
              // Remove shadows and transforms for cleaner rendering
              htmlEl.style.setProperty('box-shadow', 'none', 'important')
              htmlEl.style.setProperty('text-shadow', 'none', 'important')
              htmlEl.style.removeProperty('transform')
              htmlEl.style.removeProperty('-webkit-transform')
              htmlEl.style.removeProperty('filter')
            }
          })
          
          // Enhanced SVG handling
          const svgs = clonedDoc.querySelectorAll('svg')
          svgs.forEach((svg) => {
            const svgEl = svg as SVGElement
            svgEl.style.setProperty('display', 'inline-block', 'important')
            svgEl.style.setProperty('vertical-align', 'middle', 'important')
            svgEl.style.setProperty('shape-rendering', 'geometricPrecision', 'important')
            svgEl.style.setProperty('text-rendering', 'geometricPrecision', 'important')
          })
          
          // Enhance text elements specifically
          const textElements = clonedDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div')
          textElements.forEach((textEl) => {
            const htmlTextEl = textEl as HTMLElement
            if (htmlTextEl.style) {
              htmlTextEl.style.setProperty('font-smooth', 'always', 'important')
              htmlTextEl.style.setProperty('-webkit-font-smoothing', 'subpixel-antialiased', 'important')
            }
          })
          
          console.log('onclone processing complete - high-quality image prepared')
        },
      })

      console.log('Canvas generated successfully:', canvas.width, 'x', canvas.height)

      // Enhanced blank canvas detection
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Failed to get canvas context')
        return null
      }
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Check for completely blank (all white or transparent)
      let nonWhitePixels = 0
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1] 
        const b = data[i + 2]
        const a = data[i + 3] || 0
        
        // Count pixels that are not white or transparent
        if (!(r === 255 && g === 255 && b === 255) && a > 0) {
          nonWhitePixels++
        }
      }
      
      console.log('Non-white pixels found:', nonWhitePixels)
      
      if (nonWhitePixels < 100) { // Threshold for "blank" canvas
        console.error('Generated canvas appears to be blank - only', nonWhitePixels, 'non-white pixels')
        return null
      }

      return canvas
    } catch (error) {
      console.error('Error generating image:', error)
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    console.log('Starting high-quality download...')
    const canvas = await generateImage()
    console.log('Canvas result:', canvas)
    if (canvas) {
      // Use maximum quality PNG
      const link = document.createElement('a')
      const fileName = `${(strategy?.name || 'strategy').replace(/[^a-z0-9]/gi, '_').toLowerCase()}-open-bets.png`
      link.download = fileName

      // Generate high-quality PNG (no compression)
      link.href = canvas.toDataURL('image/png')

      link.click()
      console.log('High-quality download triggered:', fileName)
    } else {
      console.error('Failed to generate canvas')
    }
  }


  // const fallbackShare = async (platform: string) => {
  //   const username = strategy?.profiles.username || 'a pro bettor'
  //   const strategyName = strategy?.name || 'betting strategy'

  //   if (platform === 'twitter') {
  //     // For Twitter, we need to generate the image and create a data URL
  //     const canvas = await generateImage()
  //     if (canvas) {
  //       const imageDataUrl = canvas.toDataURL('image/png')
  //       const text = `🎯 Check out "${strategyName}" by ${username} on TrueSharp! 📊 Professional sports betting strategies with verified performance. #SportsBetting #TrueSharp #BettingStrategy`

  //       // Create Twitter intent with image data URL at the end
  //       const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ')}&url=${encodeURIComponent(imageDataUrl)}`
  //       window.open(tweetUrl, '_blank')
  //       return
  //     }
  //   }

  //   // Fallback for other platforms or if image generation fails
  //   const text = `🎯 Check out "${strategyName}" by ${username} on TrueSharp! 📊 Professional sports betting strategies with verified performance.`
  //   const baseUrl = window.location.origin
  //   let shareUrl = `${baseUrl}/marketplace`

  //   if (strategy?.user_id) {
  //     shareUrl = `${baseUrl}/marketplace?seller=${strategy.user_id}`
  //   }

  //   const urls = {
  //     twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=SportsBetting,TrueSharp,BettingStrategy`,
  //     discord: `https://discord.com/channels/@me`,
  //     instagram: shareUrl,
  //   }

  //   if (platform === 'instagram') {
  //     navigator.clipboard.writeText(`${text} ${shareUrl}`)
  //     alert('Message and link copied! Share on Instagram Stories or posts.')
  //   } else if (platform === 'discord') {
  //     navigator.clipboard.writeText(`${text} ${shareUrl}`)
  //     window.open(urls.discord, '_blank')
  //     alert('Message copied! Paste it in Discord.')
  //   } else {
  //     window.open(urls[platform as keyof typeof urls], '_blank')
  //   }
  // }

  const copyLink = () => {
    const baseUrl = window.location.origin
    let shareUrl = `${baseUrl}/marketplace`

    // If we have strategy info, try to create a better URL
    if (strategy?.user_id) {
      shareUrl = `${baseUrl}/marketplace?seller=${strategy.user_id}`
    }

    navigator.clipboard.writeText(shareUrl)
    alert('Strategy link copied to clipboard!')
  }

  const selectedBetsList = allBets.filter(bet => selectedBets.has(bet.id))

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-bold">Share Strategy Bets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-auto lg:h-[70vh]">
          {/* Left side - Bet selection */}
          <div className="w-full lg:w-1/2 overflow-y-auto lg:border-r border-b lg:border-b-0 p-4 lg:p-6 max-h-[40vh] lg:max-h-full">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Open Bets ({allBets.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`flex items-center gap-2 rounded px-3 py-1 ${
                    isPreviewMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
                  }`}
                >
                  {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                  {isPreviewMode ? 'Preview' : 'Clear'}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-8 text-center">Loading bets...</div>
            ) : (
              <div className="space-y-2">
                {allBets.map(bet => {
                  const display = formatBetDisplay(bet)
                  const isSelected = selectedBets.has(bet.id)
                  const status = bet.status || 'pending'

                  return (
                    <div
                      key={bet.id}
                      className={`relative rounded-lg border bg-gradient-to-r from-gray-50 to-white p-2 transition-all duration-200 hover:shadow-sm ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-1 items-start space-x-2">
                          <div className="mt-0.5 flex-shrink-0">{getStatusIcon(status)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 text-xs font-semibold text-gray-900 truncate">
                              {formatBetDescription(bet)}
                            </div>
                            <div className="mb-1 flex items-center space-x-1 flex-wrap">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
                                {bet.sport}
                              </span>
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                                {display.odds}
                              </span>
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">
                                {bet.bet_type?.charAt(0).toUpperCase() + bet.bet_type?.slice(1) ||
                                  'Bet'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {bet.home_team && bet.away_team
                                ? `${bet.away_team} vs ${bet.home_team}`
                                : display.teams}{' '}
                              • {display.gameDate}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleBetSelection(bet.id)}
                          className={`ml-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected
                              ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                              : 'border-gray-300 hover:border-red-400 hover:text-red-500'
                          }`}
                        >
                          <X size={10} />
                        </button>
                      </div>

                      <div
                        className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-lg ${
                          status === 'won'
                            ? 'bg-green-500'
                            : status === 'lost'
                              ? 'bg-red-500'
                              : status === 'void'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                        }`}
                      ></div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right side - Preview */}
          <div className="w-full lg:w-1/2 overflow-y-auto bg-gray-50 p-4 lg:p-6 max-h-[50vh] lg:max-h-full">
            <h3 className="mb-4 font-semibold">Preview ({selectedBetsList.length} bets)</h3>
            
            {/* Scrollable container for the image preview */}
            <div className="overflow-x-auto overflow-y-visible pb-4 flex justify-center"
                 style={{ minWidth: '600px' }}
            >
              <div
                ref={shareImageRef}
                data-image-container="true"
                className="rounded-lg bg-white shadow-lg"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'optimizeLegibility',
                  fontFeatureSettings: '"liga", "kern"',
                  lineHeight: '1.6',
                  width: '600px', // Fixed width for consistent image generation
                  padding: '40px', // Increased padding for better spacing
                  paddingBottom: '48px', // Extra bottom padding to prevent cutoff
                  boxSizing: 'border-box',
                  overflow: 'visible', // Ensure content isn't clipped
                  position: 'relative',
                  backgroundColor: 'white',
                  flexShrink: 0, // Prevent shrinking
                  minHeight: 'auto', // Let content determine height
                }}
              >
              {/* Compact TrueSharp Branding */}
              <div className="mb-4 flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <TrueSharpShield className="h-8 w-8" variant="default" />
                  <div className="text-center">
                    <div className="text-xl font-black text-gray-900" style={{ letterSpacing: '-0.02em' }}>
                      TrueSharp
                    </div>
                    <div className="text-xs font-medium text-gray-500 tracking-wide">
                      PROFESSIONAL STRATEGIES
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Strategy Info */}
              <div className="mb-4 text-center border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 mb-1" style={{ letterSpacing: '-0.01em' }}>
                  {strategy?.name}
                </h2>
                <p className="text-sm text-gray-600 font-medium mb-2">
                  by <span className="text-blue-600 font-semibold">@{strategy?.profiles.username}</span>
                </p>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                  {selectedBetsList.length} Active {selectedBetsList.length === 1 ? 'Bet' : 'Bets'}
                </div>
              </div>

              {/* Compact Bets Display */}
              <div className="space-y-2">
                {selectedBetsList.map(bet => {
                  const display = formatBetDisplay(bet)
                  const status = bet.status || 'pending'

                  return (
                    <div
                      key={bet.id}
                      className="relative rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 shadow-sm"
                      style={{ padding: '16px', marginBottom: '8px' }} // More controlled spacing
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-1 items-start space-x-3">
                          <div className="mt-0.5 flex-shrink-0">{getStatusIcon(status)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold text-gray-900 leading-tight" style={{ lineHeight: '1.2' }}>
                                {isPreviewMode ? (
                                  <span className="inline-block rounded bg-gray-300 px-2 py-1 font-mono text-xs text-transparent">
                                    {'●'.repeat(
                                      Math.max(
                                        12,
                                        Math.floor(formatBetDescription(bet).length * 0.8)
                                      )
                                    )}
                                  </span>
                                ) : (
                                  formatBetDescription(bet)
                                )}
                              </h4>
                              <span
                                className={`inline-flex items-center rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(status)}`}
                                style={{ padding: '4px 8px', lineHeight: '1' }}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>

                            <div className="mb-3 flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 text-xs font-semibold"
                                    style={{ padding: '3px 8px', lineHeight: '1.2' }}>
                                {bet.sport}
                              </span>
                              {isPreviewMode ? (
                                <>
                                  <span className="inline-block rounded bg-gray-300 font-mono text-xs text-transparent"
                                        style={{ padding: '3px 8px' }}>
                                    {'●●●●'}
                                  </span>
                                  <span className="inline-block rounded bg-gray-300 font-mono text-xs text-transparent"
                                        style={{ padding: '3px 8px' }}>
                                    {'●●●●●'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="rounded-lg bg-gray-100 text-gray-700 text-xs font-bold"
                                        style={{ padding: '3px 8px', lineHeight: '1.2' }}>
                                    {display.odds}
                                  </span>
                                  <span className="rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold"
                                        style={{ padding: '3px 8px', lineHeight: '1.2' }}>
                                    {bet.bet_type?.charAt(0).toUpperCase() +
                                      bet.bet_type?.slice(1) || 'Bet'}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="text-xs text-gray-600 font-medium" style={{ lineHeight: '1.3' }}>
                              {bet.home_team && bet.away_team
                                ? `${bet.away_team} vs ${bet.home_team}`
                                : display.teams}{' '}
                              • {display.gameDate}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-lg ${
                          status === 'won'
                            ? 'bg-green-500'
                            : status === 'lost'
                              ? 'bg-red-500'
                              : status === 'void'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                        }`}
                      ></div>
                    </div>
                  )
                })}
              </div>

              {selectedBetsList.length === 0 && (
                <div className="py-8 text-center text-gray-500">Select bets to preview</div>
              )}
              </div>
            </div>

            {/* Compact Share Actions */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleDownload}
                disabled={selectedBetsList.length === 0 || isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Download size={14} />
                {isGenerating ? 'Generating...' : 'Download PNG'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled
                  className="flex items-center justify-center gap-1 rounded bg-gray-300 px-2 py-1.5 text-xs text-gray-500 cursor-not-allowed relative"
                  title="Coming Soon"
                >
                  <Twitter size={12} />
                  <span>X</span>
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold leading-none">
                    Soon
                  </div>
                </button>
                <button
                  disabled
                  className="flex items-center justify-center gap-1 rounded bg-gray-300 px-2 py-1.5 text-xs text-gray-500 cursor-not-allowed relative"
                  title="Coming Soon"
                >
                  <MessageCircle size={12} />
                  <span>Discord</span>
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold leading-none">
                    Soon
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled
                  className="flex items-center justify-center gap-1 rounded bg-gray-300 px-2 py-1.5 text-xs text-gray-500 cursor-not-allowed relative"
                  title="Coming Soon"
                >
                  <Instagram size={12} />
                  <span>Instagram</span>
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold leading-none">
                    Soon
                  </div>
                </button>
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-1 rounded bg-gray-600 px-2 py-1.5 text-xs text-white hover:bg-gray-700"
                >
                  <Copy size={12} />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
