import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { playCorrect, playWrong, playDailyDouble } from '../utils/sounds'

type Phase = 'select-player' | 'set-bet' | 'question' | 'answer'

export default function QuestionModal() {
  const { activeBoard, players, activeQuestion, setActiveQuestion, markAnswered, updateScore } =
    useGameStore()

  const [phase, setPhase] = useState<Phase>('question')
  const [penalizedPlayers, setPenalizedPlayers] = useState<Set<string>>(new Set())
  const [doublePlayerId, setDoublePlayerId] = useState<string | null>(null)
  const [bet, setBet] = useState(0)
  const [betInput, setBetInput] = useState('')

  useEffect(() => {
    if (!activeQuestion || !activeBoard) return
    const { categoryIndex: ci, questionIndex: qi } = activeQuestion
    const q = activeBoard.categories[ci].questions[qi]
    setPhase(q.isDouble ? 'select-player' : 'question')
    setDoublePlayerId(null)
    setBet(0)
    setBetInput('')
    setPenalizedPlayers(new Set())
    if (q.isDouble) playDailyDouble()
  }, [activeQuestion])

  if (!activeQuestion || !activeBoard) return null

  const { categoryIndex: ci, questionIndex: qi } = activeQuestion
  const category = activeBoard.categories[ci]
  const question = category.questions[qi]
  const doublePlayer = players.find((p) => p.id === doublePlayerId) ?? null
  const maxBet = doublePlayer ? Math.max(doublePlayer.score, 1) : 1

  const handleClose = () => {
    setActiveQuestion(null)
  }

  const handleCorrect = (playerId: string) => {
    playCorrect()
    updateScore(playerId, question.points)
    markAnswered(ci, qi)
    handleClose()
  }

  const handleWrong = (playerId: string) => {
    if (penalizedPlayers.has(playerId)) return
    playWrong()
    updateScore(playerId, -question.points)
    setPenalizedPlayers((prev) => new Set(prev).add(playerId))
  }

  const handleNoOne = () => {
    markAnswered(ci, qi)
    handleClose()
  }

  const handleSelectPlayer = (playerId: string) => {
    setDoublePlayerId(playerId)
    setPhase('set-bet')
  }

  const handleConfirmBet = () => {
    const parsed = parseInt(betInput)
    if (isNaN(parsed) || parsed < 1) return
    setBet(Math.min(parsed, maxBet))
    setPhase('question')
  }

  const handleDoubleCorrect = () => {
    if (!doublePlayerId) return
    playCorrect()
    updateScore(doublePlayerId, bet)
    markAnswered(ci, qi)
    handleClose()
  }

  const handleDoubleWrong = () => {
    if (!doublePlayerId) return
    playWrong()
    updateScore(doublePlayerId, -bet)
    markAnswered(ci, qi)
    handleClose()
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={handleClose}>×</button>

        <div style={styles.header}>
          <span style={styles.category}>{category.title.toUpperCase()}</span>
          {question.isDouble ? (
            <span style={styles.doubleBadge}>×2</span>
          ) : (
            <span style={styles.points}>${question.points}</span>
          )}
        </div>

        {/* SELECT PLAYER */}
        {phase === 'select-player' && (
          <div style={styles.doubleSection}>
            <div style={styles.doubleTitle}>DAILY DOUBLE</div>
            <p style={styles.scoringLabel}>Хто відповідає?</p>
            <div style={styles.playerBtns}>
              {players.map((player) => (
                <button
                  key={player.id}
                  style={styles.selectPlayerBtn}
                  onClick={() => handleSelectPlayer(player.id)}
                >
                  <span style={styles.selectPlayerName}>{player.name}</span>
                  <span style={styles.selectPlayerScore}>${player.score.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SET BET */}
        {phase === 'set-bet' && doublePlayer && (
          <div style={styles.doubleSection}>
            <div style={styles.doubleTitle}>DAILY DOUBLE</div>
            <p style={styles.scoringLabel}>
              {doublePlayer.name} — Ставка (макс. ${maxBet.toLocaleString()})
            </p>
            <div style={styles.betRow}>
              <input
                style={styles.betInput}
                type="number"
                min={1}
                max={maxBet}
                value={betInput}
                onChange={(e) => setBetInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmBet()}
                placeholder={`1 – ${maxBet}`}
                autoFocus
              />
              <button style={styles.confirmBetBtn} onClick={handleConfirmBet}>
                Підтвердити →
              </button>
            </div>
          </div>
        )}

        {/* QUESTION + ANSWER */}
        {(phase === 'question' || phase === 'answer') && (
          <>
            {question.isDouble && doublePlayer && (
              <div style={styles.betBanner}>
                {doublePlayer.name} ставить{' '}
                <strong style={{ color: '#FFD700' }}>${bet.toLocaleString()}</strong>
              </div>
            )}

            <div style={styles.questionText}>{question.question}</div>

            {phase === 'answer' ? (
              <>
                <div style={styles.answerText}>{question.answer}</div>
                <div style={styles.scoringSection}>
                  {question.isDouble ? (
                    <div style={styles.playerBtns}>
                      <button style={styles.correctBtn} onClick={handleDoubleCorrect}>
                        ✓ Вірно (+${bet.toLocaleString()})
                      </button>
                      <button style={styles.doubleWrongBtn} onClick={handleDoubleWrong}>
                        ✗ Невірно (−${bet.toLocaleString()})
                      </button>
                    </div>
                  ) : (
                    <>
                      <p style={styles.scoringLabel}>Who answered correctly?</p>
                      <div style={styles.playerBtns}>
                        {players.map((player) => {
                          const penalized = penalizedPlayers.has(player.id)
                          return (
                            <div key={player.id} style={styles.playerBtnGroup}>
                              <button
                                style={penalized ? styles.penalizedBtn : styles.correctBtn}
                                disabled={penalized}
                                onClick={() => !penalized && handleCorrect(player.id)}
                              >
                                {penalized ? `−$${question.points}` : `✓ ${player.name}`}
                              </button>
                              {!penalized && (
                                <button
                                  style={styles.wrongBtn}
                                  onClick={() => handleWrong(player.id)}
                                >
                                  −${question.points}
                                </button>
                              )}
                            </div>
                          )
                        })}
                        <button style={styles.noOneBtn} onClick={handleNoOne}>
                          No one / Skip
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <button style={styles.revealBtn} onClick={() => setPhase('answer')}>
                Reveal Answer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(4,3,16,0.9)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  modal: {
    background: 'linear-gradient(160deg, #1a18c4 0%, #0f0e8a 100%)',
    border: '1px solid rgba(255,215,0,0.4)',
    borderRadius: '20px',
    padding: '48px',
    maxWidth: '800px',
    width: '90%',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255,215,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  closeBtn: {
    position: 'absolute',
    top: '14px',
    right: '18px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '50%',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '22px',
    cursor: 'pointer',
    lineHeight: '1',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px'
  },
  category: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '2.5px',
    textTransform: 'uppercase'
  },
  points: {
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: '900',
    textShadow: '0 0 16px rgba(255,215,0,0.5)',
    background: 'rgba(255,215,0,0.1)',
    padding: '2px 12px',
    borderRadius: '20px',
    border: '1px solid rgba(255,215,0,0.25)'
  },
  doubleBadge: {
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: '900',
    textShadow: '0 0 16px rgba(255,215,0,0.6)',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(109,40,217,0.3) 100%)',
    padding: '2px 14px',
    borderRadius: '20px',
    border: '1px solid rgba(167,139,250,0.5)'
  },
  questionText: {
    color: 'white',
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: 1.4,
    marginBottom: '32px',
    minHeight: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textShadow: '0 2px 8px rgba(0,0,0,0.4)'
  },
  answerText: {
    color: '#FFD700',
    fontSize: '26px',
    fontWeight: '700',
    marginBottom: '28px',
    padding: '16px 24px',
    background: 'rgba(255,215,0,0.08)',
    borderRadius: '12px',
    border: '1px solid rgba(255,215,0,0.25)',
    textShadow: '0 0 20px rgba(255,215,0,0.4)'
  },
  scoringSection: {
    marginTop: '8px'
  },
  scoringLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '11px',
    marginBottom: '14px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontWeight: '700'
  },
  playerBtns: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  playerBtnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    alignItems: 'center'
  },
  correctBtn: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    border: 'none',
    color: 'white',
    padding: '11px 22px',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '800',
    minWidth: '130px',
    boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
    letterSpacing: '0.3px'
  },
  penalizedBtn: {
    background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
    border: '1px solid rgba(220,53,69,0.5)',
    color: '#fca5a5',
    padding: '11px 22px',
    borderRadius: '9px',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: '800',
    minWidth: '130px',
    opacity: 0.75,
    letterSpacing: '0.3px'
  },
  wrongBtn: {
    background: 'rgba(220,53,69,0.15)',
    border: '1px solid rgba(220,53,69,0.3)',
    color: '#ff7070',
    padding: '5px 10px',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    minWidth: '80px'
  },
  doubleWrongBtn: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    border: 'none',
    color: 'white',
    padding: '11px 22px',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '800',
    minWidth: '130px',
    boxShadow: '0 4px 16px rgba(220,38,38,0.3)',
    letterSpacing: '0.3px'
  },
  noOneBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.5)',
    padding: '11px 22px',
    borderRadius: '9px',
    cursor: 'pointer',
    fontSize: '13px',
    alignSelf: 'flex-start',
    fontWeight: '600'
  },
  revealBtn: {
    padding: '14px 52px',
    fontSize: '17px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #FFD700 0%, #f0c000 100%)',
    color: '#0a0820',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    boxShadow: '0 6px 28px rgba(255,215,0,0.35)'
  },
  /* Daily Double specific */
  doubleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 0 16px'
  },
  doubleTitle: {
    color: '#FFD700',
    fontSize: '36px',
    fontWeight: '900',
    letterSpacing: '6px',
    textTransform: 'uppercase',
    textShadow: '0 0 30px rgba(255,215,0,0.6)',
  },
  selectPlayerBtn: {
    background: 'linear-gradient(160deg, #2422d4 0%, #1614a8 100%)',
    border: '1px solid rgba(167,139,250,0.4)',
    borderRadius: '12px',
    padding: '14px 28px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    minWidth: '130px',
    transition: 'transform 0.1s'
  },
  selectPlayerName: {
    color: 'white',
    fontSize: '15px',
    fontWeight: '800',
    letterSpacing: '0.5px'
  },
  selectPlayerScore: {
    color: '#FFD700',
    fontSize: '13px',
    fontWeight: '700',
    textShadow: '0 0 8px rgba(255,215,0,0.4)'
  },
  betRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  betInput: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,215,0,0.4)',
    borderRadius: '9px',
    color: 'white',
    fontSize: '22px',
    fontWeight: '700',
    padding: '10px 16px',
    width: '160px',
    textAlign: 'center',
    outline: 'none'
  },
  confirmBetBtn: {
    background: 'linear-gradient(135deg, #FFD700 0%, #f0c000 100%)',
    border: 'none',
    borderRadius: '9px',
    color: '#0a0820',
    fontSize: '15px',
    fontWeight: '900',
    padding: '10px 20px',
    cursor: 'pointer',
    letterSpacing: '0.5px'
  },
  betBanner: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '12px',
    background: 'rgba(124,58,237,0.15)',
    border: '1px solid rgba(167,139,250,0.3)',
    borderRadius: '8px',
    padding: '8px 18px'
  }
}
