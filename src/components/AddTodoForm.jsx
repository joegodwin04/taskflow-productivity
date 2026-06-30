// AddTodoForm.jsx
import { useState, useRef } from 'react'
import { PRIORITIES, CATEGORIES } from '../hooks/useTodos'
import styles from './AddTodoForm.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function AddTodoForm({ onAdd }) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('other')
  const [isRoutine, setIsRoutine] = useState(false)
  const [scheduleType, setScheduleType] = useState('daily')
  const [scheduleDays, setScheduleDays] = useState([])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
      return
    }
    onAdd({ 
      text, 
      priority, 
      category, 
      isRoutine,
      scheduleType: isRoutine ? scheduleType : null,
      scheduleDays: isRoutine && scheduleType === 'weekly' ? scheduleDays : null,
      dueDate: !isRoutine && dueDate ? dueDate : null, 
      notes: !isRoutine ? notes : '' 
    })
    setText('')
    setNotes('')
    setDueDate('')
    setPriority('medium')
    setCategory('other')
    setIsRoutine(false)
    setScheduleType('daily')
    setScheduleDays([])
    setExpanded(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e)
    if (e.key === 'Escape') setExpanded(false)
  }

  return (
    <div className={`${styles.wrap} ${expanded ? styles.expanded : ''}`}>
      <form onSubmit={handleSubmit}>
        {/* Main input */}
        <div className={`${styles.inputRow} ${shake ? styles.shake : ''}`}>
          <div className={styles.plusIcon}>
            <svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </div>
          <input
            ref={inputRef}
            id="new-task-input"
            className={styles.mainInput}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task... (Press Enter to save)"
            maxLength={200}
            autoComplete="off"
          />
          {text && (
            <button type="button" className={styles.clearBtn} onClick={() => setText('')} aria-label="Clear input">
              <svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* Expanded options */}
        {expanded && (
          <div className={styles.options}>
            {/* Priority */}
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Priority</label>
              <div className={styles.priorityBtns}>
                {Object.entries(PRIORITIES).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    id={`priority-${key}`}
                    className={`${styles.priorityBtn} ${priority === key ? styles.active : ''}`}
                    style={{ '--p-color': val.color, '--p-bg': val.bg }}
                    onClick={() => setPriority(key)}
                  >
                    {val.icon} {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Category</label>
              <div className={styles.categoryBtns}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    id={`category-${cat.id}`}
                    className={`${styles.categoryBtn} ${category === cat.id ? styles.active : ''}`}
                    style={{ '--c-color': cat.color }}
                    onClick={() => setCategory(cat.id)}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Type Toggle */}
            <div className={styles.optionGroup}>
              <div className={styles.typeToggle}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${!isRoutine ? styles.active : ''}`}
                  onClick={() => setIsRoutine(false)}
                >
                  One-time Task
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${isRoutine ? styles.active : ''}`}
                  onClick={() => setIsRoutine(true)}
                >
                  Daily Routine
                </button>
              </div>
            </div>

            {/* Due date & notes OR Schedule */}
            {isRoutine ? (
              <div className={styles.row2}>
                <div className={`${styles.optionGroup} ${styles.grow}`}>
                  <label className={styles.optionLabel}>Schedule</label>
                  <div className={styles.scheduleOptions}>
                    <button type="button" className={`${styles.schedBtn} ${scheduleType === 'daily' ? styles.active : ''}`} onClick={() => setScheduleType('daily')}>Every Day</button>
                    <button type="button" className={`${styles.schedBtn} ${scheduleType === 'weekdays' ? styles.active : ''}`} onClick={() => setScheduleType('weekdays')}>Weekdays</button>
                    <button type="button" className={`${styles.schedBtn} ${scheduleType === 'weekly' ? styles.active : ''}`} onClick={() => setScheduleType('weekly')}>Custom</button>
                  </div>
                  {scheduleType === 'weekly' && (
                    <div className={styles.daySelector}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                        const active = scheduleDays.includes(idx)
                        return (
                          <button 
                            key={day} 
                            type="button" 
                            className={`${styles.dayBtn} ${active ? styles.active : ''}`}
                            onClick={() => {
                              if (active) setScheduleDays(prev => prev.filter(d => d !== idx))
                              else setScheduleDays(prev => [...prev, idx])
                            }}
                          >
                            {day[0]}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.row2}>
                <div className={styles.optionGroup}>
                  <label className={styles.optionLabel} htmlFor="due-date-input">Due Date</label>
                  <input
                    id="due-date-input"
                    type="date"
                    className={styles.dateInput}
                    value={dueDate}
                    min={today()}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
                <div className={`${styles.optionGroup} ${styles.grow}`}>
                  <label className={styles.optionLabel} htmlFor="notes-input">Notes</label>
                  <input
                    id="notes-input"
                    type="text"
                    className={styles.notesInput}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    maxLength={300}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setExpanded(false)}>
                Cancel
              </button>
              <button type="submit" id="add-task-btn" className={styles.addBtn} disabled={!text.trim()}>
                <svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                Add Task
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
