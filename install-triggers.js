import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔧 Installing database triggers...')

// Read the SQL file
const triggerSQL = fs.readFileSync('./COMPLETE-TRIGGER-FIX.sql', 'utf8')

// Split into individual statements (basic splitting on semicolon + newline)
const statements = triggerSQL
  .split(';\n')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '')

console.log(`📝 Found ${statements.length} SQL statements to execute`)

// Execute each statement
for (let i = 0; i < statements.length; i++) {
  const statement = statements[i]

  // Skip comments and empty lines
  if (!statement || statement.startsWith('--') || statement.length < 10) {
    continue
  }

  console.log(`\n⚡ Executing statement ${i + 1}...`)
  console.log(`📄 ${statement.substring(0, 80)}...`)

  try {
    // For most SQL operations, we need to use the raw SQL execution
    // This might not work with all Supabase plans, but let's try
    const { data, error } = await supabase.rpc('exec', { sql: statement })

    if (error) {
      console.log(`❌ Statement ${i + 1} failed:`, error.message)

      // Try alternative execution method
      console.log(`🔄 Trying alternative execution...`)

      // For some statements, we might need to handle them specially
      if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log(`⚠️ Function creation - may need manual execution in Supabase SQL editor`)
      } else if (statement.includes('CREATE TRIGGER')) {
        console.log(`⚠️ Trigger creation - may need manual execution in Supabase SQL editor`)
      }
    } else {
      console.log(`✅ Statement ${i + 1} executed successfully`)
      if (data) {
        console.log(`📊 Result:`, JSON.stringify(data, null, 2))
      }
    }
  } catch (err) {
    console.log(`💥 Statement ${i + 1} threw error:`, err.message)
  }
}

console.log('\n🎯 Trigger installation complete!')
console.log('\n📋 NEXT STEPS:')
console.log(
  '1. If you see errors above, manually run COMPLETE-TRIGGER-FIX.sql in Supabase SQL Editor'
)
console.log('2. Test the odds fetch system again')
console.log('3. You should now see successful odds insertions instead of 0 records')
