// App.jsx — TaskFlow Premium Productivity Platform
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import AddTodoForm from './components/AddTodoForm'
import Filters from './components/Filters'
import TodoList from './components/TodoList'
import HabitTracker from './components/HabitTracker'
import GoalTracker from './components/GoalTracker'
import PomodoroTimer from './components/PomodoroTimer'
import AnalyticsChart from './components/AnalyticsChart'
import ActivityTimeline from './components/ActivityTimeline'
import { useTodos } from './hooks/useTodos'
import { useTheme } from './context/ThemeContext'
import Auth from './components/Auth'
import SettingsModal from './components/SettingsModal'
import { fetchAPI } from './utils/api'
import styles from './App.module.css'

const VIEW_META = {
  dashboard: { label: 'Dashboard',   icon: '⬡' },
  tasks:     { label: 'My Tasks',    icon: '◈' },
  habits:    { label: 'Habits',      icon: '🔥' },
  goals:     { label: 'Goals',       icon: '🎯' },
  focus:     { label: 'Focus Timer', icon: '⏱' },
  analytics: { label: 'Analytics',   icon: '📈' },
}

export default function App() {
  const [view, setView]           = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { theme, toggle: toggleTheme, setUserId } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tf_user') || sessionStorage.getItem('tf_user')
      if (saved) {
        const parsed = JSON.parse(saved)
        const { password, ...safeUser } = parsed
        return safeUser
      }
    } catch { /* ignore malformed storage data */ }
    return null
  })
  
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Validate session against the backend on load
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('tf_token') || sessionStorage.getItem('tf_token')
      if (!token) {
        setIsAuthLoading(false)
        return
      }

      try {
        const data = await fetchAPI('/auth/me')
        setUser(data.user)
        // Update local cache based on where they logged in
        if (localStorage.getItem('tf_token')) {
          localStorage.setItem('tf_user', JSON.stringify(data.user))
        } else {
          sessionStorage.setItem('tf_user', JSON.stringify(data.user))
        }
      } catch (err) {
        // Validation failed (expired, tampered, deleted)
        setUser(null)
        localStorage.removeItem('tf_token')
        sessionStorage.removeItem('tf_token')
        localStorage.removeItem('tf_user')
        sessionStorage.removeItem('tf_user')
      } finally {
        setIsAuthLoading(false)
      }
    }

    validateSession()
  }, [])

  // Sync theme context with current user identity
  useEffect(() => {
    setUserId(user?.id || null)
  }, [user?.id, setUserId])

  const handleLoginSuccess = useCallback((userData, remember = true) => {
    // Remove password field before storing in React state / localStorage
    const safeUser = { ...userData }
    delete safeUser.password
    setUser(safeUser)
    if (remember) {
      localStorage.setItem('tf_user', JSON.stringify(safeUser))
    } else {
      sessionStorage.setItem('tf_user', JSON.stringify(safeUser))
    }
  }, [])

  const {
    todos, filteredTodos, stats, todaysRoutines, routineStats, loading: todosLoading,
    filter, setFilter,
    categoryFilter, setCategoryFilter,
    priorityFilter, setPriorityFilter,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    addTodo, toggleTodo, deleteTodo, moveToTrash, restoreTask, archiveTask, duplicateTask, updateTodo, clearCompleted, emptyTrash,
  } = useTodos(user, showToast)

  const handleLogout = useCallback(() => {
    if (user && user.id && user.id.startsWith('guest_')) {
      // Clear this guest's temporary session data
      const keysToClear = [
        `taskflow_${user.id}_tasks`,
        `taskflow_${user.id}_habits`,
        `taskflow_${user.id}_goals`,
        `taskflow_${user.id}_analytics`,
        `taskflow_${user.id}_settings`,
        `taskflow_${user.id}_reports`,
        `taskflow_${user.id}_theme`
      ]
      keysToClear.forEach(k => localStorage.removeItem(k))
    }
    // Reset all in-memory UI state so no stale data bleeds into the next session
    setView('dashboard')
    setSearchQuery('')
    setFilter('all')
    setCategoryFilter('all')
    setPriorityFilter('all')
    setNotifOpen(false)
    setProfileOpen(false)
    setActiveSettingsTab(null)
    setUser(null)
    localStorage.setItem('tf_user', '') // Clear cleanly
    localStorage.removeItem('tf_user')
    localStorage.removeItem('tf_token')
    sessionStorage.removeItem('tf_user')
    sessionStorage.removeItem('tf_token')
  }, [user])

  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout()
      showToast('Session expired. Please log in again.', 'error')
    }
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [handleLogout, showToast])

  // Compute pomoSessions from stable user identity — depends on [user] for React Compiler compatibility
  const pomoSessions = useMemo(() => {
    if (!user?.id) return 0
    return parseInt(localStorage.getItem(`taskflow_${user.id}_analytics`) || '0', 10)
  }, [user])

  const handleSetView = useCallback((v) => {
    setView(v)
    if (v === 'tasks') { /* keep current filter */ }
  }, [])

  // Notifications derived from state
  const notifications = useMemo(() => {
    const notifs = []
    if (stats.overdue > 0) notifs.push({ id: 'overdue', icon: '⚠️', text: `${stats.overdue} task${stats.overdue > 1 ? 's' : ''} overdue`, color: 'var(--rose)' })
    if (stats.completed > 0 && stats.completionRate >= 80) notifs.push({ id: 'great', icon: '🏆', text: `${stats.completionRate}% completion rate — great work!`, color: 'var(--emerald)' })
    if (stats.active === 0 && stats.total > 0) notifs.push({ id: 'done', icon: '🎉', text: 'All tasks complete! Take a break.', color: 'var(--violet-light)' })
    if (stats.total === 0) notifs.push({ id: 'start', icon: '🚀', text: 'Add your first task to get started', color: 'var(--cyan)' })
    return notifs
  }, [stats])

  const pageVariants = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
    exit:    { opacity: 0, y: -12, transition: { duration: 0.2 } },
  }

  if (isAuthLoading) {
    return (
      <div className={styles.shell} data-theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className={styles.loadingSpinner} style={{ width: 32, height: 32, borderTopColor: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-300)', fontSize: '0.9rem' }}>Verifying session...</span>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div key={user?.id || 'no-user'} className={styles.shell} data-theme={theme}>
      {/* Ambient orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      {/* Sidebar */}
      <Sidebar 
        view={view} 
        setView={handleSetView} 
        stats={stats} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main */}
      <motion.main
        className={styles.main}
        animate={{ marginLeft: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* ── Top bar ── */}
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <motion.button className={styles.menuBtn}
              onClick={() => setCollapsed(v => !v)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              aria-label="Toggle sidebar"><MenuIcon /></motion.button>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbIcon}>{VIEW_META[view]?.icon}</span>
              <span className={styles.breadcrumbText}>{VIEW_META[view]?.label}</span>
            </div>
          </div>

          {/* Search bar */}
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                if (e.target.value && view !== 'tasks') setView('tasks')
              }}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className={styles.topRight}>
            {/* Stat pills */}
            <div className={styles.statPills}>
              <StatPill v={stats.active}    l="Active"  c="var(--cyan)" />
              <StatPill v={stats.completed} l="Done"    c="var(--emerald)" />
              {stats.overdue > 0 && <StatPill v={stats.overdue} l="Overdue" c="var(--rose)" pulse />}
            </div>

            {/* Progress bar */}
            <div className={styles.progWrap}>
              <span className={styles.progLabel}>{stats.completionRate}%</span>
              <div className={styles.progTrack}>
                <motion.div className={styles.progFill}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }} />
              </div>
            </div>

            {/* Notification bell */}
            <div className={styles.notifWrap}>
              <motion.button className={styles.iconBtn}
                onClick={() => setNotifOpen(v => !v)}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <BellIcon />
                {notifications.length > 0 && (
                  <span className={styles.notifBadge}>{notifications.length}</span>
                )}
              </motion.button>
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <motion.div className={styles.notifBackdrop}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setNotifOpen(false)} />
                    <motion.div className={styles.notifPanel}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}>
                      <div className={styles.notifHeader}>Notifications</div>
                      {notifications.map(n => (
                        <div key={n.id} className={styles.notifItem}>
                          <span style={{ fontSize: 18 }}>{n.icon}</span>
                          <span className={styles.notifText} style={{ color: n.color }}>{n.text}</span>
                        </div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <motion.button className={styles.iconBtn}
              onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.button>

            {/* Avatar with dropdown */}
            <div className={styles.avatarWrap}>
              <motion.div 
                className={styles.avatar} 
                onClick={() => setProfileOpen(v => !v)}
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                title="Account Workspace"
              >
                {user?.avatar || 'JG'}
                <span className={styles.avatarStatus} />
              </motion.div>
              
              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className={styles.avatarBackdrop} onClick={() => setProfileOpen(false)} />
                    <motion.div 
                      className={styles.profileMenu}
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* User Profile Section */}
                      <div className={styles.menuHeader}>
                        <div className={styles.menuUserAvatar}>{user?.avatar || 'JG'}</div>
                        <div className={styles.menuUserInfo}>
                          <div className={styles.menuUserName}>{user?.name || 'Joe Godwin'}</div>
                          <div className={styles.menuUserEmail}>{user?.email || 'guest@taskflow.io'}</div>
                        </div>
                        <span className={styles.proBadge}>PRO</span>
                      </div>
                      
                      {/* Productivity stats */}
                      <div className={styles.menuStats}>
                        <div className={styles.menuStat}>
                          <span className={styles.menuStatIcon}>🔥</span>
                          <div>
                            <div className={styles.menuStatLabel}>Streak</div>
                            <div className={styles.menuStatVal}>7 Days</div>
                          </div>
                        </div>
                        <div className={styles.menuStat}>
                          <span className={styles.menuStatIcon}>🎯</span>
                          <div>
                            <div className={styles.menuStatLabel}>Done</div>
                            <div className={styles.menuStatVal}>{stats.completed} tasks</div>
                          </div>
                        </div>
                      </div>

                      {/* Storage/Account usage */}
                      <div className={styles.usageContainer}>
                        <div className={styles.usageLabels}>
                          <span>Workspace Storage</span>
                          <span>4.2 / 10 GB</span>
                        </div>
                        <div className={styles.usageTrack}>
                          <div className={styles.usageFill} style={{ width: '42%' }} />
                        </div>
                      </div>

                      <div className={styles.menuDivider} />

                      {/* Commands */}
                      <button className={styles.menuItem} onClick={() => { setProfileOpen(false); setActiveSettingsTab('profile'); }}>
                        <span className={styles.menuItemIcon}>⬡</span> View Profile Dashboard
                      </button>
                      <button className={styles.menuItem} onClick={() => { setProfileOpen(false); setActiveSettingsTab('edit'); }}>
                        <span className={styles.menuItemIcon}>👤</span> Edit Profile Details
                      </button>
                      <button className={styles.menuItem} onClick={() => { setProfileOpen(false); setActiveSettingsTab('notifications'); }}>
                        <span className={styles.menuItemIcon}>🔔</span> Notifications Settings
                      </button>
                      <button className={styles.menuItem} onClick={() => { setProfileOpen(false); toggleTheme(); }}>
                        <span className={styles.menuItemIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span> Toggle Theme Mode
                      </button>
                      <button className={styles.menuItem} onClick={() => { setProfileOpen(false); setActiveSettingsTab('reports'); }}>
                        <span className={styles.menuItemIcon}>📈</span> Export PDF Reports
                      </button>
                      <button className={styles.menuItem} onClick={() => { setProfileOpen(false); setActiveSettingsTab('billing'); }}>
                        <span className={styles.menuItemIcon}>🚀</span> Workspace Settings & Billing
                      </button>

                      <div className={styles.menuDivider} />

                      <button className={`${styles.menuItem} ${styles.menuLogout}`} onClick={() => { setProfileOpen(false); handleLogout(); }}>
                        <span className={styles.menuItemIcon}>✕</span> Logout Account
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <div className={styles.content}>
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div key="dashboard" {...pageVariants}>
                <Dashboard stats={stats} todos={todos} todaysRoutines={todaysRoutines} routineStats={routineStats} toggleTodo={toggleTodo} onNavigate={handleSetView} user={user} loading={todosLoading} />
              </motion.div>
            )}

            {(view === 'tasks') && (
              <motion.div key="tasks" className={styles.tasksView} {...pageVariants}>
                <section className={styles.section}><AddTodoForm onAdd={addTodo} /></section>
                <section className={styles.section}>
                  <Filters
                    filter={filter} setFilter={setFilter}
                    categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                    priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    sortBy={sortBy} setSortBy={setSortBy}
                    filteredCount={filteredTodos.length}
                    completedCount={stats.completed}
                    trashedCount={todos.filter(t => t.deletedAt).length}
                    onClearCompleted={clearCompleted}
                    onEmptyTrash={emptyTrash}
                  />
                </section>
                <section className={styles.section}>
                  <TodoList todos={filteredTodos} filter={filter} loading={todosLoading}
                    onToggle={toggleTodo} onDelete={deleteTodo} onUpdate={updateTodo}
                    onMoveToTrash={moveToTrash} onRestore={restoreTask}
                    onArchive={archiveTask} onDuplicate={duplicateTask} />
                </section>
              </motion.div>
            )}

            {view === 'habits' && (
              <motion.div key="habits" className={styles.singleView} {...pageVariants}>
                <h2 className={styles.pageTitle}>🔥 Habit Tracker</h2>
                <p className={styles.pageSub}>Build consistent habits and track your streaks every day.</p>
                <HabitTracker user={user} showToast={showToast} />
              </motion.div>
            )}

            {view === 'goals' && (
              <motion.div key="goals" className={styles.singleView} {...pageVariants}>
                <h2 className={styles.pageTitle}>🎯 Goals</h2>
                <p className={styles.pageSub}>Set meaningful goals and track your progress toward them.</p>
                <GoalTracker user={user} showToast={showToast} />
              </motion.div>
            )}

            {view === 'focus' && (
              <motion.div key="focus" className={styles.focusView} {...pageVariants}>
                <h2 className={styles.pageTitle}>⏱ Focus Timer</h2>
                <p className={styles.pageSub}>Use the Pomodoro technique to stay in the zone.</p>
                <div className={styles.focusLayout}>
                  <PomodoroTimer user={user} showToast={showToast} />
                  <div className={styles.focusTips}>
                    <div className={styles.tipCard}>
                      <span className={styles.tipIcon}>🎯</span>
                      <div>
                        <div className={styles.tipTitle}>Focus Sessions</div>
                        <div className={styles.tipText}>Work for 25 minutes, then take a 5-minute break. After 4 sessions, take a longer 15-minute break.</div>
                      </div>
                    </div>
                    <div className={styles.tipCard}>
                      <span className={styles.tipIcon}>📵</span>
                      <div>
                        <div className={styles.tipTitle}>Minimize Distractions</div>
                        <div className={styles.tipText}>Put your phone away, close unnecessary tabs, and focus on a single task during each session.</div>
                      </div>
                    </div>
                    <div className={styles.tipCard}>
                      <span className={styles.tipIcon}>✅</span>
                      <div>
                        <div className={styles.tipTitle}>Track Progress</div>
                        <div className={styles.tipText}>Each completed session adds to your daily count. Aim for at least 4 sessions a day.</div>
                      </div>
                    </div>
                    <div className={styles.tipCard}>
                      <span className={styles.tipIcon}>🌿</span>
                      <div>
                        <div className={styles.tipTitle}>Rest Matters</div>
                        <div className={styles.tipText}>Use breaks to stretch, breathe, and recharge. Never skip your rest period.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'analytics' && (
               <motion.div key="analytics" className={styles.singleView} {...pageVariants}>
                 <div className={styles.analyticsPageHeader}>
                   <div className={styles.analyticsPageLeft}>
                     <h2 className={styles.pageTitle}>Analytics</h2>
                     <p className={styles.pageSub}>Insights into your productivity patterns over time.</p>
                   </div>
                   <button
                     className={styles.reportHeaderBtn}
                     onClick={() => setActiveSettingsTab('reports')}
                     title="Export productivity as PDF"
                   >
                     ⚡ Export PDF Report
                   </button>
                 </div>
                 <div className={styles.analyticsGrid}>
                  <AnalyticsChart todos={todos} stats={stats} />
                  <ActivityTimeline todos={todos} />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <span>TaskFlow</span>
          <span className={styles.fDot}>·</span>
          <span>Premium Productivity Suite</span>
          <span className={styles.fDot}>·</span>
          <span className={styles.fVer}>v3.0</span>
        </footer>
        {/* Settings panel & Unified modal overlay */}
        <AnimatePresence>
          {activeSettingsTab && (
            <SettingsModal
              activeTab={activeSettingsTab}
              setActiveTab={setActiveSettingsTab}
              onClose={() => setActiveSettingsTab(null)}
              user={user}
              setUser={setUser}
              stats={stats}
              todos={todos}
              pomoSessions={pomoSessions}
              showToast={showToast}
            />
          )}
        </AnimatePresence>

        {/* SaaS toast notifications */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={styles.toast}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.22 }}
              style={{
                '--toast-bg': toast.type === 'success' ? 'var(--emerald-dim)' : 'var(--rose-dim)',
                '--toast-border': toast.type === 'success' ? 'var(--emerald)' : 'var(--rose)',
                '--toast-color': toast.type === 'success' ? 'var(--emerald)' : 'var(--rose)',
              }}
            >
              <span style={{ fontSize: 16 }}>{toast.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  )
}

function StatPill({ v, l, c, pulse }) {
  return (
    <div className={`${styles.pill} ${pulse ? styles.pillPulse : ''}`} style={{ '--pc': c }}>
      <span className={styles.pillVal}>{v}</span>
      <span className={styles.pillLbl}>{l}</span>
    </div>
  )
}

function SearchIcon() { return <svg viewBox="0 0 20 20" fill="none" width="14" height="14" style={{ position:'absolute', left:12, color:'var(--text-400)' }}><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8"/><path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function MenuIcon()   { return <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function BellIcon()   { return <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 2a6 6 0 016 6v3l1.5 2H2.5L4 11V8a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.7"/><path d="M8 16a2 2 0 004 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg> }
