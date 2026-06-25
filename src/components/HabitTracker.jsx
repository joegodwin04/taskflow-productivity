// HabitTracker.jsx — 7-day grid with streaks and daily completion
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHabits } from '../hooks/useHabits'
import styles from './HabitTracker.module.css'

const PRESET_ICONS = ['💪', '📚', '💧', '🧘', '🏃', '🥗', '😴', '✍️', '🎯', '🌿', '🎨', '🎵']
const PRESET_COLORS = ['#7c6af7', '#f43f5e', '#f59e0b', '#10b981', '#22d3ee', '#ec4899', '#6366f1', '#14b8a6']

export default function HabitTracker({ user }) {
  const { habits, addHabit, toggleHabit, deleteHabit, getStreak, getLastNDays, completedToday, totalToday } = useHabits(user)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('💪')
  const [newColor, setNewColor] = useState('#7c6af7')

  const handleAdd = () => {
    if (!newName.trim()) return
    addHabit({ name: newName, icon: newIcon, color: newColor })
    setNewName('')
    setNewIcon('💪')
    setNewColor('#7c6af7')
    setAdding(false)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Habit Tracker</h3>
          <span className={styles.subtitle}>{completedToday}/{totalToday} done today</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.completionPill} style={{ '--pct': `${totalToday ? Math.round(completedToday/totalToday*100) : 0}%` }}>
            <span>{totalToday ? Math.round(completedToday/totalToday*100) : 0}%</span>
          </div>
          <motion.button
            className={styles.addBtn}
            onClick={() => setAdding(v => !v)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            {adding ? '✕' : '+ Add Habit'}
          </motion.button>
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            className={styles.addForm}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.addFormInner}>
              <div className={styles.iconPicker}>
                {PRESET_ICONS.map(ic => (
                  <button
                    key={ic}
                    className={`${styles.iconBtn} ${newIcon === ic ? styles.iconBtnActive : ''}`}
                    onClick={() => setNewIcon(ic)}
                  >{ic}</button>
                ))}
              </div>
              <div className={styles.colorPicker}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className={`${styles.colorBtn} ${newColor === c ? styles.colorBtnActive : ''}`}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
              <div className={styles.addInputRow}>
                <span className={styles.addPreview}>{newIcon}</span>
                <input
                  className={styles.addInput}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
                  placeholder="Habit name…"
                  autoFocus
                  maxLength={40}
                />
                <button className={styles.saveBtn} onClick={handleAdd} disabled={!newName.trim()}>
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day labels */}
      <div className={styles.grid}>
        <div className={styles.habitCol} />
        <div className={styles.daysRow}>
          {getLastNDays(habits[0] || { completions: {} }).map(d => (
            <div key={d.date} className={`${styles.dayLabel} ${d.date === todayStr ? styles.dayLabelToday : ''}`}>
              {d.label}
            </div>
          ))}
        </div>
        <div className={styles.streakCol}><span>🔥</span></div>
      </div>

      {/* Habits */}
      <AnimatePresence>
        {habits.length === 0 ? (
          <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className={styles.emptyIcon}>🌱</span>
            <p>No activity yet</p>
          </motion.div>
        ) : (
          habits.map((h, idx) => {
            const days  = getLastNDays(h)
            const streak = getStreak(h)

            return (
              <motion.div
                key={h.id}
                className={styles.habitRow}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {/* Name */}
                <div className={styles.habitName}>
                  <span className={styles.habitIcon}>{h.icon}</span>
                  <span className={styles.habitLabel}>{h.name}</span>
                  <button className={styles.deleteBtn} onClick={() => deleteHabit(h.id)} title="Delete habit">✕</button>
                </div>

                {/* 7-day dots */}
                <div className={styles.dayDots}>
                  {days.map(d => (
                    <motion.button
                      key={d.date}
                      className={`${styles.daydot} ${d.done ? styles.daydotDone : ''} ${d.date === todayStr ? styles.daydotToday : ''}`}
                      style={{ '--hc': h.color }}
                      onClick={() => toggleHabit(h.id, d.date)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      title={d.date}
                    >
                      {d.done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>✓</motion.span>}
                    </motion.button>
                  ))}
                </div>

                {/* Streak */}
                <div className={styles.streakBadge} style={{ '--hc': h.color }}>
                  <span className={styles.streakNum}>{streak}</span>
                </div>
              </motion.div>
            )
          })
        )}
      </AnimatePresence>
    </div>
  )
}
