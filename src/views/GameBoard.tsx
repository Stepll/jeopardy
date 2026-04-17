import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { playTileOpen, playGameOver } from '../utils/sounds'

export default function GameBoard() {
  const { activeBoard, players, answeredCells, setActiveQuestion, setView } = useGameStore()

  if (!activeBoard) return null

  const allAnswered = activeBoard.categories.every((_, ci) =>
    activeBoard.pointValues.every((__, qi) => answeredCells.has(`${ci}-${qi}`))
  )

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (allAnswered) playGameOver()
  }, [allAnswered])

  const handleCellClick = (ci: number, qi: number) => {
    playTileOpen()
    setActiveQuestion({ categoryIndex: ci, questionIndex: qi })
  }

  return (
    <div style={styles.container}>
      <div style={styles.scoreboard}>
        {players.map((player) => (
          <div key={player.id} style={styles.scoreCard}>
            <div style={styles.playerName}>{player.name}</div>
            <div style={styles.playerScore}>${player.score.toLocaleString()}</div>
          </div>
        ))}
        <button style={styles.homeBtn} onClick={() => setView('home')}>
          ← Home
        </button>
      </div>

      <div
        style={{
          ...styles.board,
          gridTemplateColumns: `repeat(${activeBoard.categories.length}, 1fr)`
        }}
      >
        {activeBoard.categories.map((cat, ci) => (
          <div key={`header-${ci}`} style={styles.categoryHeader}>
            {cat.title.toUpperCase()}
          </div>
        ))}

        {activeBoard.pointValues.map((pts, qi) =>
          activeBoard.categories.map((cat, ci) => {
            const key = `${ci}-${qi}`
            const answered = answeredCells.has(key)
            const isDouble = cat.questions[qi]?.isDouble ?? false
            return (
              <div
                key={key}
                className={answered ? '' : 'cell-active'}
                style={{
                  ...styles.cell,
                  ...(answered ? styles.cellAnswered : isDouble ? styles.cellDouble : styles.cellValue)
                }}
                onClick={() => handleCellClick(ci, qi)}
              >
                {answered ? '' : isDouble ? '×2' : `$${pts}`}
              </div>
            )
          })
        )}
      </div>

      {allAnswered && (
        <div style={styles.gameOver}>
          <h2 style={styles.gameOverTitle}>Game Over!</h2>
          <div style={styles.finalScores}>
            {[...players]
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <div key={p.id} style={styles.finalScore}>
                  <span style={styles.rank}>{i + 1}.</span>
                  <span style={styles.finalName}>{p.name}</span>
                  <span style={styles.finalPoints}>${p.score.toLocaleString()}</span>
                </div>
              ))}
          </div>
          <button style={styles.playAgainBtn} onClick={() => setView('home')}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    gap: '8px',
    overflow: 'hidden'
  },
  scoreboard: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '10px 16px',
    flexShrink: 0
  },
  scoreCard: {
    textAlign: 'center',
    flex: 1,
    padding: '4px 12px',
    borderRight: '1px solid rgba(255,255,255,0.08)'
  },
  playerName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginBottom: '2px'
  },
  playerScore: {
    color: '#FFD700',
    fontSize: '22px',
    fontWeight: '900',
    textShadow: '0 0 16px rgba(255,215,0,0.5)'
  },
  homeBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.7)',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    flexShrink: 0,
    letterSpacing: '0.5px'
  },
  board: {
    flex: 1,
    display: 'grid',
    gap: '6px',
    overflow: 'hidden'
  },
  categoryHeader: {
    background: 'linear-gradient(160deg, #1a198f 0%, #0e0d6a 100%)',
    border: '1px solid rgba(80,78,220,0.5)',
    borderBottom: '2px solid rgba(255,215,0,0.25)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 6px',
    color: 'white',
    fontWeight: '800',
    fontSize: '13px',
    textAlign: 'center',
    letterSpacing: '1.2px',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
  },
  cell: {
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '900',
    letterSpacing: '1px',
    userSelect: 'none'
  },
  cellValue: {
    background: 'linear-gradient(160deg, #2422d4 0%, #1614a8 100%)',
    border: '1px solid rgba(80,78,220,0.6)',
    color: '#FFD700',
    cursor: 'pointer',
    boxShadow: '0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    textShadow: '0 0 20px rgba(255,215,0,0.5)'
  },
  cellDouble: {
    background: 'linear-gradient(160deg, #5b21b6 0%, #4c1d95 100%)',
    border: '1px solid rgba(167,139,250,0.6)',
    color: '#e9d5ff',
    cursor: 'pointer',
    boxShadow: '0 6px 24px rgba(0,0,0,0.5), 0 0 20px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  cellAnswered: {
    background: 'rgba(8,6,24,0.7)',
    border: '1px solid rgba(255,255,255,0.04)',
    color: 'transparent',
    cursor: 'default',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
  },
  gameOver: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(4,3,16,0.92)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '28px',
    zIndex: 200
  },
  gameOverTitle: {
    color: '#FFD700',
    fontSize: '60px',
    fontWeight: '900',
    letterSpacing: '8px',
    textShadow: '0 0 40px rgba(255,215,0,0.5), 0 4px 16px rgba(0,0,0,0.5)'
  },
  finalScores: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: '360px'
  },
  finalScore: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '14px 20px',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
  },
  rank: {
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: '900',
    width: '28px',
    textShadow: '0 0 12px rgba(255,215,0,0.5)'
  },
  finalName: {
    color: 'white',
    fontSize: '19px',
    fontWeight: '600',
    flex: 1
  },
  finalPoints: {
    color: '#FFD700',
    fontSize: '21px',
    fontWeight: '900',
    textShadow: '0 0 12px rgba(255,215,0,0.4)'
  },
  playAgainBtn: {
    padding: '14px 52px',
    fontSize: '17px',
    fontWeight: '900',
    letterSpacing: '3px',
    background: 'linear-gradient(135deg, #FFD700 0%, #f0c000 100%)',
    color: '#0a0820',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    boxShadow: '0 4px 24px rgba(255,215,0,0.35)'
  }
}
