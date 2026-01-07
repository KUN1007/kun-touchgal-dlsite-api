/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line no-undef
const path = require('path')

// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'kun-touchgal-dlsite-api',
      port: 8686,
      // eslint-disable-next-line no-undef
      cwd: path.join(__dirname),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      script: './dist/index.js'
    }
  ]
}
