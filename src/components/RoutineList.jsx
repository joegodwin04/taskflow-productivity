import { motion, AnimatePresence } from 'framer-motion'
import RoutineCard from './RoutineCard'
import styles from './TodoList.module.css' // We can reuse the list layout styles

export default function RoutineList({ routines, loading, onToggle }) {
  if (loading) {
    return (
      <div className={styles.empty} style={{ animation: 'pulse 1.5s infinite', opacity: 0.6 }}>
        <h3 className={styles.emptyTitle}>Loading routines...</h3>
      </div>
    )
  }

  if (routines.length === 0) {
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
          ☀️
        </motion.div>
        <h3 className={styles.emptyTitle}>No Daily Routines</h3>
        <p className={styles.emptySub}>Add a daily routine to build consistent habits.</p>
      </motion.div>
    )
  }

  return (
    <div className={styles.list}>
      <AnimatePresence>
        {routines.map(routine => (
          <RoutineCard
            key={routine.routineId}
            routine={routine}
            onToggle={onToggle}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
