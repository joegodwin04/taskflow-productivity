// AnalyticsChart.jsx — Premium Analytics Redesign
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES } from '../hooks/useTodos'
import { useTheme } from '../context/ThemeContext'
import styles from './AnalyticsChart.module.css'

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
    const ds       = toLocalDateStr(d)
    const label    = d.toLocaleDateString('en-US', { weekday: 'short' })
    const fullDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const isToday  = i === 6

    const completedThatDay = todos.filter(t => t.completed && toLocalDateStr(t.completedAt) === ds)
    const categories = {}
    CATEGORIES.forEach(cat => {
      categories[cat.id] = completedThatDay.filter(t => t.category === cat.id).length
    })

    return {
      date: ds,
      label,
      fullDate,
      isToday,
      categories,
      totalCompleted: completedThatDay.length,
    }
  })
}

function getNiceMax(value) {
  if (value <= 5)   return 5
  if (value <= 10)  return 10
  if (value <= 25)  return 25
  if (value <= 50)  return 50
  if (value <= 100) return 100
  return Math.ceil(value / 50) * 50
}

// Mini sparkline for the trend line overlay
function SparkPath({ days, max, height, width }) {
  if (!days || days.length === 0) return null
  const pts = days.map((d, i) => {
    const x = (i / (days.length - 1)) * width
    const y = height - (d.totalCompleted / max) * height
    return `${x},${y}`
  })
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: '0 0 28px 32px', pointerEvents: 'none', zIndex: 2 }}
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c6af7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="url(#sparkGrad)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="4 3"
        opacity="0.55"
      />
      {/* Dots at data points */}
      {days.map((d, i) => {
        if (d.totalCompleted === 0) return null
        const x = (i / (days.length - 1)) * width
        const y = height - (d.totalCompleted / max) * height
        return (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#7c6af7" opacity="0.7" />
        )
      })}
    </svg>
  )
}

export default function AnalyticsChart({ todos, stats }) {
  const { theme } = useTheme()
  const [hoveredDay, setHoveredDay] = useState(null)

  const days = useMemo(() => getLast7Days(todos), [todos])
  const totalCompletedThisWeek = days.reduce((s, d) => s + d.totalCompleted, 0)
  const hasData = todos.length > 0

  const maxCompleted = Math.max(...days.map(d => d.totalCompleted), 0)
  const chartMax = getNiceMax(maxCompleted)

  const gridLines = [
    { pct: 100, label: chartMax },
    { pct: 66,  label: Math.round(chartMax * 0.66) },
    { pct: 33,  label: Math.round(chartMax * 0.33) },
    { pct: 0,   label: 0 },
  ]

  // Which categories have any completions
  const activeCategories = CATEGORIES.filter(cat =>
    todos.some(t => t.category === cat.id && t.completed)
  )

  // Best day
  const bestDay = days.reduce((best, d) => d.totalCompleted > (best?.totalCompleted ?? -1) ? d : best, null)

  // Trend vs last week (simple: compare first 3 days vs last 3 days of the window)
  const firstHalf  = days.slice(0, 3).reduce((s, d) => s + d.totalCompleted, 0)
  const secondHalf = days.slice(4).reduce((s, d) => s + d.totalCompleted, 0)
  const trendUp    = secondHalf >= firstHalf

  return (
    <div className={styles.wrap} data-theme={theme}>

      {/* ── TOP HEADER ── */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <span className={styles.eyebrow}>Weekly Activity</span>
            <span className={`${styles.trendPill} ${trendUp ? styles.trendUp : styles.trendDown}`}>
              {trendUp ? '↑' : '↓'} {trendUp ? 'Trending up' : 'Trending down'}
            </span>
          </div>
          <div className={styles.mainMetric}>
            <motion.span
              className={styles.metricValue}
              key={totalCompletedThisWeek}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {totalCompletedThisWeek}
            </motion.span>
            <span className={styles.metricLabel}>tasks completed this week</span>
          </div>
        </div>

        {hasData && (
          <div className={styles.headerStats}>
            <div className={styles.headerStat}>
              <span className={styles.headerStatVal}>{stats.completionRate}%</span>
              <span className={styles.headerStatLbl}>Completion Rate</span>
            </div>
            {bestDay && bestDay.totalCompleted > 0 && (
              <>
                <div className={styles.headerStatDivider} />
                <div className={styles.headerStat}>
                  <span className={styles.headerStatVal}>{bestDay.totalCompleted}</span>
                  <span className={styles.headerStatLbl}>Best Day ({bestDay.label})</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <span className={styles.emptyTitle}>No activity yet</span>
          <span className={styles.emptyText}>Complete tasks to unlock your productivity breakdown and insights.</span>
        </div>
      ) : (
        <>
          {/* ── LEGEND ── */}
          {activeCategories.length > 0 && (
            <div className={styles.legend}>
              {activeCategories.map(cat => (
                <div key={cat.id} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: cat.color }} />
                  <span className={styles.legendLabel}>{cat.icon} {cat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── CHART AREA ── */}
          <div className={styles.chartOuter}>
            {/* Sparkline trend overlay */}
            <SparkPath days={days} max={chartMax} height={192} width={500} />

            {/* Horizontal Grid Lines */}
            <div className={styles.gridLines}>
              {gridLines.map(line => (
                <div key={line.pct} className={styles.gridLineGroup} style={{ bottom: `${line.pct}%` }}>
                  <span className={styles.gridLabel}>{line.label}</span>
                  <div className={styles.gridLine} />
                </div>
              ))}
            </div>

            {/* Bar Columns */}
            <div className={styles.barsRow} onMouseLeave={() => setHoveredDay(null)}>
              {days.map((day, i) => (
                <div
                  key={day.date}
                  className={`${styles.dayCol} ${day.isToday ? styles.todayCol : ''}`}
                  onMouseEnter={() => setHoveredDay(day)}
                >
                  {day.isToday && <div className={styles.todayGlow} />}

                  <div className={styles.barsArea}>
                    {day.totalCompleted === 0 ? (
                      <div className={styles.emptyBar} />
                    ) : (
                      <div className={styles.barStack}>
                        {CATEGORIES.map(cat => {
                          const count = day.categories[cat.id] || 0
                          if (count === 0) return null
                          const pct = (count / chartMax) * 100
                          return (
                            <motion.div
                              key={cat.id}
                              className={styles.stackedSegment}
                              style={{ '--segment-color': cat.color }}
                              initial={{ scaleY: 0, opacity: 0 }}
                              animate={{ scaleY: 1, opacity: 1, height: `${pct}%` }}
                              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 + 0.1 }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Day total label above bar */}
                  {day.totalCompleted > 0 && (
                    <motion.span
                      className={styles.barTotal}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + 0.4 }}
                    >
                      {day.totalCompleted}
                    </motion.span>
                  )}

                  <span className={`${styles.xLabel} ${day.isToday ? styles.xLabelToday : ''}`}>
                    {day.label}
                    {day.isToday && <span className={styles.todayDot} />}
                  </span>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {hoveredDay?.date === day.date && (
                      <motion.div
                        className={styles.tooltip}
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                      >
                        <div className={styles.tooltipHeader}>
                          <span className={styles.tooltipDate}>{day.fullDate}</span>
                          <span className={styles.tooltipTotal}>{day.totalCompleted} total</span>
                        </div>
                        <div className={styles.tooltipDivider} />
                        {day.totalCompleted === 0 ? (
                          <div className={styles.tooltipEmpty}>No tasks completed</div>
                        ) : (
                          CATEGORIES.map(cat => {
                            const count = day.categories[cat.id]
                            if (!count) return null
                            return (
                              <div key={cat.id} className={styles.tooltipRow}>
                                <div className={styles.tooltipLabel}>
                                  <span className={styles.tooltipDot} style={{ background: cat.color }} />
                                  <span>{cat.icon} {cat.label}</span>
                                </div>
                                <span className={styles.tooltipVal}>{count}</span>
                              </div>
                            )
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* ── CATEGORY BREAKDOWN CARDS ── */}
          {activeCategories.length > 0 && (
            <div className={styles.insightSection}>
              <div className={styles.insightSectionHeader}>
                <span className={styles.insightSectionTitle}>Breakdown by Category</span>
                <span className={styles.insightSectionSub}>All time completions</span>
              </div>
              <div className={styles.insightBar}>
                {activeCategories.map((cat, i) => {
                  const count = todos.filter(t => t.category === cat.id && t.completed).length
                  const total = todos.filter(t => t.completed).length
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <motion.div
                      key={cat.id}
                      className={styles.insightCard}
                      style={{ '--cat-color': cat.color }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: i * 0.08 + 0.2 }}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    >
                      {/* Color accent bar */}
                      <div className={styles.insightAccent} style={{ background: cat.color }} />

                      <div className={styles.insightIcon}>{cat.icon}</div>
                      <div className={styles.insightMeta}>
                        <span className={styles.insightCount}>{count}</span>
                        <span className={styles.insightName}>{cat.label}</span>
                      </div>
                      {/* Mini progress bar */}
                      <div className={styles.insightProgress}>
                        <div
                          className={styles.insightProgressFill}
                          style={{ width: `${pct}%`, background: cat.color }}
                        />
                      </div>
                      <span className={styles.insightPct}>{pct}%</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
