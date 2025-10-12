// COMPREHENSIVE TEST: Single NFL Game Odds Fetch and Comparison
// This will fetch one NFL game, log everything, and compare API vs Database

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2';
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSingleNFLGame() {
    console.log('🚀 Starting single NFL game test for 2025-09-28');
    
    try {
        // Step 1: Fetch from SportsGameOdds API
        console.log('\n📡 STEP 1: Fetching from SportsGameOdds API...');
        
        const params = new URLSearchParams();
        params.append('leagueID', 'NFL');
        params.append('type', 'match');
        params.append('startsAfter', '2025-09-28');
        params.append('startsBefore', '2025-09-29');
        params.append('limit', '1');  // Only get one game
        params.append('includeAltLines', 'true');

        const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`;
        console.log('🌐 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const apiData = await response.json();
        console.log('📊 API Response success:', apiData.success);
        console.log('📊 Games found:', apiData.data?.length || 0);

        if (!apiData.data || apiData.data.length === 0) {
            console.log('❌ No games found for 2025-09-28');
            return;
        }

        const game = apiData.data[0];
        const eventID = game.eventID;
        const odds = game.odds || {};
        
        console.log('\n🏈 Game Details:');
        console.log('- Event ID:', eventID);
        console.log('- Home Team:', game.teams?.home?.names?.long || game.teams?.home?.name);
        console.log('- Away Team:', game.teams?.away?.names?.long || game.teams?.away?.name);
        console.log('- Start Time:', game.status?.startsAt);
        console.log('- Odds Count from API:', Object.keys(odds).length);

        // Step 2: Analyze API odds in detail
        console.log('\n🔍 STEP 2: Analyzing API odds structure...');
        
        const apiAnalysis = {
            totalOdds: 0,
            moneylines: 0,
            spreads: 0,
            totals: 0,
            playerProps: 0,
            altLines: 0,
            sportsbooks: new Set(),
            oddsByType: {}
        };

        for (const [oddId, odd] of Object.entries(odds)) {
            apiAnalysis.totalOdds++;
            const betType = odd.betTypeID || 'unknown';
            const marketName = odd.marketName || 'unknown';
            const sideID = odd.sideID || 'unknown';
            
            // Count by bet type
            if (!apiAnalysis.oddsByType[betType]) {
                apiAnalysis.oddsByType[betType] = 0;
            }
            apiAnalysis.oddsByType[betType]++;
            
            // Count specific types
            if (betType === 'ml') apiAnalysis.moneylines++;
            if (betType === 'sp') apiAnalysis.spreads++;
            if (betType === 'ou') apiAnalysis.totals++;
            if (marketName.toLowerCase().includes('player') || marketName.toLowerCase().includes('prop')) {
                apiAnalysis.playerProps++;
            }
            
            // Check for sportsbooks and alt lines
            const byBookmaker = odd.byBookmaker || {};
            for (const [sbName, sbData] of Object.entries(byBookmaker)) {
                apiAnalysis.sportsbooks.add(sbName);
                const altLines = sbData.altLines || [];
                apiAnalysis.altLines += altLines.length;
            }

            // Log first few odds for detailed inspection
            if (apiAnalysis.totalOdds <= 5) {
                console.log(`\n📋 Odd #${apiAnalysis.totalOdds} (${oddId}):`);
                console.log('  - Market:', marketName);
                console.log('  - Bet Type:', betType);
                console.log('  - Side:', sideID);
                console.log('  - Book Odds:', odd.bookOdds);
                console.log('  - Line/Spread:', odd.bookSpread || odd.fairSpread || odd.bookOverUnder || odd.fairOverUnder || 'NULL');
                console.log('  - Sportsbooks:', Object.keys(byBookmaker).length);
                console.log('  - Alt Lines:', Object.values(byBookmaker).reduce((sum, sb) => sum + (sb.altLines?.length || 0), 0));
            }
        }

        console.log('\n📊 API Analysis Summary:');
        console.log('- Total Odds:', apiAnalysis.totalOdds);
        console.log('- Moneylines (ml):', apiAnalysis.moneylines);
        console.log('- Spreads (sp):', apiAnalysis.spreads);  
        console.log('- Totals (ou):', apiAnalysis.totals);
        console.log('- Player Props:', apiAnalysis.playerProps);
        console.log('- Alt Lines Total:', apiAnalysis.altLines);
        console.log('- Sportsbooks:', Array.from(apiAnalysis.sportsbooks).join(', '));
        console.log('- Odds by Type:', apiAnalysis.oddsByType);

        // Step 3: Simulate the fetch process
        console.log('\n⚙️ STEP 3: Simulating fetch process...');
        
        // This simulates what the fetch function does
        const processedRecords = [];
        const processedMainLines = new Set();
        const processedAltLines = new Set();
        
        const oddsArray = Object.values(odds);
        
        for (const odd of oddsArray) {
            const oddId = odd.oddID;
            if (!oddId) continue;

            // Process main line
            const mainLineKey = `${eventID}:${oddId}`;
            if (!processedMainLines.has(mainLineKey)) {
                const record = processOddRecord(odd, oddId, eventID);
                if (record) {
                    processedRecords.push(record);
                    processedMainLines.add(mainLineKey);
                }
            }

            // Process alt lines
            const byBookmaker = odd.byBookmaker || {};
            for (const [sportsbookName, sportsbookData] of Object.entries(byBookmaker)) {
                const altLines = sportsbookData.altLines || [];
                
                for (const altLine of altLines) {
                    const lineValue = altLine.spread || altLine.overUnder || `alt-${Date.now()}`;
                    const altLineKey = `${eventID}:${oddId}:${lineValue}`;
                    
                    if (!processedAltLines.has(altLineKey)) {
                        const altOdd = {
                            ...odd,
                            bookOdds: altLine.odds,
                            bookSpread: altLine.spread,
                            bookOverUnder: altLine.overUnder,
                            byBookmaker: { [sportsbookName]: sportsbookData }
                        };
                        
                        const record = processOddRecord(altOdd, oddId, eventID);
                        if (record) {
                            processedRecords.push(record);
                            processedAltLines.add(altLineKey);
                        }
                    }
                }
            }
        }

        const processedAnalysis = {
            totalRecords: processedRecords.length,
            mainLines: processedRecords.filter(r => r.line === null).length,
            altLines: processedRecords.filter(r => r.line !== null).length,
            moneylines: processedRecords.filter(r => r.bettypeid === 'ml').length,
            spreads: processedRecords.filter(r => r.bettypeid === 'sp').length,
            totals: processedRecords.filter(r => r.bettypeid === 'ou').length,
            playerProps: processedRecords.filter(r => 
                r.marketname && (
                    r.marketname.toLowerCase().includes('player') || 
                    r.marketname.toLowerCase().includes('prop')
                )
            ).length
        };

        console.log('\n📊 Processed Records Summary:');
        console.log('- Total Records Created:', processedAnalysis.totalRecords);
        console.log('- Main Lines (NULL):', processedAnalysis.mainLines);
        console.log('- Alt Lines (non-NULL):', processedAnalysis.altLines);
        console.log('- Moneylines:', processedAnalysis.moneylines);
        console.log('- Spreads:', processedAnalysis.spreads);
        console.log('- Totals:', processedAnalysis.totals);
        console.log('- Player Props:', processedAnalysis.playerProps);

        // Step 4: Check what's actually in the database
        console.log('\n💾 STEP 4: Checking database for this game...');
        
        const { data: dbOdds, error } = await supabase
            .from('odds')
            .select('*')
            .eq('eventid', eventID);

        if (error) {
            console.error('❌ Database query error:', error);
            return;
        }

        const dbAnalysis = {
            totalRecords: dbOdds?.length || 0,
            mainLines: dbOdds?.filter(r => r.line === null).length || 0,
            altLines: dbOdds?.filter(r => r.line !== null).length || 0,
            moneylines: dbOdds?.filter(r => r.bettypeid === 'ml').length || 0,
            spreads: dbOdds?.filter(r => r.bettypeid === 'sp').length || 0,
            totals: dbOdds?.filter(r => r.bettypeid === 'ou').length || 0,
            playerProps: dbOdds?.filter(r => 
                r.marketname && (
                    r.marketname.toLowerCase().includes('player') || 
                    r.marketname.toLowerCase().includes('prop')
                )
            ).length || 0
        };

        console.log('\n📊 Database Analysis:');
        console.log('- Total Records in DB:', dbAnalysis.totalRecords);
        console.log('- Main Lines (NULL):', dbAnalysis.mainLines);
        console.log('- Alt Lines (non-NULL):', dbAnalysis.altLines);
        console.log('- Moneylines:', dbAnalysis.moneylines);
        console.log('- Spreads:', dbAnalysis.spreads);
        console.log('- Totals:', dbAnalysis.totals);
        console.log('- Player Props:', dbAnalysis.playerProps);

        // Step 5: Compare API vs Processed vs Database
        console.log('\n🔍 STEP 5: COMPARISON ANALYSIS');
        console.log('═══════════════════════════════════════');
        
        console.log('\n📊 API → Processed → Database:');
        console.log(`Total:     ${apiAnalysis.totalOdds} → ${processedAnalysis.totalRecords} → ${dbAnalysis.totalRecords}`);
        console.log(`Moneylines: ${apiAnalysis.moneylines} → ${processedAnalysis.moneylines} → ${dbAnalysis.moneylines}`);
        console.log(`Spreads:    ${apiAnalysis.spreads} → ${processedAnalysis.spreads} → ${dbAnalysis.spreads}`);
        console.log(`Totals:     ${apiAnalysis.totals} → ${processedAnalysis.totals} → ${dbAnalysis.totals}`);
        console.log(`PlayerProps:${apiAnalysis.playerProps} → ${processedAnalysis.playerProps} → ${dbAnalysis.playerProps}`);
        console.log(`Alt Lines:  ${apiAnalysis.altLines} → ${processedAnalysis.altLines} → ${dbAnalysis.altLines}`);

        // Calculate loss percentages
        const apiToProcessedLoss = ((apiAnalysis.totalOdds - processedAnalysis.totalRecords) / apiAnalysis.totalOdds * 100).toFixed(1);
        const processedToDbLoss = processedAnalysis.totalRecords > 0 ? 
            ((processedAnalysis.totalRecords - dbAnalysis.totalRecords) / processedAnalysis.totalRecords * 100).toFixed(1) : 0;
        const overallLoss = ((apiAnalysis.totalOdds - dbAnalysis.totalRecords) / apiAnalysis.totalOdds * 100).toFixed(1);

        console.log('\n📉 Loss Analysis:');
        console.log(`API → Processed: ${apiToProcessedLoss}% loss`);
        console.log(`Processed → DB: ${processedToDbLoss}% loss`);  
        console.log(`Overall: ${overallLoss}% loss`);

        // Identify specific issues
        console.log('\n🚨 Issues Identified:');
        if (apiAnalysis.moneylines > 0 && dbAnalysis.moneylines === 0) {
            console.log('❌ CRITICAL: All moneylines lost between API and database!');
        }
        if (processedAnalysis.totalRecords > dbAnalysis.totalRecords) {
            console.log('❌ Records lost during database insertion (trigger/constraint issues)');
        }
        if (apiAnalysis.totalOdds > processedAnalysis.totalRecords) {
            console.log('❌ Records lost during processing (fetch logic issues)');
        }
        if (dbAnalysis.totalRecords === 0) {
            console.log('❌ CRITICAL: No records saved to database at all!');
        }

        // Sample database records for inspection
        if (dbAnalysis.totalRecords > 0) {
            console.log('\n📋 Sample Database Records:');
            dbOdds.slice(0, 3).forEach((record, i) => {
                console.log(`${i + 1}. eventid: ${record.eventid}, oddid: ${record.oddid}, line: ${record.line}, type: ${record.bettypeid}, market: ${record.marketname}`);
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Helper function to simulate processOddRecord
function processOddRecord(odd, oddId, gameId) {
    const marketName = odd.marketName || 'unknown';
    const betType = odd.betTypeID || 'unknown';
    
    const record = {
        eventid: gameId,
        sportsbook: 'SportsGameOdds',
        marketname: marketName.length > 50 ? marketName.substring(0, 50) : marketName,
        bettypeid: betType.length > 50 ? betType.substring(0, 50) : betType,
        sideid: (odd.sideID || '').length > 50 ? (odd.sideID || '').substring(0, 50) : odd.sideID,
        oddid: oddId,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    };

    // Handle line values based on bet type
    if (betType === 'ml') {
        record.line = null;  // Moneylines have no line
    } else if (betType === 'sp') {
        record.line = (odd.bookSpread || odd.fairSpread) || null;
    } else if (betType === 'ou') {
        record.line = (odd.bookOverUnder || odd.fairOverUnder) || null;
    } else {
        record.line = (odd.bookSpread || odd.fairSpread || odd.bookOverUnder || odd.fairOverUnder) || null;
    }

    // Normalize line value
    if (record.line === null || record.line === undefined || record.line === 'null' || record.line === '') {
        record.line = null;
    } else {
        record.line = String(record.line);
    }

    record.bookodds = safeParseOdds(odd.bookOdds);

    return record;
}

function safeParseOdds(value) {
    if (!value) return null;
    const parsed = parseFloat(String(value));
    if (isNaN(parsed)) return null;
    if (Math.abs(parsed) > 50000) return null;
    return Math.round(Math.min(Math.max(parsed, -9999), 9999));
}

// Run the test
if (require.main === module) {
    testSingleNFLGame();
}

module.exports = { testSingleNFLGame };