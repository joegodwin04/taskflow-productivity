// Filters.jsx — Premium filter bar with Framer Motion
import { motion } from 'framer-motion'
import { CATEGORIES, PRIORITIES } from '../hooks/useTodos'
import styles from './Filters.module.css'

const STATUS_TABS = [
  { id: 'all',       label: 'All',       icon: '◉' },
  { id: 'active',    label: 'Active',    icon: '⚡' },
  { id: 'completed', label: 'Completed', icon: '✓' },
  { id: 'archive',   label: 'Archive',   icon: '📦' },
  { id: 'trash',     label: 'Trash',     icon: '🗑️' },
]
const SORT_OPTIONS = [
  { id: 'createdAt', label: '⏱ Newest' },
  { id: 'priority',  label: '🎯 Priority' },
  { id: 'dueDate',   label: '📅 Due Date' },
  { id: 'alpha',     label: '🔤 A–Z' },
]

export default function Filters({
  filter, setFilter,
  categoryFilter, setCategoryFilter,
  priorityFilter, setPriorityFilter,
  sortBy, setSortBy,
  filteredCount, onClearCompleted, completedCount,
  onEmptyTrash, trashedCount
}) {
  return (
    <div className={styles.wrap}>
      {/* Status tabs */}
      <div className={styles.tabRow} role="tablist">
        {STATUS_TABS.map(tab => (
          <motion.button
            key={tab.id}
            id={`filter-${tab.id}`}
            role="tab"
            className={`${styles.tab} ${filter === tab.id ? styles.tabActive : ''}`}
            onClick={() => setFilter(tab.id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            {filter === tab.id && (
              <motion.div
                className={styles.tabPill}
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Categories + sort row */}
      <div className={styles.secondRow}>
        {/* Category chips */}
        <div className={styles.chips}>
          <motion.button
            className={`${styles.chip} ${categoryFilter === 'all' ? styles.chipActive : ''}`}
            onClick={() => setCategoryFilter('all')}
            whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}
          >
            🌐 All
          </motion.button>
          {CATEGORIES.map(cat => (
            <motion.button
              key={cat.id}
              id={`cat-${cat.id}`}
              className={`${styles.chip} ${categoryFilter === cat.id ? styles.chipActive : ''}`}
              style={{ '--c': cat.color }}
              onClick={() => setCategoryFilter(cat.id)}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}
            >
              {cat.icon} {cat.label}
            </motion.button>
          ))}
        </div>

        <div className={styles.rightControls}>
          {/* Priority filter dots */}
          <div className={styles.prioDots}>
            <button
              className={`${styles.prioDot} ${styles.prioAll} ${priorityFilter === 'all' ? styles.prioDotActive : ''}`}
              onClick={() => setPriorityFilter('all')} title="All priorities"
            >●</button>
            {Object.entries(PRIORITIES).map(([k, v]) => (
              <motion.button
                key={k}
                id={`prio-${k}`}
                className={`${styles.prioDot} ${priorityFilter === k ? styles.prioDotActive : ''}`}
                style={{ '--p': v.color }}
                onClick={() => setPriorityFilter(k)}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                title={v.label}
              >
                {v.icon}
              </motion.button>
            ))}
          </div>

          {/* Sort */}
          <div className={styles.sortWrap}>
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13" className={styles.sortIcon}>
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <select id="sort-select" className={styles.sortSel} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className={styles.metaRow}>
        <span className={styles.countBadge}>{filteredCount} task{filteredCount !== 1 ? 's' : ''}</span>
        {filter !== 'trash' && completedCount > 0 && (
          <motion.button
            id="clear-completed"
            className={styles.clearBtn}
            onClick={onClearCompleted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
              <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Clear {completedCount} completed
          </motion.button>
        )}
        {filter === 'trash' && trashedCount > 0 && (
          <motion.button
            id="empty-trash"
            className={`${styles.clearBtn} ${styles.dangerBtn || ''}`}
            onClick={onEmptyTrash}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ '--c': 'var(--rose)' }}
          >
            <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
              <path d="M4 4l1.5 9h5l1.5-9M6 4V2h4v2M2 4h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Empty Trash ({trashedCount})
          </motion.button>
        )}
      </div>
    </div>
  )
}
