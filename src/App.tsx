import { useGameStore } from './store/gameStore'
import Home from './views/Home'
import GameBoard from './views/GameBoard'
import QuestionModal from './views/QuestionModal'
import Editor from './views/Editor'

export default function App() {
  const view = useGameStore((state) => state.view)
  return (
    <>
      {view === 'home' && <Home />}
      {view === 'game' && <GameBoard />}
      {view === 'game' && <QuestionModal />}
      {view === 'editor' && <Editor />}
    </>
  )
}
