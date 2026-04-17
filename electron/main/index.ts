import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readdir, readFile, writeFile, unlink } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'

function getBoardsDir(): string {
  const dir = join(app.getPath('userData'), 'boards')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function getPlayerSetsDir(): string {
  const dir = join(app.getPath('userData'), 'playersets')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

// ── Text format helpers ──────────────────────────────────────────────────────

function boardToText(board: any): string {
  const lines: string[] = [
    `BOARD: ${board.name}`,
    `POINTS: ${(board.pointValues as number[]).join(',')}`,
    ''
  ]
  for (const cat of board.categories as any[]) {
    lines.push(`CATEGORY: ${cat.title}`)
    for (const q of cat.questions as any[]) {
      lines.push(`Q: ${q.question}`)
      lines.push(`A: ${q.answer}`)
      if (q.isDouble) lines.push(`DOUBLE: true`)
      lines.push('')
    }
  }
  return lines.join('\n')
}

function textToBoard(text: string, id: string): any {
  const lines = text.split('\n')
  let name = 'Imported Board'
  let pointValues: number[] = [100, 200, 300, 400, 500]
  const categories: any[] = []
  let currentCat: any = null
  let pendingQ: string | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('BOARD:')) {
      name = line.slice(6).trim()
    } else if (line.startsWith('POINTS:')) {
      pointValues = line.slice(7).trim()
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n))
    } else if (line.startsWith('CATEGORY:')) {
      if (currentCat) categories.push(currentCat)
      currentCat = { title: line.slice(9).trim(), questions: [] }
      pendingQ = null
    } else if (line.startsWith('Q:')) {
      pendingQ = line.slice(2).trim()
    } else if (line.startsWith('A:') && currentCat !== null && pendingQ !== null) {
      const idx = currentCat.questions.length
      currentCat.questions.push({
        points: pointValues[idx] ?? 0,
        question: pendingQ,
        answer: line.slice(2).trim(),
        isDouble: false
      })
      pendingQ = null
    } else if (line.startsWith('DOUBLE:') && currentCat !== null && currentCat.questions.length > 0) {
      currentCat.questions[currentCat.questions.length - 1].isDouble =
        line.slice(7).trim() === 'true'
    }
  }
  if (currentCat) categories.push(currentCat)

  return { id, name, pointValues, categories }
}

// ── Window ───────────────────────────────────────────────────────────────────

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#08061a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.setMenuBarVisibility(false)

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── IPC ──────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Boards CRUD
  ipcMain.handle('boards:list', async () => {
    const dir = getBoardsDir()
    const files = (await readdir(dir)).filter(f => f.endsWith('.json'))
    return Promise.all(
      files.map(f => readFile(join(dir, f), 'utf-8').then(JSON.parse))
    )
  })

  ipcMain.handle('boards:save', async (_event, board) => {
    const dir = getBoardsDir()
    await writeFile(join(dir, `${board.id}.json`), JSON.stringify(board, null, 2), 'utf-8')
  })

  ipcMain.handle('boards:delete', async (_event, id: string) => {
    const dir = getBoardsDir()
    await unlink(join(dir, `${id}.json`))
  })

  // Export: board → .jep text file via save dialog
  ipcMain.handle('boards:export', async (_event, board) => {
    const safeName = String(board.name).replace(/[/\\?%*:|"<>]/g, '_')
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `${safeName}.jep`,
      filters: [
        { name: 'Jeopardy Board', extensions: ['jep'] },
        { name: 'Text File', extensions: ['txt'] }
      ]
    })
    if (canceled || !filePath) return { success: false }
    await writeFile(filePath, boardToText(board), 'utf-8')
    return { success: true }
  })

  // Import: .jep text file → Board object (caller provides new id)
  ipcMain.handle('boards:import', async (_event, newId: string) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [
        { name: 'Jeopardy Board', extensions: ['jep', 'txt'] }
      ],
      properties: ['openFile']
    })
    if (canceled || filePaths.length === 0) return null
    const text = await readFile(filePaths[0], 'utf-8')
    return textToBoard(text, newId)
  })

  // Player sets CRUD
  ipcMain.handle('playersets:list', async () => {
    const dir = getPlayerSetsDir()
    const files = (await readdir(dir)).filter(f => f.endsWith('.json'))
    return Promise.all(
      files.map(f => readFile(join(dir, f), 'utf-8').then(JSON.parse))
    )
  })

  ipcMain.handle('playersets:save', async (_event, set) => {
    const dir = getPlayerSetsDir()
    await writeFile(join(dir, `${set.id}.json`), JSON.stringify(set, null, 2), 'utf-8')
  })

  ipcMain.handle('playersets:delete', async (_event, id: string) => {
    const dir = getPlayerSetsDir()
    await unlink(join(dir, `${id}.json`))
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
