console.log('Environment check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
)

export default function EnvTest() {
  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Environment Test</h1>
      <div className="rounded bg-gray-100 p-4">
        <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'}</div>
        <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'MISSING'}</div>
      </div>
    </div>
  )
}
