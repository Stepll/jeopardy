import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Board, Category, Question } from '../types'

export default function Editor() {
  const { editingBoard, saveBoard, setEditingBoard } = useGameStore()
  const [board, setBoard] = useState<Board | null>(editingBoard)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBoard(editingBoard)
  }, [editingBoard])

  if (!board) return null

  const updateName = (name: string) => setBoard((b) => b && { ...b, name })

  const updateCategory = (ci: number, updates: Partial<Category>) =>
    setBoard((b) => {
      if (!b) return b
      return {
        ...b,
        categories: b.categories.map((cat, i) => (i === ci ? { ...cat, ...updates } : cat))
      }
    })

  const updateQuestion = (ci: number, qi: number, updates: Partial<Question>) =>
    setBoard((b) => {
      if (!b) return b
      return {
        ...b,
        categories: b.categories.map((cat, i) =>
          i !== ci
            ? cat
            : {
                ...cat,
                questions: cat.questions.map((q, j) => (j === qi ? { ...q, ...updates } : q))
              }
        )
      }
    })

  const addCategory = () =>
    setBoard((b) => {
      if (!b) return b
      const newCat: Category = {
        title: `Category ${b.categories.length + 1}`,
        questions: b.pointValues.map((points) => ({ points, question: '', answer: '' }))
      }
      return { ...b, categories: [...b.categories, newCat] }
    })

  const removeCategory = (ci: number) =>
    setBoard((b) => {
      if (!b || b.categories.length <= 1) return b
      return { ...b, categories: b.categories.filter((_, i) => i !== ci) }
    })

  const updatePointValues = (raw: string) => {
    const vals = raw
      .split(',')
      .map((v) => parseInt(v.trim()))
      .filter((v) => !isNaN(v) && v > 0)
    if (vals.length === 0) return
    setBoard((b) => {
      if (!b) return b
      return {
        ...b,
        pointValues: vals,
        categories: b.categories.map((cat) => ({
          ...cat,
          questions: vals.map((points, qi) => ({
            points,
            question: cat.questions[qi]?.question ?? '',
            answer: cat.questions[qi]?.answer ?? '',
            isDouble: cat.questions[qi]?.isDouble ?? false
          }))
        }))
      }
    })
  }

  const handleSave = async () => {
    if (!board) return
    setSaving(true)
    await saveBoard(board)
    setSaving(false)
    setEditingBoard(null)
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button style={styles.backBtn} onClick={() => setEditingBoard(null)}>
          ← Back
        </button>
        <h1 style={styles.title}>Board Editor</h1>
        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Board'}
        </button>
      </div>

      <div style={styles.meta}>
        <div style={styles.field}>
          <label style={styles.label}>Board Name</label>
          <input
            style={styles.input}
            value={board.name}
            onChange={(e) => updateName(e.target.value)}
            placeholder="Board name"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Point Values (comma-separated)</label>
          <input
            style={styles.input}
            defaultValue={board.pointValues.join(', ')}
            onBlur={(e) => updatePointValues(e.target.value)}
            placeholder="100, 200, 300, 400, 500"
          />
        </div>
      </div>

      <div style={styles.categoriesRow}>
        {board.categories.map((cat, ci) => (
          <div key={ci} style={styles.categoryCard}>
            <div style={styles.categoryHeader}>
              <input
                style={styles.catTitleInput}
                value={cat.title}
                onChange={(e) => updateCategory(ci, { title: e.target.value })}
                placeholder="Category title"
              />
              {board.categories.length > 1 && (
                <button style={styles.removeCatBtn} onClick={() => removeCategory(ci)}>
                  ×
                </button>
              )}
            </div>

            <div style={styles.questionsList}>
              {cat.questions.map((q, qi) => (
                <div key={qi} style={styles.questionRow}>
                  <div style={styles.pointsBadgeCol}>
                    <div style={styles.pointsBadge}>${q.points}</div>
                    <button
                      style={q.isDouble ? styles.doubleToggleOn : styles.doubleToggleOff}
                      onClick={() => updateQuestion(ci, qi, { isDouble: !q.isDouble })}
                      title="Daily Double"
                    >
                      ×2
                    </button>
                  </div>
                  <div style={styles.questionFields}>
                    <textarea
                      style={styles.textarea}
                      value={q.question}
                      onChange={(e) => updateQuestion(ci, qi, { question: e.target.value })}
                      placeholder="Question…"
                      rows={2}
                    />
                    <textarea
                      style={{ ...styles.textarea, ...styles.answerTextarea }}
                      value={q.answer}
                      onChange={(e) => updateQuestion(ci, qi, { answer: e.target.value })}
                      placeholder="Answer…"
                      rows={1}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button style={styles.addCatBtn} onClick={addCategory}>
          +<br />Add<br />Category
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    background: '#0d0d2b',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 24px',
    background: '#060CE9',
    borderBottom: '3px solid #FFD700',
    flexShrink: 0
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  title: {
    flex: 1,
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: '900',
    letterSpacing: '4px',
    textTransform: 'uppercase',
    margin: 0
  },
  saveBtn: {
    background: '#FFD700',
    border: 'none',
    color: '#060CE9',
    padding: '10px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '800'
  },
  meta: {
    display: 'flex',
    gap: '24px',
    padding: '16px 24px',
    background: 'rgba(6,12,233,0.25)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  input: {
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '15px'
  },
  categoriesRow: {
    flex: 1,
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    overflowX: 'auto',
    overflowY: 'hidden',
    alignItems: 'flex-start'
  },
  categoryCard: {
    minWidth: '210px',
    maxWidth: '210px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto'
  },
  categoryHeader: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    padding: '10px 12px',
    background: '#060CE9',
    borderBottom: '2px solid #FFD700',
    flexShrink: 0
  },
  catTitleInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '2px 0',
    outline: 'none',
    minWidth: 0
  },
  removeCatBtn: {
    background: 'rgba(220,50,50,0.3)',
    border: 'none',
    color: '#ff8080',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '15px',
    lineHeight: '1',
    flexShrink: 0
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '10px'
  },
  questionRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start'
  },
  pointsBadgeCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    flexShrink: 0,
    width: '34px'
  },
  pointsBadge: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: '12px',
    paddingTop: '5px',
    textAlign: 'right'
  },
  doubleToggleOff: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '900',
    padding: '2px 3px',
    width: '100%',
    letterSpacing: '0.5px'
  },
  doubleToggleOn: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    border: '1px solid rgba(167,139,250,0.6)',
    color: '#e9d5ff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '900',
    padding: '2px 3px',
    width: '100%',
    letterSpacing: '0.5px',
    boxShadow: '0 0 8px rgba(124,58,237,0.5)'
  },
  questionFields: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  textarea: {
    width: '100%',
    padding: '5px 8px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  answerTextarea: {
    background: 'rgba(255,215,0,0.05)',
    borderColor: 'rgba(255,215,0,0.2)',
    color: '#FFD700'
  },
  addCatBtn: {
    minWidth: '56px',
    padding: '16px 10px',
    background: 'transparent',
    border: '2px dashed rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.4)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    alignSelf: 'stretch',
    lineHeight: '1.6'
  }
}
