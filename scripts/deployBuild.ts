import { execSync } from 'child_process'

try {
  console.log('Executing the commands...')

  execSync('git pull && pnpm build && pnpm stop && pnpm start', {
    stdio: 'inherit'
  })
} catch (error) {
  console.error('Invalid environment variables', error)
  process.exit(1)
}
