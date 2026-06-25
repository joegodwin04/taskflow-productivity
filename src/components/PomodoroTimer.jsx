// PomodoroTimer.jsx — Focus ring timer with work/break modes
import { motion, AnimatePresence } from 'framer-motion'
import { usePomodoro } from '../hooks/usePomodoro'
import { useTheme } from '../context/ThemeContext'
import styles from './PomodoroTimer.module.css'

const MODE_META = {
  work:  { label: 'Focus',        color: '#7c6af7', glow: 'rgba(124,106,247,0.4)', emoji: '🎯' },
  short: { label: 'Short Break',  color: '#10b981', glow: 'rgba(16,185,129,0.4)',  emoji: '☕' },
  long:  { label: 'Long Break',   color: '#22d3ee', glow: 'rgba(34,211,238,0.4)',  emoji: '🌿' },
}

function Ring({ progress, color, glow, size = 160, theme }) {
  const r = size / 2 - 12
  const circ = 2 * Math.PI * r
  const dash = circ * progress

  // Theme-aware track color
  const trackColor = theme === 'light'
    ? 'rgba(124,106,247,0.10)'
    : 'rgba(255,255,255,0.06)'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ filter: `drop-shadow(0 0 18px ${glow})` }}
    >
      {/* Track */}
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth="10"
      />
      {/* Progress */}
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={`url(#pgr-${color.replace('#', '')})`}
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }}
      />
      <defs>
        <linearGradient id={`pgr-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color === '#7c6af7' ? '#a78bfa' : color} />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function PomodoroTimer({ compact = false, user }) {
  const { mode, running, sessions, progress, mm, ss, toggle, reset, switchMode } = usePomodoro(user)
  const { theme } = useTheme()
  const meta = MODE_META[mode]

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      {/* Mode tabs */}
      <div className={styles.modeTabs}>
        {Object.entries(MODE_META).map(([key, m]) => (
          <button
            key={key}
            className={`${styles.modeTab} ${mode === key ? styles.modeTabActive : ''}`}
            onClick={() => switchMode(key)}
            style={{ '--mc': m.color }}
          >{m.label}</button>
        ))}
      </div>

      {/* Ring + time */}
      <div className={styles.ringWrap}>
        <Ring
          progress={progress}
          color={meta.color}
          glow={meta.glow}
          size={compact ? 130 : 160}
          theme={theme}
        />
        <div className={styles.ringCenter}>
          <AnimatePresence mode="wait">
            <motion.span
              key={`${mm}:${ss}`}
              className={styles.time}
              initial={{ opacity: 0.7, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ color: meta.color }}
            >
              {mm}:{ss}
            </motion.span>
          </AnimatePresence>
          <span className={styles.modeLabel}>{meta.emoji} {meta.label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <motion.button
          className={styles.resetBtn}
          onClick={reset}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title="Reset timer"
          aria-label="Reset timer"
        >
          <ResetIcon />
        </motion.button>

        <motion.button
          className={`${styles.playBtn} ${running ? styles.pauseBtn : ''}`}
          onClick={toggle}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{ '--mc': meta.color, '--mg': meta.glow }}
          aria-label={running ? 'Pause timer' : 'Start timer'}
        >
          {running ? <PauseIcon /> : <PlayIcon />}
          {running ? 'Pause' : 'Start'}
        </motion.button>
      </div>

      {/* Sessions */}
      <div className={styles.sessions}>
        <span className={styles.sessionLabel}>Sessions today</span>
        <div className={styles.sessionDots}>
          {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i < sessions ? styles.dotFilled : ''}`}
              style={i < sessions ? { background: meta.color, boxShadow: `0 0 8px ${meta.glow}` } : {}}
            />
          ))}
        </div>
        <span className={styles.sessionCount}>{sessions === 0 ? 'No activity yet' : `${sessions} completed`}</span>
      </div>
    </div>
  )
}

function PlayIcon()  { return <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M6.3 2.8A1 1 0 005 3.7v12.6a1 1 0 001.5.87l10.2-6.3a1 1 0 000-1.74L6.5 2.8z"/></svg> }
function PauseIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><rect x="5" y="3" width="3.5" height="14" rx="1.5"/><rect x="11.5" y="3" width="3.5" height="14" rx="1.5"/></svg> }
function ResetIcon() { return <svg viewBox="0 0 20 20" fill="none" width="15" height="15"><path d="M4 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.93 9A7 7 0 1016 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
