if (!global.WebSocket) {
  ;(global as any).WebSocket ??= require('isomorphic-ws')
}

import { startService, stopService } from './relay-bot'

import setup from './setup'

const main = async () => {
  if (process.env.RUN_SETUP === 'true') {
    console.log('🔄 Setting up...')
    await setup()
    return
  }
  const service = await startService()

  process.on('SIGINT', () => {
    stopService(service)
    process.exit(0)
  })
}

main()
