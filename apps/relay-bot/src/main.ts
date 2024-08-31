if (!global.WebSocket) {
  ;(global as any).WebSocket ??= require('isomorphic-ws')
}

import { startService, stopService } from './relay-bot'

const main = async () => {
  const service = await startService()

  process.on('SIGINT', () => {
    stopService(service)
    process.exit(0)
  })
}

main()
