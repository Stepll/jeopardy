import { create } from 'zustand'
import type { Board, Player, PlayerSet, View } from '../types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

interface ActiveQuestion {
  categoryIndex: number
  questionIndex: number
}

interface GameState {
  view: View
  boards: Board[]
  activeBoard: Board | null
  players: Player[]
  answeredCells: Set<string>
  activeQuestion: ActiveQuestion | null
  editingBoard: Board | null
  playerSets: PlayerSet[]

  setView: (view: View) => void
  loadBoards: () => Promise<void>
  saveBoard: (board: Board) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
  exportBoard: (board: Board) => Promise<boolean>
  importBoard: () => Promise<void>
  startGame: (board: Board, players: Player[]) => void
  setActiveQuestion: (q: ActiveQuestion | null) => void
  markAnswered: (categoryIndex: number, questionIndex: number) => void
  updateScore: (playerId: string, delta: number) => void
  setEditingBoard: (board: Board | null) => void
  createNewBoard: () => Board

  loadPlayerSets: () => Promise<void>
  savePlayerSet: (name: string, playerNames: string[]) => Promise<void>
  deletePlayerSet: (id: string) => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  view: 'home',
  boards: [],
  activeBoard: null,
  players: [],
  answeredCells: new Set(),
  activeQuestion: null,
  editingBoard: null,
  playerSets: [],

  setView: (view) => set({ view }),

  loadBoards: async () => {
    const boards = await window.api.listBoards()
    set({ boards })
  },

  saveBoard: async (board) => {
    await window.api.saveBoard(board)
    const boards = await window.api.listBoards()
    set({ boards })
  },

  deleteBoard: async (id) => {
    await window.api.deleteBoard(id)
    set((state) => ({ boards: state.boards.filter((b) => b.id !== id) }))
  },

  exportBoard: async (board) => {
    const result = await window.api.exportBoard(board)
    return result.success
  },

  importBoard: async () => {
    const newId = generateId()
    const board = await window.api.importBoard(newId)
    if (!board) return
    await window.api.saveBoard(board)
    const boards = await window.api.listBoards()
    set({ boards })
  },

  startGame: (board, players) => {
    set({ activeBoard: board, players, answeredCells: new Set(), view: 'game' })
  },

  setActiveQuestion: (q) => set({ activeQuestion: q }),

  markAnswered: (categoryIndex, questionIndex) => {
    set((state) => {
      const next = new Set(state.answeredCells)
      next.add(`${categoryIndex}-${questionIndex}`)
      return { answeredCells: next }
    })
  },

  updateScore: (playerId, delta) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, score: p.score + delta } : p
      )
    }))
  },

  setEditingBoard: (board) =>
    set({ editingBoard: board, view: board ? 'editor' : 'home' }),

  createNewBoard: () => {
    const pointValues = [100, 200, 300, 400, 500]
    return {
      id: generateId(),
      name: 'New Board',
      pointValues,
      categories: Array.from({ length: 5 }, (_, i) => ({
        title: `Category ${i + 1}`,
        questions: pointValues.map((points) => ({ points, question: '', answer: '' }))
      }))
    }
  },

  loadPlayerSets: async () => {
    const playerSets = await window.api.listPlayerSets()
    set({ playerSets })
  },

  savePlayerSet: async (name, playerNames) => {
    const set_: PlayerSet = { id: generateId(), name, playerNames }
    await window.api.savePlayerSet(set_)
    await get().loadPlayerSets()
  },

  deletePlayerSet: async (id) => {
    await window.api.deletePlayerSet(id)
    set((state) => ({ playerSets: state.playerSets.filter((s) => s.id !== id) }))
  }
}))
