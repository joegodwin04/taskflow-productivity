// SettingsModal.jsx — Workspace settings and command center with PDF generator
import { useState } from 'react'
import { motion } from 'framer-motion'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import styles from './SettingsModal.module.css'
import PrintableReport from './PrintableReport'
import { hashPassword } from '../utils/hashPassword'

export default function SettingsModal({
  activeTab,
  setActiveTab,
  onClose,
  user,
  setUser,
  stats,
  todos,
  pomoSessions,
  showToast
}) {
  // Tab keys list
  const TABS = [
    { id: 'profile',       label: 'View Profile',      icon: '⬡' },
    { id: 'edit',          label: 'Edit Details',      icon: '👤' },
    { id: 'notifications', label: 'Notifications',     icon: '🔔' },
    { id: 'billing',       label: 'Workspace billing', icon: '🚀' },
    { id: 'reports',       label: 'Productivity PDF',  icon: '📈' },
  ]

  // Form edit states
  const [editName, setEditName] = useState(user?.name || '')
  const [editEmail, setEditEmail] = useState(user?.email || '')
  const [editBio, setEditBio] = useState(user?.bio || 'Productivity enthusiast and SaaS builder.')
  const [editPassword, setEditPassword] = useState('••••••••')
  const [isSaving, setIsSaving] = useState(false)

  // Notification states
  const [notifPush, setNotifPush] = useState(user?.notifications?.push ?? true)
  const [notifEmail, setNotifEmail] = useState(user?.notifications?.email ?? true)
  const [notifWeekly, setNotifWeekly] = useState(user?.notifications?.weeklyReports ?? true)
  const [notifSound, setNotifSound] = useState(user?.notifications?.soundToggle ?? true)

  // Streaks and statistics helper metrics
  const liveHabits = (() => {
    try {
      const key = `taskflow_${user?.id || 'guest'}_habits`
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })()

  const liveGoals = (() => {
    try {
      const key = `taskflow_${user?.id || 'guest'}_goals`
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })()

  const completedCount = todos ? todos.filter(t => t.completed).length : stats.completed || 0
  const activeCount = todos ? todos.filter(t => !t.completed).length : stats.active || 0
  const totalCount = todos ? todos.length : stats.total || 0
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : stats.completionRate || 0

  const dateStrHelper = (daysAgo = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }

  const getStreakHelper = (habit) => {
    if (!habit.completions) return 0
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = dateStrHelper(i)
      if (habit.completions[d]) streak++
      else if (i > 0) break
    }
    return streak
  }

  const longestStreak = liveHabits.length > 0
    ? liveHabits.reduce((max, h) => Math.max(max, getStreakHelper(h)), 0)
    : 7


  // Live streak alias for profile and stats tabs
  const streakDays = longestStreak

  // Get active user registry database
  const getUsersRegistry = () => {
    try {
      return JSON.parse(localStorage.getItem('tf_users_registry') || '[]')
    } catch { return [] }
  }

  // Deterministic email hashing (mirrors Auth.jsx) for userId generation
  function getEmailHash(email) {
    let hash = 0
    const cleanEmail = email.toLowerCase().trim()
    for (let i = 0; i < cleanEmail.length; i++) {
      hash = (hash << 5) - hash + cleanEmail.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(36)
  }

  // Save updated user fields to registry (merge preserves existing fields like password)
  const updateRegistryUser = (updates) => {
    try {
      const registry = getUsersRegistry()
      const index = registry.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase())
      if (index !== -1) {
        registry[index] = { ...registry[index], ...updates }
      } else {
        registry.push(updates)
      }
      localStorage.setItem('tf_users_registry', JSON.stringify(registry))
    } catch (e) {
      console.error('Failed to update users registry', e)
    }
  }

  // Save profile edit changes (handles email-change data migration)
  const handleSaveProfile = (e) => {
    e.preventDefault()
    if (!editName.trim() || !editEmail.trim()) {
      showToast('Name and email fields cannot be blank.', 'error')
      return
    }

    setIsSaving(true)
    setTimeout(async () => {
      // Detect email change and compute new userId if needed
      const oldUserId = user.id
      const emailChanged = editEmail.toLowerCase().trim() !== user.email.toLowerCase().trim()
      let newUserId = oldUserId

      if (emailChanged && oldUserId.startsWith('email_')) {
        newUserId = `email_${getEmailHash(editEmail)}`

        // Migrate all user-scoped localStorage keys to the new userId
        const suffixes = ['_tasks', '_habits', '_goals', '_analytics', '_settings', '_reports', '_theme']
        suffixes.forEach(suffix => {
          const oldKey = `taskflow_${oldUserId}${suffix}`
          const newKey = `taskflow_${newUserId}${suffix}`
          const data = localStorage.getItem(oldKey)
          if (data !== null) {
            localStorage.setItem(newKey, data)
            localStorage.removeItem(oldKey)
          }
        })
      }

      // Build registry update with only the changed fields
      const registryUpdate = {
        id: newUserId,
        name: editName,
        email: editEmail,
        bio: editBio,
        avatar: editName.substring(0, 2).toUpperCase(),
      }
      // Only update password in registry if user actually typed a new one (hash it)
      if (editPassword !== '••••••••') {
        registryUpdate.password = await hashPassword(editPassword)
      }
      updateRegistryUser(registryUpdate)

      // Session user — never includes password
      const updatedSessionUser = {
        ...user,
        id: newUserId,
        name: editName,
        email: editEmail,
        bio: editBio,
        avatar: editName.substring(0, 2).toUpperCase(),
      }
      setUser(updatedSessionUser)
      localStorage.setItem('tf_user', JSON.stringify(updatedSessionUser))

      setIsSaving(false)
      showToast('Profile credentials updated successfully!', 'success')
    }, 800)
  }

  // Handle billing plan upgrades
  const handleUpgradeAccount = () => {
    if (user?.premium) {
      showToast('You are already built as a Pro member!', 'success')
      return
    }

    setIsSaving(true)
    setTimeout(() => {
      const updatedUser = {
        ...user,
        premium: true
      }
      
      // Save changes back to registry and active session
      updateRegistryUser(updatedUser)
      setUser(updatedUser)
      localStorage.setItem('tf_user', JSON.stringify(updatedUser))
      setIsSaving(false)
      showToast('Welcome to Pro! All commercial features unlocked.', 'success')
    }, 700)
  }

  // Save notifications config
  const handleToggleNotif = (type, value) => {
    const updatedUser = {
      ...user,
      notifications: {
        ...user?.notifications,
        [type]: value
      }
    }
    updateRegistryUser(updatedUser)
    setUser(updatedUser)
    localStorage.setItem('tf_user', JSON.stringify(updatedUser))
    showToast('Notification layout changes saved.', 'success')
  }

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)



  // Premium PDF report generator using jsPDF and html2canvas
  const handleGenerateReport = () => {
    setIsGeneratingPDF(true)
    showToast('Compiling premium analytics...', 'success')

    setTimeout(async () => {
      try {
        const page1El = document.getElementById('premium-report-page-1')
        const page2El = document.getElementById('premium-report-page-2')

        if (!page1El || !page2El) {
          throw new Error('PDF layout elements not found in the DOM.')
        }

        // Initialize A4 Portrait PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        // Capture Page 1
        const canvas1 = await html2canvas(page1El, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc'
        })
        const imgData1 = canvas1.toDataURL('image/jpeg', 0.95)
        pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297)

        // Capture Page 2
        pdf.addPage()
        const canvas2 = await html2canvas(page2El, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc'
        })
        const imgData2 = canvas2.toDataURL('image/jpeg', 0.95)
        pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297)

        // Save file with filename format TaskFlow-Pro-Report-YYYY-MM-DD.pdf
        const todayDate = new Date().toISOString().split('T')[0]
        pdf.save(`TaskFlow-Pro-Report-${todayDate}.pdf`)

        showToast('Premium report downloaded successfully!', 'success')
      } catch (err) {
        console.error('Failed to generate PDF:', err)
        showToast('Error compiling high-fidelity PDF report.', 'error')
      } finally {
        setIsGeneratingPDF(false)
      }
    }, 600)
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* ── LEFT PANE: TAB NAVIGATION ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <div className={styles.brand}>
              <div className={styles.brandLogo}>⬡</div>
              <span className={styles.brandText}>TaskFlow</span>
            </div>
            
            <nav className={styles.tabList}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={styles.tabIcon}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      className={styles.activeIndicator}
                      layoutId="settingsActiveIndicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          <div className={styles.sidebarBottom}>
            <span className={styles.proBadge}>
              {user?.premium ? '⚡ PRO PLATFORM' : '⚡ FREE ACCOUNT'}
            </span>
          </div>
        </aside>
        
        {/* ── RIGHT PANE: ACTIVE TAB VIEWPORT ── */}
        <main className={styles.viewport}>
          
          {/* Header row */}
          <div className={styles.viewportHeader}>
            <div>
              <h2 className={styles.headerTitle}>
                {activeTab === 'profile' && 'Workspace Profile'}
                {activeTab === 'edit' && 'Account Credentials'}
                {activeTab === 'notifications' && 'System Notifications'}
                {activeTab === 'billing' && 'Workspace Plans'}
                {activeTab === 'reports' && 'Export PDF Report'}
              </h2>
              <p className={styles.headerSub}>
                {activeTab === 'profile' && 'Overview of your productivity habits and scores.'}
                {activeTab === 'edit' && 'Modify your credentials and profile details.'}
                {activeTab === 'notifications' && 'Configure email and browser notification rules.'}
                {activeTab === 'billing' && 'Compare premium SaaS pricing plans and upgrade.'}
                {activeTab === 'reports' && 'Generate a clean printable A4 sheet of your statistics.'}
              </p>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close Settings">✕</button>
          </div>
          
          {/* Viewport Contents */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* VIEW PROFILE TAB */}
            {activeTab === 'profile' && (
              <>
                <div className={styles.profileCard}>
                  <div className={styles.profileAvatar}>{user?.avatar || 'JG'}</div>
                  <div className={styles.profileMeta}>
                    <h3>{user?.name || 'Joe Godwin'}</h3>
                    <p>{user?.email || 'guest@taskflow.io'} · Joined {user?.joinDate || 'January 2026'}</p>
                  </div>
                </div>
                
                <div className={styles.bioSection}>
                  {user?.bio || 'Productivity enthusiast and SaaS engineer. Building the future of automated cockpits.'}
                </div>
                
                <div className={styles.metricsGrid}>
                  <div className={styles.metricItem}>
                    <div className={styles.metricVal}>{completedCount}</div>
                    <div className={styles.metricLbl}>Completed Tasks</div>
                  </div>
                  <div className={styles.metricItem}>
                    <div className={styles.metricVal}>🔥 {streakDays}</div>
                    <div className={styles.metricLbl}>Streak Days</div>
                  </div>
                  <div className={styles.metricItem}>
                    <div className={styles.metricVal}>{pomoSessions}</div>
                    <div className={styles.metricLbl}>Focus Sessions</div>
                  </div>
                </div>
              </>
            )}
            
            {/* EDIT DETAILS TAB */}
            {activeTab === 'edit' && (
              <form className={styles.form} onSubmit={handleSaveProfile}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-name">Full Name</label>
                  <input
                    type="text"
                    id="edit-name"
                    className={styles.input}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-email">Work Email</label>
                  <input
                    type="email"
                    id="edit-email"
                    className={styles.input}
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-bio">Bio description</label>
                  <textarea
                    id="edit-bio"
                    className={`${styles.input} ${styles.textarea}`}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="edit-password">New Password</label>
                  <input
                    type="password"
                    id="edit-password"
                    className={styles.input}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>
                
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                  {isSaving ? 'Saving Changes...' : 'Save credentials'}
                </button>
              </form>
            )}
            
            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleMeta}>
                    <span className={styles.toggleLabel}>Work Email Digest</span>
                    <span className={styles.toggleSub}>Receive weekly productivity score alerts and summaries.</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={(e) => { setNotifEmail(e.target.checked); handleToggleNotif('email', e.target.checked); }}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleMeta}>
                    <span className={styles.toggleLabel}>Browser Push Notifications</span>
                    <span className={styles.toggleSub}>Receive focus reminders when focus timer mode finishes.</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={notifPush}
                      onChange={(e) => { setNotifPush(e.target.checked); handleToggleNotif('push', e.target.checked); }}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleMeta}>
                    <span className={styles.toggleLabel}>Weekly Analytics Reports</span>
                    <span className={styles.toggleSub}>Receive pre-compiled summaries of habit and goals progress.</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={notifWeekly}
                      onChange={(e) => { setNotifWeekly(e.target.checked); handleToggleNotif('weeklyReports', e.target.checked); }}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleMeta}>
                    <span className={styles.toggleLabel}>Focus Timer Bell Toggles</span>
                    <span className={styles.toggleSub}>Play custom alert sounds when deep work loops complete.</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={notifSound}
                      onChange={(e) => { setNotifSound(e.target.checked); handleToggleNotif('soundToggle', e.target.checked); }}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>
            )}
            
            {/* BILLING PLANS TAB */}
            {activeTab === 'billing' && (
              <div className={styles.pricingGrid}>
                {/* Free Plan */}
                <div className={styles.priceCard}>
                  <div className={styles.cardHead}>
                    <span className={styles.planName}>Basic Standard</span>
                    <h3 className={styles.planPrice}>$0 <span>/ month</span></h3>
                    <p className={styles.planDesc}>Essential tools to organize habits and track micro-tasks.</p>
                  </div>
                  
                  <ul className={styles.featuresList}>
                    <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Standard dashboard widgets</li>
                    <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Basic Pomodoro timer</li>
                    <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Local storage workspace</li>
                  </ul>
                  
                  <button className={styles.pricingCta} disabled>
                    {!user?.premium ? 'Active Workspace' : 'Free tier'}
                  </button>
                </div>

                {/* Pro Plan */}
                <div className={`${styles.priceCard} ${styles.priceCardPopular}`}>
                  <span className={styles.popularBadge}>RECOMMENDED</span>
                  <div className={styles.cardHead}>
                    <span className={styles.planName}>TaskFlow Pro</span>
                    <h3 className={styles.planPrice}>$9 <span>/ month</span></h3>
                    <p className={styles.planDesc}>Fully loaded metrics, pro indicators, and visual report generation.</p>
                  </div>
                  
                  <ul className={styles.featuresList}>
                    <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Gold Premium Pro badge</li>
                    <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Dynamic multi-account registry</li>
                    <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Printable A4 PDF analytics report</li>
                    <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> 10 GB workspace storage capacity</li>
                  </ul>
                  
                  <button
                    className={`${styles.pricingCta} ${styles.pricingCtaActive}`}
                    onClick={handleUpgradeAccount}
                    disabled={isSaving || user?.premium}
                  >
                    {user?.premium ? 'Active Pro Tier' : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
            )}
            
            {/* PRODUCTIVITY PDF TAB */}
            {activeTab === 'reports' && (
              <div className={styles.reportCard}>
                <div className={styles.reportIcon}>📈</div>
                <h3 className={styles.reportTitle}>Export Workspace Summary</h3>
                <p className={styles.reportDesc}>
                  Compile your tasks, focus sessions, goal updates, and habit streak ratios into a clean printable A4 format. Save directly as a PDF for business updates or personal portfolios.
                </p>
                <button
                  type="button"
                  className={styles.reportCta}
                  onClick={handleGenerateReport}
                  disabled={isGeneratingPDF}
                  style={{
                    opacity: isGeneratingPDF ? 0.7 : 1,
                    cursor: isGeneratingPDF ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isGeneratingPDF ? (
                    <>
                      <span className={styles.spinner} style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginRight: '8px'
                      }} />
                      Generating Premium Report...
                    </>
                  ) : (
                    '⚡ Generate PDF Report'
                  )}
                </button>
              </div>
            )}
            
          </div>
          
        </main>
        
      </div>

      {/* Hidden Premium PDF Report Rendering Containers */}
      <div style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '800px',
        display: 'block'
      }}>
        <PrintableReport
          user={user}
          todos={todos}
          stats={stats}
          pomoSessions={pomoSessions}
          liveGoals={liveGoals}
          liveHabits={liveHabits}
          longestStreak={longestStreak}
          completionRate={completionRate}
          completedCount={completedCount}
          activeCount={activeCount}
        />
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  )
}
