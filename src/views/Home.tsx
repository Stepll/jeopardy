import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Player } from '../types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function Home() {
  const {
    boards, loadBoards, deleteBoard, startGame, setEditingBoard, createNewBoard,
    exportBoard, importBoard,
    playerSets, loadPlayerSets, savePlayerSet, deletePlayerSet
  } = useGameStore()

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2'])
  const [saveSetName, setSaveSetName] = useState('')
  const [showSaveSet, setShowSaveSet] = useState(false)
  const [exportingId, setExportingId] = useState<string | null>(null)

  useEffect(() => {
    loadBoards()
    loadPlayerSets()
  }, [])

  const selectedBoard = boards.find((b) => b.id === selectedBoardId) || null

  const addPlayer = () =>
    setPlayerNames((prev) => [...prev, `Player ${prev.length + 1}`])
  const removePlayer = (i: number) =>
    setPlayerNames((prev) => prev.filter((_, j) => j !== i))
  const updatePlayer = (i: number, name: string) =>
    setPlayerNames((prev) => prev.map((n, j) => (j === i ? name : n)))

  const handleStart = () => {
    if (!selectedBoard) return
    const players: Player[] = playerNames
      .filter((n) => n.trim())
      .map((name) => ({ id: generateId(), name: name.trim(), score: 0 }))
    if (players.length === 0) return
    startGame(selectedBoard, players)
  }

  const handleNewBoard = () => setEditingBoard(createNewBoard())

  const handleExport = async (boardId: string) => {
    const board = boards.find(b => b.id === boardId)
    if (!board) return
    setExportingId(boardId)
    await exportBoard(board)
    setExportingId(null)
  }

  const handleImport = async () => {
    await importBoard()
  }

  const handleSaveSet = async () => {
    const name = saveSetName.trim()
    if (!name) return
    await savePlayerSet(name, playerNames.filter(n => n.trim()))
    setSaveSetName('')
    setShowSaveSet(false)
  }

  const handleLoadSet = (setId: string) => {
    const ps = playerSets.find(s => s.id === setId)
    if (ps) setPlayerNames([...ps.playerNames])
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>JEOPARDY!</h1>

      <div style={styles.content}>
        {/* ── Boards section ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Select Board</h2>
          <div style={styles.boardsArea}>
            {/* Left: import/export actions */}
            <div style={styles.boardSideActions}>
              <button style={styles.sideBtn} onClick={handleImport} title="Import board from .jep file">
                <span style={styles.sideBtnIcon}>↑</span>
                <span>Import</span>
              </button>
              <button
                style={{ ...styles.sideBtn, ...(selectedBoardId ? {} : styles.sideBtnDisabled) }}
                onClick={() => selectedBoardId && handleExport(selectedBoardId)}
                disabled={!selectedBoardId || exportingId === selectedBoardId}
                title="Export selected board to .jep file"
              >
                <span style={styles.sideBtnIcon}>↓</span>
                <span>{exportingId ? '...' : 'Export'}</span>
              </button>
            </div>

            {/* Right: list */}
            <div style={styles.boardListArea}>
              {boards.length === 0 ? (
                <p style={styles.empty}>No boards yet. Create one!</p>
              ) : (
                <div style={styles.boardList}>
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      style={{
                        ...styles.boardItem,
                        ...(selectedBoardId === board.id ? styles.boardItemSelected : {})
                      }}
                      onClick={() => setSelectedBoardId(board.id)}
                    >
                      <span style={styles.boardName}>{board.name}</span>
                      <span style={styles.boardMeta}>{board.categories.length} cat.</span>
                      <div style={styles.boardActions}>
                        <button
                          style={styles.editBtn}
                          onClick={(e) => { e.stopPropagation(); setEditingBoard(board) }}
                        >
                          Edit
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteBoard(board.id)
                            if (selectedBoardId === board.id) setSelectedBoardId(null)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button style={styles.newBoardBtn} onClick={handleNewBoard}>
                + New Board
              </button>
            </div>
          </div>
        </div>

        {/* ── Players section ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Players</h2>
          <div style={styles.playerList}>
            {playerNames.map((name, i) => (
              <div key={i} style={styles.playerRow}>
                <input
                  style={styles.playerInput}
                  value={name}
                  onChange={(e) => updatePlayer(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                />
                {playerNames.length > 1 && (
                  <button style={styles.removeBtn} onClick={() => removePlayer(i)}>×</button>
                )}
              </div>
            ))}
          </div>
          <button style={styles.addPlayerBtn} onClick={addPlayer}>+ Add Player</button>

          {/* Saved sets */}
          <div style={styles.setsDivider} />
          <div style={styles.setsHeader}>
            <span style={styles.setsLabel}>Saved Sets</span>
            <button
              style={styles.saveSetToggleBtn}
              onClick={() => setShowSaveSet(v => !v)}
            >
              {showSaveSet ? 'Cancel' : '+ Save current'}
            </button>
          </div>

          {showSaveSet && (
            <div style={styles.saveSetRow}>
              <input
                style={styles.playerInput}
                value={saveSetName}
                onChange={(e) => setSaveSetName(e.target.value)}
                placeholder="Set name (e.g. My Team)"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSet()}
                autoFocus
              />
              <button style={styles.saveSetBtn} onClick={handleSaveSet}>Save</button>
            </div>
          )}

          {playerSets.length === 0 ? (
            <p style={styles.setsEmpty}>No saved sets yet</p>
          ) : (
            <div style={styles.setsList}>
              {playerSets.map(ps => (
                <div key={ps.id} style={styles.setPill} onClick={() => handleLoadSet(ps.id)}>
                  <span style={styles.setPillName}>{ps.name}</span>
                  <span style={styles.setPillCount}>{ps.playerNames.length}p</span>
                  <button
                    style={styles.setPillDelete}
                    onClick={(e) => { e.stopPropagation(); deletePlayerSet(ps.id) }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        style={{ ...styles.startBtn, ...(selectedBoard ? {} : styles.startBtnDisabled) }}
        onClick={handleStart}
        disabled={!selectedBoard}
      >
        START GAME
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'transparent',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    fontFamily: 'system-ui, sans-serif',
    overflow: 'auto'
  },
  title: {
    fontSize: '72px',
    fontWeight: '900',
    color: '#FFD700',
    textShadow: '0 0 40px rgba(255,215,0,0.45), 0 4px 16px rgba(0,0,0,0.6)',
    letterSpacing: '10px',
    marginBottom: '40px'
  },
  content: {
    display: 'flex',
    gap: '24px',
    width: '100%',
    maxWidth: '900px',
    marginBottom: '36px'
  },
  section: {
    flex: 1,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: 'rgba(255,215,0,0.8)',
    marginBottom: '14px',
    textTransform: 'uppercase',
    letterSpacing: '2.5px'
  },

  // Boards area: side actions + list
  boardsArea: {
    display: 'flex',
    gap: '10px'
  },
  boardSideActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0
  },
  sideBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.7)',
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700',
    width: '54px',
    letterSpacing: '0.3px'
  },
  sideBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed'
  },
  sideBtnIcon: {
    fontSize: '16px',
    lineHeight: '1'
  },
  boardListArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  boardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  boardItem: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '9px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  boardItemSelected: {
    border: '1px solid rgba(255,215,0,0.55)',
    background: 'rgba(255,215,0,0.07)',
    boxShadow: '0 0 14px rgba(255,215,0,0.08)'
  },
  boardName: {
    flex: 1,
    fontWeight: '600',
    fontSize: '14px'
  },
  boardMeta: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '11px'
  },
  boardActions: {
    display: 'flex',
    gap: '4px'
  },
  editBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.8)',
    padding: '3px 9px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },
  deleteBtn: {
    background: 'rgba(220,50,50,0.15)',
    border: '1px solid rgba(220,50,50,0.25)',
    color: '#ff7070',
    padding: '3px 7px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '1'
  },
  empty: {
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic',
    fontSize: '13px'
  },
  newBoardBtn: {
    width: '100%',
    padding: '9px',
    background: 'transparent',
    border: '1px dashed rgba(255,255,255,0.18)',
    color: 'rgba(255,255,255,0.45)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },

  // Players
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    marginBottom: '10px'
  },
  playerRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  playerInput: {
    flex: 1,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px'
  },
  removeBtn: {
    background: 'rgba(220,50,50,0.15)',
    border: '1px solid rgba(220,50,50,0.25)',
    color: '#ff7070',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addPlayerBtn: {
    background: 'transparent',
    border: '1px dashed rgba(255,255,255,0.18)',
    color: 'rgba(255,255,255,0.45)',
    padding: '8px',
    width: '100%',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },

  // Saved sets
  setsDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    margin: '16px 0 12px'
  },
  setsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  setsLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px'
  },
  saveSetToggleBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.5)',
    padding: '3px 9px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700'
  },
  saveSetRow: {
    display: 'flex',
    gap: '7px',
    marginBottom: '10px'
  },
  saveSetBtn: {
    background: 'rgba(255,215,0,0.15)',
    border: '1px solid rgba(255,215,0,0.3)',
    color: '#FFD700',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0
  },
  setsEmpty: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  setsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  setPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: '4px 6px 4px 10px',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s'
  },
  setPillName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)'
  },
  setPillCount: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600'
  },
  setPillDelete: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '1',
    padding: '0 2px',
    display: 'flex',
    alignItems: 'center'
  },

  // Start button
  startBtn: {
    padding: '16px 64px',
    fontSize: '20px',
    fontWeight: '900',
    letterSpacing: '4px',
    background: 'linear-gradient(135deg, #FFD700 0%, #f0c000 100%)',
    color: '#0a0820',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    boxShadow: '0 6px 28px rgba(255,215,0,0.35)'
  },
  startBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed'
  }
}
