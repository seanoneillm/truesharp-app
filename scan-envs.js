import fs from 'fs'
import { glob } from 'glob'
import path from 'path'

// 1. Scan all JS/TS files for process.env.*
const files = glob.sync('**/*.{js,ts,jsx,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**'],
})

let usedVars = new Set()

files.forEach(file => {
  const fullPath = path.resolve(file)

  // Skip if it's a directory
  if (fs.statSync(fullPath).isDirectory()) return

  const content = fs.readFileSync(fullPath, 'utf8')
  const matches = content.match(/process\.env\.([A-Z0-9_]+)/g)
  if (matches) {
    matches.forEach(m => usedVars.add(m.replace('process.env.', '')))
  }
})

// 2. Load .env.example (all expected keys)
const envExamplePath = path.resolve('.env.example')
const exampleVars = new Set()
if (fs.existsSync(envExamplePath)) {
  const lines = fs.readFileSync(envExamplePath, 'utf8').split('\n')
  lines.forEach(line => {
    if (line.startsWith('#') || !line.includes('=')) return
    const key = line.split('=')[0].trim()
    exampleVars.add(key)
  })
}

// 3. Compare sets
console.log('🔍 Env vars used in code:')
console.log([...usedVars].sort().join('\n'))

console.log('\n📦 Env vars listed in .env.example:')
console.log([...exampleVars].sort().join('\n'))

const missingInExample = [...usedVars].filter(v => !exampleVars.has(v))
if (missingInExample.length) {
  console.log('\n⚠️ Vars used in code but missing from .env.example:')
  console.log(missingInExample.join('\n'))
} else {
  console.log('\n✅ All used vars are documented in .env.example')
}
