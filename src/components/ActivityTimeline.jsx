// ActivityTimeline.jsx — Recent task events feed
import { motion } from 'framer-motion'
import { PRIORITIES, CATEGORIES } from '../hooks/useTodos'
import styles from './ActivityTimeline.module.css'

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function ActivityTimeline({ todos }) {
  // Build event list from todos
  const events = []
  todos.forEach(t => {
    const cat   = CATEGORIES.find(c => c.id === t.category) || CATEGORIES[4]
    const prio  = PRIORITIES[t.priority] || PRIORITIES.medium
    events.push({ id: `c_${t.id}`, type: 'created',   todo: t, ts: t.createdAt,    cat, prio })
    if (t.completedAt) {
      events.push({ id: `d_${t.id}`, type: 'completed', todo: t, ts: t.completedAt, cat, prio })
    }
  })
  events.sort((a, b) => new Date(b.ts) - new Date(a.ts))
  const recent = events.slice(0, 8)

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>Activity</h3>
        <span className={styles.badge}>{events.length} events</span>
      </div>

      {recent.length === 0 ? (
        <div className={styles.empty}>
          <span>📋</span>
          <p>No activity yet</p>
        </div>
      ) : (
        <div className={styles.list}>
          {recent.map((ev, i) => (
            <motion.div
              key={ev.id}
              className={styles.item}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`${styles.dot} ${ev.type === 'completed' ? styles.dotDone : styles.dotCreated}`}>
                {ev.type === 'completed' ? '✓' : '+'}
              </div>
              <div className={styles.line} />
              <div className={styles.body}>
                <span className={styles.action}>
                  {ev.type === 'completed' ? 'Completed' : 'Added'}
                </span>
                <span className={styles.taskText}>{ev.todo.text}</span>
                <div className={styles.meta}>
                  <span style={{ color: ev.cat.color }}>{ev.cat.icon} {ev.cat.label}</span>
                  <span className={styles.time}>{relativeTime(ev.ts)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
