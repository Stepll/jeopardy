/// <reference types="vite/client" />

import type { Board, PlayerSet } from './types'

declare global {
  interface Window {
    api: {
      listBoards: () => Promise<Board[]>
      saveBoard: (board: Board) => Promise<void>
      deleteBoard: (id: string) => Promise<void>
      exportBoard: (board: Board) => Promise<{ success: boolean }>
      importBoard: (newId: string) => Promise<Board | null>

      listPlayerSets: () => Promise<PlayerSet[]>
      savePlayerSet: (set: PlayerSet) => Promise<void>
      deletePlayerSet: (id: string) => Promise<void>
    }
  }
}
