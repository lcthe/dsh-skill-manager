import type { IncomingMessage, ServerResponse } from 'node:http'

declare module '@deepseek-ai/cordis' {
  interface Context {
    effect<T>(effect: () => T, name?: string): T
    webServer: {
      register(route: {
        kind: 'prefix' | 'exact'
        path: string
        handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
      }): () => void
    }
  }
}
