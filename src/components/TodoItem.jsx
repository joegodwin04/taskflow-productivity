// TodoItem.jsx — Premium animated task card
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, memo } from 'react'
import { PRIORITIES, CATEGORIES } from '../hooks/useTodos'
import styles from './TodoItem.module.css'

function formatDate(s) {
  if (!s) return null
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function isDueToday(s) { return s && new Date(s).toDateString() === new Date().toDateString() }

const today = () => new Date().toISOString().split('T')[0]

const TodoItem = memo(function TodoItem({ 
  todo, onToggle, onDelete, onUpdate, 
  onMoveToTrash, onRestore, onArchive, onDuplicate, 
  isTrashView, isArchiveView 
}) {
  const [editing, setEditing]   = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [expanded, setExpanded] = useState(false)
  const [justDone, setJustDone] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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

  // Icons
  const EditIcon = () => <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M13 3l4 4-9 9H4v-4L13 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
  const DuplicateIcon = () => <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12v2a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  const ArchiveIcon = () => <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M3 5h14M4 5v10a2 2 0 002 2h8a2 2 0 002-2V5M8 9h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  const TrashIcon = () => <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M4 6h12M8 6V4h4v2M7 6v9a1 1 0 001 1h4a1 1 0 001-1V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  const RestoreIcon = () => <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M3 10a7 7 0 1114 0c0 3.86-3.14 7-7 7m0 0l3-3m-3 3l-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  const CheckIcon = () => <svg viewBox="0 0 20 20" fill="none" width="12" height="12"><path d="M4 10.5l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>

  return (
    <motion.div
      className={`${styles.card} ${todo.completed ? styles.done : ''} ${overdue ? styles.overdueCard : ''}`}
      style={{ '--p': prio.color, '--c': cat.color }}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.stripe} />

      <div className={styles.row}>
        {/* Modern Custom Checkbox */}
        {!isTrashView && (
          <motion.button
            id={`toggle-${todo.id}`}
            className={`${styles.checkbox} ${todo.completed ? styles.checked : ''}`}
            onClick={handleToggle}
            whileTap={{ scale: 0.85 }}
            aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
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
              {todo.completed && (
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
        )}

        {/* Text + Meta */}
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
            <span className={`${styles.text} ${todo.completed ? styles.textDone : ''}`}>{todo.text}</span>
          )}

          <div className={styles.badges}>
            {todo.isMissed && <span className={`${styles.badge} ${styles.missedBadge}`}>⚠️ Missed</span>}
            {todo.routineId && !todo.isMissed && <span className={`${styles.badge} ${styles.routineBadge}`}>☀️ Routine</span>}
            {!todo.routineId && <span className={styles.badge} style={{ '--badge-color': cat.color }}>{cat.icon} {cat.label}</span>}
            {!todo.routineId && <span className={styles.badge} style={{ '--badge-color': prio.color }}>{prio.icon} {prio.label}</span>}
            {todo.dueDate && !todo.routineId && (
              <span className={`${styles.badge} ${styles.dateBadge} ${overdue ? styles.overdueBadge : ''} ${dueToday ? styles.todayBadge : ''}`}>
                {overdue ? '⚠️' : dueToday ? '📅' : '🗓'} {formatDate(todo.dueDate)}
              </span>
            )}
            {todo.routineDate && (
              <span className={`${styles.badge} ${styles.dateBadge}`}>
                🗓 {formatDate(todo.routineDate)}
              </span>
            )}
          </div>
        </div>

        {/* Premium Hover Action Bar */}
        <div className={styles.actionBar}>
          {!isTrashView ? (
            <>
              <motion.button className={styles.actionBtn} onClick={e => { e.stopPropagation(); setEditing(true); setExpanded(false) }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Edit"><EditIcon /></motion.button>
              <motion.button className={styles.actionBtn} onClick={e => { e.stopPropagation(); onDuplicate(todo.id) }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Duplicate"><DuplicateIcon /></motion.button>
              
              {/* Archive / Unarchive toggle */}
              {!isArchiveView ? (
                <motion.button className={styles.actionBtn} onClick={e => { e.stopPropagation(); onArchive(todo.id) }} whileHover={{ scale: 1.1, color: 'var(--amber)' }} whileTap={{ scale: 0.9 }} title="Archive"><ArchiveIcon /></motion.button>
              ) : (
                <motion.button className={styles.actionBtn} onClick={e => { e.stopPropagation(); onUpdate(todo.id, { archivedAt: null }) }} whileHover={{ scale: 1.1, color: 'var(--emerald)' }} whileTap={{ scale: 0.9 }} title="Unarchive"><RestoreIcon /></motion.button>
              )}

              <motion.button className={`${styles.actionBtn} ${styles.delBtn}`} onClick={e => { e.stopPropagation(); onMoveToTrash(todo.id) }} whileHover={{ scale: 1.1, color: 'var(--rose)' }} whileTap={{ scale: 0.9 }} title="Move to Trash"><TrashIcon /></motion.button>
            </>
          ) : (
            <>
              <motion.button className={styles.actionBtn} onClick={e => { e.stopPropagation(); onRestore(todo.id) }} whileHover={{ scale: 1.1, color: 'var(--emerald)' }} whileTap={{ scale: 0.9 }} title="Restore Task"><RestoreIcon /></motion.button>
              <motion.button className={`${styles.actionBtn} ${styles.delBtn}`} onClick={e => { e.stopPropagation(); setShowConfirm(true) }} whileHover={{ scale: 1.1, color: 'var(--rose)' }} whileTap={{ scale: 0.9 }} title="Permanently Delete"><TrashIcon /></motion.button>
            </>
          )}
        </div>
      </div>

      {/* Expand panel */}
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
                  value={todo.dueDate ? todo.dueDate.split('T')[0] : ''}
                  onChange={e => onUpdate(todo.id, { dueDate: e.target.value || null })}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Centered Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className={styles.modalBackdrop} onClick={e => e.stopPropagation()}>
            <motion.div 
              className={styles.modalContent}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalIconWrap}><TrashIcon /></div>
                <h3>Delete Task</h3>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.modalTaskText}>"{todo.text.length > 40 ? todo.text.substring(0, 40) + '...' : todo.text}"</p>
                <p className={styles.modalWarning}>This task will be permanently removed from your workspace. This action cannot be undone.</p>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.modalBtnCancel} onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className={styles.modalBtnDelete} onClick={() => onDelete(todo.id)}>Delete Task</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

export default TodoItem
