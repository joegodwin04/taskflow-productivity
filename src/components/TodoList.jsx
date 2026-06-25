// TodoList.jsx — with AnimatePresence
import { motion, AnimatePresence } from 'framer-motion'
import TodoItem from './TodoItem'
import styles from './TodoList.module.css'

const EMPTY = {
  all:       { icon: '✨', title: 'No tasks yet',      sub: 'Hit the + button to create your first task!' },
  active:    { icon: '🎉', title: "You're all caught up!", sub: 'All tasks are complete. Take a break!' },
  completed: { icon: '📭', title: 'Nothing here yet',   sub: 'Complete tasks to see them here.' },
}

export default function TodoList({ todos, filter, loading, onToggle, onDelete, onUpdate }) {
  if (loading) {
    return (
      <div className={styles.empty} style={{ animation: 'pulse 1.5s infinite', opacity: 0.6 }}>
        <h3 className={styles.emptyTitle}>Loading tasks...</h3>
        <p className={styles.emptySub}>Please wait while we sync your workspace.</p>
      </div>
    )
  }

  if (todos.length === 0) {
    const e = EMPTY[filter] || EMPTY.all
    return (
      <motion.div
        className={styles.empty}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className={styles.emptyIcon}
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          {e.icon}
        </motion.div>
        <h3 className={styles.emptyTitle}>{e.title}</h3>
        <p className={styles.emptySub}>{e.sub}</p>
      </motion.div>
    )
  }

  return (
    <div className={styles.list}>
      <AnimatePresence>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
