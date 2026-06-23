// AnalyticsChart.jsx — Pure CSS flex bar chart. No SVG misalignment possible.
import { motion } from 'framer-motion'
import { CATEGORIES } from '../hooks/useTodos'
import { useTheme } from '../context/ThemeContext'
import styles from './AnalyticsChart.module.css'

// Convert any date value to a local YYYY-MM-DD string
function toLocalDateStr(dateVal) {
  if (!dateVal) return null
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
  if (isNaN(d.getTime())) return null
  const year  = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getLast7Days(todos) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const ds    = toLocalDateStr(d)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    return {
      date:      ds,
      label,
      created:   todos.filter(t => toLocalDateStr(t.createdAt)   === ds).length,
      completed: todos.filter(t => toLocalDateStr(t.completedAt) === ds).length,
    }
  })
}

// Pure CSS flex chart — each day column holds its bars + label.
// This guarantees perfect bar-to-label alignment at any container width.
function BarChart({ days }) {
  const maxVal = Math.max(...days.flatMap(d => [d.created, d.completed]), 1)

  return (
    <div className={styles.chartOuter}>
      {/* Y-axis grid lines — purely decorative, behind the bars */}
      <div className={styles.gridLines}>
        {[0, 25, 50, 75, 100].map(pct => (
          <div key={pct} className={styles.gridLine} style={{ bottom: `${pct}%` }} />
        ))}
      </div>

      {/* Day columns */}
      <div className={styles.barsRow}>
        {days.map((day, i) => {
          const createdPct   = (day.created   / maxVal) * 100
          const completedPct = (day.completed / maxVal) * 100

          return (
            <div key={day.date} className={styles.dayCol}>
              {/* Bars area — grows to fill all available height */}
              <div className={styles.barsArea}>
                {/* Created bar (violet) */}
                <div className={styles.barWrap}>
                  <motion.div
                    className={styles.bar}
                    style={{ '--bar-color': '#7c6af7' }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1, height: `${Math.max(createdPct, 3)}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                    title={`Created: ${day.created}`}
                  />
                </div>
                {/* Completed bar (emerald) */}
                <div className={styles.barWrap}>
                  <motion.div
                    className={styles.bar}
                    style={{ '--bar-color': '#10b981' }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1, height: `${Math.max(completedPct, 3)}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 + 0.04 }}
                    title={`Completed: ${day.completed}`}
                  />
                </div>
              </div>
              {/* Label — always directly below its bars */}
              <span className={styles.xLabel}>{day.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AnalyticsChart({ todos, stats }) {
  const { theme } = useTheme()
  const days           = getLast7Days(todos)
  const totalCreated   = days.reduce((s, d) => s + d.created, 0)
  const totalCompleted = days.reduce((s, d) => s + d.completed, 0)
  const hasData        = todos.length > 0

  // Category stats
  const catStats = CATEGORIES.map(cat => ({
    ...cat,
    count: todos.filter(t => t.category === cat.id).length,
    done:  todos.filter(t => t.category === cat.id && t.completed).length,
  })).filter(c => c.count > 0)

  return (
    <div className={styles.wrap} data-theme={theme}>
      <div className={styles.header}>
        <h3 className={styles.title}>Weekly Activity</h3>
        <span className={styles.sub}>Last 7 days</span>
      </div>

      {!hasData ? (
        /* ── Rich empty state ── */
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>📊</span>
          <span className={styles.emptyTitle}>No activity yet</span>
          <span className={styles.emptyText}>
            Add tasks and complete them to see your weekly productivity chart here.
          </span>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal} style={{ color: 'var(--violet-light)' }}>{totalCreated}</span>
              <span className={styles.summaryLbl}>Created</span>
            </div>
            <div className={styles.summaryDiv} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal} style={{ color: 'var(--emerald)' }}>{totalCompleted}</span>
              <span className={styles.summaryLbl}>Completed</span>
            </div>
            <div className={styles.summaryDiv} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryVal} style={{ color: 'var(--cyan)' }}>{stats.completionRate}%</span>
              <span className={styles.summaryLbl}>Rate</span>
            </div>
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#7c6af7' }} />
              <span>Created</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: '#10b981' }} />
              <span>Completed</span>
            </div>
          </div>

          {/* Chart */}
          <BarChart days={days} />

          {/* Category stats */}
          {catStats.length > 0 && (
            <div className={styles.catGrid}>
              {catStats.slice(0, 4).map(cat => (
                <div key={cat.id} className={styles.catCard} style={{ '--cc': cat.color }}>
                  <span className={styles.catIcon}>{cat.icon}</span>
                  <span className={styles.catCount}>{cat.count}</span>
                  <span className={styles.catName}>{cat.label}</span>
                  <div className={styles.catBar}>
                    <motion.div
                      className={styles.catBarFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.count > 0 ? (cat.done / cat.count) * 100 : 0}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
