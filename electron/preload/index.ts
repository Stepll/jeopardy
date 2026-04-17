import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  listBoards: () => ipcRenderer.invoke('boards:list'),
  saveBoard: (board: unknown) => ipcRenderer.invoke('boards:save', board),
  deleteBoard: (id: string) => ipcRenderer.invoke('boards:delete', id),
  exportBoard: (board: unknown) => ipcRenderer.invoke('boards:export', board),
  importBoard: (newId: string) => ipcRenderer.invoke('boards:import', newId),

  listPlayerSets: () => ipcRenderer.invoke('playersets:list'),
  savePlayerSet: (set: unknown) => ipcRenderer.invoke('playersets:save', set),
  deletePlayerSet: (id: string) => ipcRenderer.invoke('playersets:delete', id),
})
