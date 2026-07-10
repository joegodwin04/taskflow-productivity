import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { CATEGORIES } from '../hooks/useTodos'
import styles from './RoutineCard.module.css'

function formatDate(s) {
  if (!s) return null
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CheckIcon = () => <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M4 10.5l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>

export default function RoutineCard({ routine, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const [justDone, setJustDone] = useState(false)

  const cat = CATEGORIES.find(c => c.id === routine.category) || CATEGORIES[4]
  const completed = routine.completedToday
  const todaysId = routine.todaysInstance?.id

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!todaysId) return // Cannot toggle if today's instance doesn't exist yet
    if (!completed) {
      setJustDone(true)
      setTimeout(() => setJustDone(false), 700)
    }
    onToggle(todaysId)
  }

  // Filter past instances for history panel (exclude today)
  const todayStr = new Date().toISOString().split('T')[0]
  const pastInstances = routine.instances
    .filter(t => t.routineDate !== todayStr)
    .sort((a, b) => new Date(b.routineDate) - new Date(a.routineDate))
    .slice(0, 10) // Show last 10 days max

  return (
    <motion.div
      className={`${styles.card} ${completed ? styles.done : ''}`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className={styles.stripe} />

      <div className={styles.row}>
        {/* Custom Checkbox */}
        <motion.button
          className={`${styles.checkbox} ${completed ? styles.checked : ''}`}
          onClick={handleToggle}
          whileTap={todaysId ? { scale: 0.85 } : {}}
          disabled={!todaysId}
          style={{ opacity: todaysId ? 1 : 0.5, cursor: todaysId ? 'pointer' : 'not-allowed' }}
        >
          {justDone && (
            <motion.div
              className={styles.burst}
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.55 }}
            />
          )}
          <AnimatePresence>
            {completed && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <CheckIcon />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.titleRow}>
            <span className={`${styles.text} ${completed ? styles.textDone : ''}`}>
              {routine.text}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span className={`${styles.badge} ${styles.streakBadge}`}>
              🔥 {routine.streak} Day Streak
            </span>
            <span className={`${styles.badge} ${styles.scheduleBadge}`}>
              ☀️ Every Day
            </span>
            <span className={`${styles.badge} ${styles.catBadge}`} style={{ '--badge-color': cat.color }}>
              {cat.icon} {cat.label}
            </span>
            <span className={`${styles.badge} ${styles.resetBadge}`}>
              Resets Tomorrow
            </span>
          </div>
        </div>
      </div>

      {/* Expand History Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.expandPanel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.expandInner}>
              <div className={styles.historyTitle}>Completion History</div>
              {pastInstances.length === 0 ? (
                <div style={{ color: 'var(--text-400)', fontSize: 13.5 }}>No past history found.</div>
              ) : (
                <div className={styles.historyList}>
                  {pastInstances.map(inst => (
                    <div key={inst.id} className={`${styles.historyItem} ${inst.completed ? styles.completed : styles.missed}`}>
                      <div className={`${styles.historyIcon} ${inst.completed ? styles.completed : styles.missed}`}>
                        {inst.completed ? '✓' : '✗'}
                      </div>
                      <div className={styles.historyDate}>{formatDate(inst.routineDate)}</div>
                      <div style={{ marginLeft: 'auto', color: 'var(--text-400)', fontSize: 13 }}>
                        {inst.completed ? 'Completed' : 'Missed'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
