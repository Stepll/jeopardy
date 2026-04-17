export interface Question {
  points: number
  question: string
  answer: string
  isDouble?: boolean
}

export interface Category {
  title: string
  questions: Question[]
}

export interface Board {
  id: string
  name: string
  categories: Category[]
  pointValues: number[]
}

export interface Player {
  id: string
  name: string
  score: number
}

export type View = 'home' | 'game' | 'editor'

export interface PlayerSet {
  id: string
  name: string
  playerNames: string[]
}
