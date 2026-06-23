// Dashboard.jsx — Premium SaaS productivity dashboard
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CATEGORIES, PRIORITIES } from '../hooks/useTodos'
import PomodoroTimer from './PomodoroTimer'
import HabitTracker from './HabitTracker'
import GoalTracker from './GoalTracker'
import ActivityTimeline from './ActivityTimeline'
import AnalyticsChart from './AnalyticsChart'
import styles from './Dashboard.module.css'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16,1,0.3,1] } }
}

function useCountUp(target, ms = 1100) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (target === 0) {
      setTimeout(() => setN(0), 0)
      return
    }
    let start = null
    let frameId = null
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / ms, 1)
      setN(Math.floor(p * target))
      if (p < 1) {
        frameId = requestAnimationFrame(step)
      } else {
        setN(target)
      }
    }
    frameId = requestAnimationFrame(step)
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [target, ms])
  return n
}

function StatCard({ label, value, icon, gradient, glow }) {
  const animated = useCountUp(value)
  return (
    <motion.div
      className={styles.statCard}
      variants={item}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320 }}
    >
      <div className={styles.statCardInner}>
        <div className={styles.statIcon} style={{ background: gradient }}>{icon}</div>
        <div className={styles.statBody}>
          <span className={styles.statValue}>{animated}</span>
          <span className={styles.statLabel}>{label}</span>
        </div>
      </div>
      <div className={styles.statGlow} style={{ background: glow }} />
    </motion.div>
  )
}

function ProductivityRing({ rate }) {
  const r = 54, circ = 2 * Math.PI * r
  const [off, setOff] = useState(circ)
  useEffect(() => { const t = setTimeout(() => setOff(circ - (rate/100)*circ), 250); return () => clearTimeout(t) }, [rate, circ])
  return (
    <div className={styles.ringWrap}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke="url(#rg)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16,1,0.3,1)' }}/>
        <defs>
          <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c6af7"/><stop offset="100%" stopColor="#22d3ee"/>
          </linearGradient>
        </defs>
      </svg>
      <div className={styles.ringCenter}>
        <span className={styles.ringPct}>{rate}%</span>
        <span className={styles.ringLbl}>Complete</span>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return { text: 'Late night grind',  emoji: '🌙' }
  if (h < 12) return { text: 'Good morning',      emoji: '☀️' }
  if (h < 17) return { text: 'Good afternoon',    emoji: '⚡' }
  if (h < 21) return { text: 'Good evening',      emoji: '🌇' }
  return { text: 'Working late', emoji: '🌙' }
}

export default function Dashboard({ stats, todos, onNavigate, user }) {
  const userName = user?.name ? user.name.split(' ')[0] : 'Builder'
  const greeting = getGreeting()
  const recentTodos = [...todos].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5)
  const catStats = CATEGORIES.map(c => ({
    ...c,
    count: todos.filter(t => t.category === c.id).length,
    done:  todos.filter(t => t.category === c.id && t.completed).length,
  })).filter(c => c.count > 0)
  const maxCat = Math.max(...catStats.map(c => c.count), 1)

  return (
    <motion.div className={styles.dashboard} variants={container} initial="hidden" animate="show">

      {/* ── Row 1: Hero ── */}
      <motion.div className={styles.hero} variants={item}>
        <div className={styles.heroLeft}>
          <motion.div
            className={styles.heroEmoji}
            animate={{ y: [0,-8,0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          >{greeting.emoji}</motion.div>
          <div>
            <h1 className={styles.heroTitle}>{greeting.text}, {userName}!</h1>
            <p className={styles.heroSub}>
              {stats.active === 0 && stats.total === 0
                ? 'Ready to be productive? Add your first task 🚀'
                : stats.active === 0
                  ? "You've crushed everything — amazing work today! 🎉"
                  : `${stats.active} task${stats.active !== 1 ? 's' : ''} left · ${stats.completionRate}% done`}
            </p>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.dateChip}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <button className={styles.heroCta} onClick={() => onNavigate('tasks')}>
            + Add Task
          </button>
        </div>
      </motion.div>

      {/* ── Row 2: Stats cards ── */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Tasks"  value={stats.total}     icon="📋" gradient="linear-gradient(135deg,#7c6af7,#a78bfa)" glow="rgba(124,106,247,0.28)" />
        <StatCard label="In Progress"  value={stats.active}    icon="⚡" gradient="linear-gradient(135deg,#22d3ee,#7c6af7)" glow="rgba(34,211,238,0.25)"  />
        <StatCard label="Completed"    value={stats.completed} icon="✅" gradient="linear-gradient(135deg,#10b981,#22d3ee)" glow="rgba(16,185,129,0.25)"  />
        <StatCard label="Overdue"      value={stats.overdue}   icon="⚠️" gradient="linear-gradient(135deg,#f43f5e,#f59e0b)" glow="rgba(244,63,94,0.25)"   />
      </div>

      {/* ── Row 3: Pomodoro + Productivity Ring + Activity ── */}
      <div className={styles.row3}>
        {/* Pomodoro */}
        <motion.div variants={item}>
          <PomodoroTimer compact user={user} />
        </motion.div>

        {/* Productivity ring widget */}
        <motion.div className={styles.widget} variants={item} whileHover={{ y: -2 }}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>Completion</span>
            <span className={styles.widgetBadge}>Today</span>
          </div>
          <div className={styles.ringContainer}>
            <ProductivityRing rate={stats.completionRate} />
            <div className={styles.ringStats}>
              <div className={styles.ringStat}>
                <span className={styles.rsVal} style={{ color: 'var(--emerald)' }}>{stats.completed}</span>
                <span className={styles.rsLbl}>Done</span>
              </div>
              <div className={styles.ringDiv}/>
              <div className={styles.ringStat}>
                <span className={styles.rsVal} style={{ color: 'var(--cyan)' }}>{stats.active}</span>
                <span className={styles.rsLbl}>Left</span>
              </div>
              {stats.overdue > 0 && <>
                <div className={styles.ringDiv}/>
                <div className={styles.ringStat}>
                  <span className={styles.rsVal} style={{ color: 'var(--rose)' }}>{stats.overdue}</span>
                  <span className={styles.rsLbl}>Overdue</span>
                </div>
              </>}
            </div>
          </div>
        </motion.div>

        {/* Activity timeline */}
        <motion.div variants={item}>
          <ActivityTimeline todos={todos} />
        </motion.div>
      </div>

      {/* ── Row 4: Habit Tracker (full width) ── */}
      <motion.div variants={item}>
        <HabitTracker user={user} />
      </motion.div>

      {/* ── Row 5: Analytics + Goals ── */}
      <div className={styles.row5}>
        <motion.div variants={item}>
          <AnalyticsChart todos={todos} stats={stats} />
        </motion.div>
        <motion.div variants={item}>
          <GoalTracker user={user} />
        </motion.div>
      </div>

      {/* ── Row 6: Category breakdown + Recent tasks ── */}
      <div className={styles.row6}>
        {/* Category breakdown */}
        <motion.div className={styles.widget} variants={item} whileHover={{ y: -2 }}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>By Category</span>
            <span className={styles.widgetBadge}>{catStats.length} active</span>
          </div>
          {catStats.length === 0 ? (
            <div className={styles.emptyW}>Add tasks with categories to see breakdown</div>
          ) : (
            <div className={styles.catList}>
              {catStats.map((cat, i) => (
                <motion.div key={cat.id} className={styles.catRow}
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 + 0.3 }}>
                  <span className={styles.catIcon}>{cat.icon}</span>
                  <div className={styles.catBarWrap}>
                    <div className={styles.catMeta}>
                      <span className={styles.catName}>{cat.label}</span>
                      <span className={styles.catCount}>{cat.done}/{cat.count}</span>
                    </div>
                    <div className={styles.catTrack}>
                      <motion.div className={styles.catFill} style={{ '--cc': cat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.count / maxCat) * 100}%` }}
                        transition={{ duration: 0.9, ease: [0.16,1,0.3,1], delay: i * 0.08 + 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent tasks */}
        <motion.div className={styles.widget} variants={item} whileHover={{ y: -2 }}>
          <div className={styles.widgetHeader}>
            <span className={styles.widgetTitle}>Recent Tasks</span>
            <button className={styles.viewAllBtn} onClick={() => onNavigate('tasks')}>View all →</button>
          </div>
          {recentTodos.length === 0 ? (
            <div className={styles.emptyW}>
              <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>✨</span>
              No tasks yet. <button className={styles.linkBtn} onClick={() => onNavigate('tasks')}>Add your first →</button>
            </div>
          ) : (
            <div className={styles.recentList}>
              {recentTodos.map((t, i) => {
                const prio = PRIORITIES[t.priority]
                const cat  = CATEGORIES.find(c => c.id === t.category) || CATEGORIES[4]
                return (
                  <motion.div key={t.id} className={`${styles.recentItem} ${t.completed ? styles.recentDone : ''}`}
                    initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 + 0.3 }}>
                    <div className={styles.recentDot} style={{ background: prio?.color }} />
                    <span className={styles.recentText}>{t.text}</span>
                    <span className={styles.recentCat}>{cat.icon}</span>
                    {t.completed && <span className={styles.recentCheck}>✓</span>}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
