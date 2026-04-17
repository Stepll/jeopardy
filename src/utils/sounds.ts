let _ctx: AudioContext | null = null

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function tone(
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.22
) {
  const c = ctx()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.connect(g)
  g.connect(c.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + startOffset)
  g.gain.setValueAtTime(gain, c.currentTime + startOffset)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startOffset + duration)
  osc.start(c.currentTime + startOffset)
  osc.stop(c.currentTime + startOffset + duration)
}

export function playTileOpen() {
  tone(440, 0, 0.06, 'sine', 0.15)
  tone(880, 0.05, 0.09, 'sine', 0.1)
}

export function playDailyDouble() {
  // Dramatic 4-note fanfare
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => tone(f, i * 0.13, 0.2, 'sine', 0.24))
}

export function playCorrect() {
  tone(523, 0,    0.12, 'sine', 0.2)
  tone(659, 0.11, 0.12, 'sine', 0.2)
  tone(784, 0.23, 0.28, 'sine', 0.22)
}

export function playWrong() {
  tone(220, 0,    0.14, 'sawtooth', 0.2)
  tone(180, 0.13, 0.28, 'sawtooth', 0.16)
}

export function playGameOver() {
  // Happy Jeopardy-style ending
  const notes =   [523, 523, 659, 523, 784, 740]
  const offsets = [0,   0.2, 0.4, 0.65, 0.85, 1.1]
  notes.forEach((f, i) => tone(f, offsets[i], 0.25, 'sine', 0.26))
}
