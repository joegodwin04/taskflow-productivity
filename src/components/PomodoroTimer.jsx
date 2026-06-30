// PomodoroTimer.jsx — Premium Focus Timer Redesign
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePomodoro } from '../hooks/usePomodoro'
import { useTheme } from '../context/ThemeContext'
import styles from './PomodoroTimer.module.css'

const MODE_META = {
  work:  { label: 'Focus',        color: '#7c6af7', glow: 'rgba(124,106,247,0.5)', emoji: '🎯' },
  short: { label: 'Short Break',  color: '#10b981', glow: 'rgba(16,185,129,0.5)',  emoji: '☕' },
  long:  { label: 'Long Break',   color: '#22d3ee', glow: 'rgba(34,211,238,0.5)',  emoji: '🌿' },
}

function Ring({ progress, color, glow, size = 180, running, theme }) {
  const strokeWidth = 12
  const r = size / 2 - strokeWidth
  const circ = 2 * Math.PI * r
  const dash = circ * progress

  const trackColor = theme === 'light'
    ? 'rgba(0,0,0,0.04)'
    : 'rgba(255,255,255,0.04)'

  return (
    <div className={styles.ringOuter} style={{ width: size, height: size }}>
      {/* Ambient pulsing glow when running */}
      {running && (
        <motion.div
          className={styles.ambientGlow}
          style={{ background: color }}
          animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svgRing}
        style={{ filter: `drop-shadow(0 4px 20px ${glow})` }}
      >
        {/* Track */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#pgr-${color.replace('#', '')})`}
          strokeWidth={strokeWidth} strokeLinecap="round"
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
    </div>
  )
}

export default function PomodoroTimer({ compact = false, user, showToast }) {
  const { 
    mode, running, sessions, progress, mm, ss, 
    toggle, reset, switchMode, finishAndSave,
    totalDuration, history, WORK_SECS, timeLeft
  } = usePomodoro(user, showToast)
  
  const { theme } = useTheme()
  const meta = MODE_META[mode]

  const [showConfirm, setShowConfirm] = useState(false)

  const handleFinishClick = () => {
    const elapsed = WORK_SECS - timeLeft
    if (mode === 'work' && elapsed > 0) {
      if (running) toggle()
      setShowConfirm(true)
    }
  }

  const handleConfirmSave = () => {
    finishAndSave()
    setShowConfirm(false)
  }

  const formatTotalTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const elapsedMins = Math.floor((WORK_SECS - timeLeft) / 60)
  const ringSize = compact ? 150 : 180

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
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Ring + time */}
      <div className={styles.ringWrap}>
        <Ring
          progress={progress}
          color={meta.color}
          glow={meta.glow}
          size={ringSize}
          running={running}
          theme={theme}
        />
        <div className={styles.ringCenter}>
          <AnimatePresence mode="wait">
            <motion.span
              key={`${mm}:${ss}`}
              className={styles.time}
              initial={{ opacity: 0.8, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {mm}:{ss}
            </motion.span>
          </AnimatePresence>
          <span className={styles.modeLabel} style={{ color: meta.color }}>
            {meta.emoji} {meta.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <motion.button
          className={styles.resetBtn}
          onClick={reset}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          title="Reset timer"
          aria-label="Reset timer"
        >
          <ResetIcon />
        </motion.button>

        <motion.button
          className={`${styles.playBtn} ${running ? styles.pauseBtn : ''}`}
          onClick={toggle}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          style={{ '--mc': meta.color, '--mg': meta.glow }}
          aria-label={running ? 'Pause timer' : 'Start timer'}
        >
          {running ? <PauseIcon /> : <PlayIcon />}
          {running ? 'Pause' : 'Start'}
        </motion.button>
        
        {mode === 'work' && (
          <motion.button
            className={styles.finishBtn}
            onClick={handleFinishClick}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title="Finish & Save session early"
          >
            <SaveIcon />
          </motion.button>
        )}
      </div>

      {/* Sessions & Analytics */}
      <div className={styles.sessions}>
        <div className={styles.sessionDots}>
          {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
            <motion.div
              key={i}
              className={`${styles.dot} ${i < sessions ? styles.dotFilled : ''}`}
              style={i < sessions ? { background: meta.color, boxShadow: `0 0 12px ${meta.glow}` } : {}}
              initial={false}
              animate={i < sessions ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
        
        <div className={styles.analyticsRow}>
          <div className={styles.totalTimeBadge}>
            <span className={styles.totalTimeIcon}>⌛</span>
            <span className={styles.totalTimeText}>{formatTotalTime(totalDuration)} focused today</span>
          </div>
          
          {history && history.length > 0 && (
            <div className={styles.historyList}>
              {history.slice(0, 4).map((sess, i) => (
                <span key={sess.id || i} className={`${styles.historyBadge} ${sess.completed ? styles.historyBadgeCompleted : ''}`}>
                  {Math.round(sess.durationSeconds / 60)}m {sess.completed ? '✓' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={styles.modal}
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className={styles.modalIconWrap}>
                <SaveIcon />
              </div>
              <h3 className={styles.modalTitle}>Save early?</h3>
              <p className={styles.modalText}>You've focused for <strong>{elapsedMins} minutes</strong>. Do you want to save this session?</p>
              <div className={styles.modalActions}>
                <button className={`${styles.modalBtn} ${styles.modalCancel}`} onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className={`${styles.modalBtn} ${styles.modalConfirm}`} onClick={handleConfirmSave}>Save Session</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlayIcon()  { return <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M6.3 2.8A1 1 0 005 3.7v12.6a1 1 0 001.5.87l10.2-6.3a1 1 0 000-1.74L6.5 2.8z"/></svg> }
function PauseIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><rect x="5" y="3" width="3.5" height="14" rx="1.5"/><rect x="11.5" y="3" width="3.5" height="14" rx="1.5"/></svg> }
function ResetIcon() { return <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M4 4v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.93 9A7 7 0 1016 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function SaveIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> }
