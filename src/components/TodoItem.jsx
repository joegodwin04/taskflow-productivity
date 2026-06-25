// TodoItem.jsx — Premium animated task card
import { motion } from 'framer-motion'
import { useState, useRef, useEffect, memo } from 'react'
import { PRIORITIES, CATEGORIES } from '../hooks/useTodos'
import styles from './TodoItem.module.css'

function formatDate(s) {
  if (!s) return null
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function isDueToday(s) { return s && new Date(s).toDateString() === new Date().toDateString() }

const today = () => new Date().toISOString().split('T')[0]

const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing]   = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [expanded, setExpanded] = useState(false)
  const [justDone, setJustDone] = useState(false)
  const editRef = useRef(null)

  const prio = PRIORITIES[todo.priority] || PRIORITIES.medium
  const cat  = CATEGORIES.find(c => c.id === todo.category) || CATEGORIES[4]
  const overdue  = !todo.completed && todo.dueDate && new Date(todo.dueDate) < new Date(new Date().setHours(0,0,0,0))
  const dueToday = !todo.completed && isDueToday(todo.dueDate)

  useEffect(() => { if (editing) editRef.current?.focus() }, [editing])

  const handleToggle = () => {
    if (!todo.completed) { setJustDone(true); setTimeout(() => setJustDone(false), 700) }
    onToggle(todo.id)
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== todo.text) onUpdate(todo.id, { text: trimmed })
    else setEditText(todo.text)
    setEditing(false)
  }

  return (
    <motion.div
      className={`${styles.card} ${todo.completed ? styles.done : ''} ${overdue ? styles.overdueCard : ''}`}
      style={{ '--p': prio.color, '--c': cat.color }}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95, transition: { duration: 0.25 } }}
      whileHover={{ y: -2, boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)` }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Priority glow stripe */}
      <div className={styles.stripe} />

      <div className={styles.row}>
        {/* Checkbox */}
        <motion.button
          id={`toggle-${todo.id}`}
          className={`${styles.checkbox} ${todo.completed ? styles.checked : ''}`}
          onClick={handleToggle}
          whileTap={{ scale: 0.85 }}
          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {/* Completion burst */}
          {justDone && (
            <motion.div
              className={styles.burst}
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.55 }}
            />
          )}
          {todo.completed && (
            <motion.svg
              viewBox="0 0 20 20" fill="none" width="12" height="12"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <path d="M4 10.5l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          )}
        </motion.button>

        {/* Text + meta */}
        <div className={styles.content} onClick={() => !editing && setExpanded(v => !v)}>
          {editing ? (
            <input
              ref={editRef}
              className={styles.editInput}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setEditText(todo.text); setEditing(false) }}}
              onClick={e => e.stopPropagation()}
              maxLength={200}
            />
          ) : (
            <span className={styles.text}>{todo.text}</span>
          )}

          <div className={styles.badges}>
            <span className={styles.catBadge}>{cat.icon} {cat.label}</span>
            <span className={styles.prioBadge}>{prio.icon} {prio.label}</span>
            {todo.dueDate && (
              <span className={`${styles.dateBadge} ${overdue ? styles.overdueBadge : ''} ${dueToday ? styles.todayBadge : ''}`}>
                {overdue ? '⚠️' : dueToday ? '📅' : '🗓'} {formatDate(todo.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <motion.div
          className={styles.actions}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.button
            id={`edit-${todo.id}`}
            className={styles.actionBtn}
            onClick={e => { e.stopPropagation(); setEditing(true); setExpanded(false) }}
            whileHover={{ scale: 1.12, backgroundColor: 'rgba(124,106,247,0.12)' }}
            whileTap={{ scale: 0.9 }}
            title="Edit"
          >
            <svg viewBox="0 0 20 20" fill="none" width="13" height="13">
              <path d="M13 3l4 4-9 9H4v-4L13 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
          </motion.button>
          <motion.button
            id={`delete-${todo.id}`}
            className={`${styles.actionBtn} ${styles.delBtn}`}
            onClick={e => { e.stopPropagation(); onDelete(todo.id) }}
            whileHover={{ scale: 1.12, backgroundColor: 'rgba(244,63,94,0.12)' }}
            whileTap={{ scale: 0.9 }}
            title="Delete"
          >
            <svg viewBox="0 0 20 20" fill="none" width="13" height="13">
              <path d="M4 6h12M8 6V4h4v2M7 6v9a1 1 0 001 1h4a1 1 0 001-1V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </motion.div>
      </div>

      {/* Expand panel */}
      <motion.div
        className={styles.expandPanel}
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <div className={styles.expandInner}>
          {todo.notes && (
            <div className={styles.notesRow}>
              <span className={styles.notesIcon}>📝</span>
              <span className={styles.notesText}>{todo.notes}</span>
            </div>
          )}
          {todo.completedAt && (
            <div className={styles.completedAt}>
              ✅ Completed {new Date(todo.completedAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
            </div>
          )}
          <div className={styles.inlineRow}>
            <label className={styles.inlineLabel}>Due date</label>
            <input
              type="date" min={today()}
              className={styles.inlineDate}
              value={todo.dueDate || ''}
              onChange={e => onUpdate(todo.id, { dueDate: e.target.value || null })}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})

export default TodoItem
