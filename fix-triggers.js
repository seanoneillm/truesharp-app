const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Supabase connection
const supabase = createClient(
  'https://udsbzcyzcrykbcvyjhok.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkc2J6Y3l6Y3J5a2JjdnlqaG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0NzU1NTEsImV4cCI6MjA0MTA1MTU1MX0.KCC9JmWA20U4s9xwJzAZfvYl5Z7A7c9Mjh_Fc1VsJ8g'
)

async function executeSQLFile(filename) {
  try {
    const sql = fs.readFileSync(filename, 'utf8')
    console.log(`\n🔧 Executing: ${filename}`)
    console.log('SQL:', sql.substring(0, 200) + '...')

    const { data, error } = await supabase.rpc('exec_sql', { query: sql })

    if (error) {
      console.error('❌ Error:', error.message)
      return false
    } else {
      console.log('✅ Success:', data)
      return true
    }
  } catch (err) {
    console.error('❌ File error:', err.message)
    return false
  }
}

async function fixTriggers() {
  console.log('🚀 Starting trigger fix process...')

  const steps = [
    'step1-cleanup-triggers.sql',
    'step2-create-open-odds-function.sql',
    'step3-create-odds-function.sql',
    'step4-create-triggers-constraints.sql',
  ]

  for (const step of steps) {
    const success = await executeSQLFile(step)
    if (!success) {
      console.log(`❌ Failed at step: ${step}`)
      break
    }
    // Wait a moment between steps
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('🎉 Trigger fix process completed!')
}

fixTriggers().catch(console.error)
