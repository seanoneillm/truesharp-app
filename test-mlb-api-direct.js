const fetch = require('node-fetch');

// Test MLB odds fetch specifically
async function testMLBOdds() {
  try {
    const API_KEY = process.env.ODDS_API_KEY || 'YOUR_API_KEY';
    
    console.log('🔧 Testing MLB odds fetch...\n');
    
    // Test direct API call for MLB
    const baseURL = 'https://api.sportsgameodds.com/v2';
    const url = `${baseURL}/odds?apiKey=${API_KEY}&sportID=BASEBALL&leagueID=MLB`;
    
    console.log('📞 API URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log(`📊 MLB API Response:`, {
      status: response.status,
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: data?.length || 'N/A'
    });
    
    if (data && data.length > 0) {
      console.log('\n📋 First MLB game:');
      const firstGame = data[0];
      console.log({
        eventId: firstGame.eventId,
        homeTeam: firstGame.homeTeam,
        awayTeam: firstGame.awayTeam,
        eventTime: firstGame.eventTime,
        linesCount: firstGame.lines?.length || 0
      });
      
      if (firstGame.lines && firstGame.lines.length > 0) {
        console.log('\n📊 Sample lines:');
        firstGame.lines.slice(0, 3).forEach((line, idx) => {
          console.log(`   ${idx + 1}. ${line.oddId} - ${line.line} - ${line.sportsbook}`);
        });
      } else {
        console.log('❌ No lines found for first game!');
      }
      
    } else {
      console.log('❌ No MLB data returned from API');
      
      // Try alternative endpoints
      console.log('\n🔄 Trying alternative MLB endpoint...');
      const altUrl = `${baseURL}/odds?apiKey=${API_KEY}&sport=baseball_mlb`;
      const altResponse = await fetch(altUrl);
      const altData = await altResponse.json();
      
      console.log('📊 Alternative endpoint result:', {
        status: altResponse.status,
        hasData: !!altData,
        length: altData?.length || 'N/A'
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testMLBOdds();