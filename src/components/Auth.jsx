// Auth.jsx — Premium SaaS Authentication — UI Redesign
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import styles from './Auth.module.css'
import { fetchAPI } from '../utils/api'

export default function Auth({ onLoginSuccess }) {
  const { theme } = useTheme()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'verify-otp' | 'forgot-password' | 'reset-password'

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('What was the name of your first pet?')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const QUESTIONS = [
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is your mother's maiden name?",
    "What high school did you attend?"
  ]

  // Feedback states
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAuthApi = async (endpoint, payload) => {
    return await fetchAPI(`/auth/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      if (!name.trim()) return setError('Please enter your full name.')
      if (password.length < 8) return setError('Password must be at least 8 characters long.')
      if (!securityAnswer.trim()) return setError('Please provide a security answer.')
    }
    if (mode === 'reset-password') {
      if (newPassword.length < 8) return setError('New password must be at least 8 characters long.')
      if (!securityAnswer.trim()) return setError('Please provide your security answer.')
    }

    setIsLoading(true)

    try {
      if (mode === 'login') {
        const data = await handleAuthApi('login', { email, password })
        // Always use sessionStorage — tab-scoped, never persists across app opens
        sessionStorage.setItem('tf_token', data.token)
        onLoginSuccess(data.user)
      } else if (mode === 'signup') {
        const data = await handleAuthApi('signup', { name, email, password, securityQuestion, securityAnswer })
        sessionStorage.setItem('tf_token', data.token)
        onLoginSuccess(data.user)
      } else if (mode === 'forgot-password') {
        const data = await handleAuthApi('forgot-password/step1', { email })
        setSecurityQuestion(data.securityQuestion)
        setMode('reset-password')
        setSuccess('Security question retrieved.')
      } else if (mode === 'reset-password') {
        const data = await handleAuthApi('forgot-password/step2', { email, securityAnswer, newPassword })
        setMode('login')
        setSuccess(data.message)
        setPassword('')
        setNewPassword('')
        setSecurityAnswer('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestAccess = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await handleAuthApi('guest', {})
      sessionStorage.setItem('tf_token', data.token)
      onLoginSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccess('')
  }

  const formVariants = {
    initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.25 } }
  }

  const getTitle = () => {
    if (mode === 'login') return 'Welcome back'
    if (mode === 'signup') return 'Start for free'
    if (mode === 'forgot-password') return 'Reset password'
    return 'New password'
  }

  const getSubtitle = () => {
    if (mode === 'login') return 'Sign in to your workspace'
    if (mode === 'signup') return 'Build better habits, focus deeper'
    if (mode === 'forgot-password') return 'We\'ll help you recover access'
    return 'Create your new secure password'
  }

  return (
    <div className={styles.wrap} data-theme={theme}>

      {/* ── Ambient Background ── */}
      <div className={styles.ambientBg}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.grid} />
      </div>

      {/* ── LEFT: Hero Panel ── */}
      <div className={styles.heroPanelWrap}>
        <motion.div
          className={styles.heroPanel}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <div className={styles.heroBrand}>
            <div className={styles.heroBrandLogo}>
              <LogoIcon />
            </div>
            <span className={styles.heroBrandName}>TaskFlow</span>
          </div>

          {/* Headline */}
          <div className={styles.heroContent}>
            <motion.div
              className={styles.heroBadge}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <span className={styles.heroBadgeDot} />
              <span>v5.0 — Now with Daily Routines</span>
            </motion.div>

            <motion.h1
              className={styles.heroTitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.6 }}
            >
              Organize&nbsp;work.<br />
              <span className={styles.heroTitleAccent}>Build momentum.</span>
            </motion.h1>

            <motion.p
              className={styles.heroDesc}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.6 }}
            >
              The premium productivity workspace for builders and high-performance teams. Tasks, habits, goals and deep focus — all in one place.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              className={styles.featurePills}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.6 }}
            >
              {['⚡ Focus Timer', '🎯 Goal Tracking', '🔥 Habit Streaks', '📊 Analytics'].map((f) => (
                <span key={f} className={styles.featurePill}>{f}</span>
              ))}
            </motion.div>
          </div>

          {/* Floating app mockup */}
          <motion.div
            className={styles.mockupCard}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.mockupTitleBar}>
              <div className={styles.mockupDots}>
                <span className={`${styles.mockupDot} ${styles.dotRed}`} />
                <span className={`${styles.mockupDot} ${styles.dotYellow}`} />
                <span className={`${styles.mockupDot} ${styles.dotGreen}`} />
              </div>
              <span className={styles.mockupTitle}>TaskFlow — My Workspace</span>
            </div>

            <div className={styles.mockupBody}>
              {[
                { label: 'Design system review', done: true, tag: 'Work', color: '#7c6af7' },
                { label: 'Morning workout routine', done: true, tag: 'Health', color: '#10b981' },
                { label: 'Read 30 pages of book', done: false, tag: 'Learning', color: '#22d3ee' },
                { label: 'Deploy v5 to production', done: false, tag: 'Work', color: '#7c6af7' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className={`${styles.mockupRow} ${item.done ? styles.mockupRowDone : ''}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.09, duration: 0.4 }}
                >
                  <div className={`${styles.mockupCheck} ${item.done ? styles.mockupCheckDone : ''}`}>
                    {item.done && <span>✓</span>}
                  </div>
                  <span className={styles.mockupLabel}>{item.label}</span>
                  <span className={styles.mockupTag} style={{ color: item.color, background: item.color + '18' }}>{item.tag}</span>
                </motion.div>
              ))}

              {/* Focus timer widget in mockup */}
              <div className={styles.mockupTimer}>
                <div className={styles.mockupTimerIcon}>⏱</div>
                <div className={styles.mockupTimerText}>
                  <div className={styles.mockupTimerLabel}>Focus Session</div>
                  <div className={styles.mockupTimerValue}>24:37</div>
                </div>
                <div className={styles.mockupTimerPill}>Active</div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <div className={styles.heroFooter}>
            <span className={styles.heroFooterCopy}>© 2026 TaskFlow Technologies</span>
            <div className={styles.heroFooterStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatVal}>99.9%</span>
                <span className={styles.heroStatLbl}>Uptime</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatVal}>120k+</span>
                <span className={styles.heroStatLbl}>Users</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT: Auth Form Panel ── */}
      <div className={styles.formSide}>
        <motion.div
          className={styles.formInner}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile only logo */}
          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoIcon}><LogoIcon /></div>
            <span className={styles.mobileLogoBrand}>TaskFlow</span>
          </div>

          {/* Card */}
          <div className={styles.card}>
            {/* Card top shimmer line */}
            <div className={styles.cardShimmer} />

            {/* Header */}
            <div className={styles.cardHeader}>
              <div className={styles.logoIcon}><LogoIcon /></div>
              <h2 className={styles.title}>{getTitle()}</h2>
              <p className={styles.subtitle}>{getSubtitle()}</p>
            </div>

            {/* Tab Switcher */}
            {(mode === 'login' || mode === 'signup') && (
              <div className={styles.tabRow}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${mode === 'login' ? styles.tabBtnActive : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${mode === 'signup' ? styles.tabBtnActive : ''}`}
                  onClick={() => switchMode('signup')}
                >
                  Sign Up
                </button>
                <motion.div
                  className={styles.tabIndicator}
                  animate={{ x: mode === 'login' ? '0%' : '100%' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              </div>
            )}

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                className={styles.form}
                onSubmit={handleSubmit}
                variants={formVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {success && (
                  <motion.div
                    className={styles.successMsg}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className={styles.successIcon}>✓</span>
                    <span>{success}</span>
                  </motion.div>
                )}

                {mode === 'signup' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="name">Full Name</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputIcon}><UserIcon /></span>
                      <input
                        type="text"
                        id="name"
                        className={`${styles.input} ${styles.inputWithLeadIcon}`}
                        placeholder="Joe Godwin"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Security Question</label>
                    <div className={styles.customSelectWrap}>
                      <button
                        type="button"
                        className={styles.customSelectBtn}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                      >
                        <span>{securityQuestion}</span>
                        <ChevronIcon open={dropdownOpen} />
                      </button>
                      <AnimatePresence>
                        {dropdownOpen && (
                          <motion.div
                            className={styles.customSelectDropdown}
                            initial={{ opacity: 0, y: -8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                          >
                            {QUESTIONS.map(q => (
                              <button
                                key={q}
                                type="button"
                                className={styles.customSelectOption}
                                onClick={() => {
                                  setSecurityQuestion(q)
                                  setDropdownOpen(false)
                                }}
                              >
                                {q}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="securityAnswer">Security Answer</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputIcon}><LockIcon /></span>
                      <input
                        type="text"
                        id="securityAnswer"
                        className={`${styles.input} ${styles.inputWithLeadIcon}`}
                        placeholder="Your answer"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'forgot-password' || mode === 'reset-password') && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="email">Work Email</label>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputIcon}><MailIcon /></span>
                      <input
                        type="email"
                        id="email"
                        className={`${styles.input} ${styles.inputWithLeadIcon}`}
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {(mode === 'login' || mode === 'signup') && (
                  <div className={styles.fieldGroup}>
                    <div className={styles.labelRow}>
                      <label className={styles.label} htmlFor="password">Password</label>
                      {mode === 'login' && (
                        <a href="#forgot" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); switchMode('forgot-password'); }}>
                          Forgot password?
                        </a>
                      )}
                    </div>
                    <div className={styles.inputWrap}>
                      <span className={styles.inputIcon}><LockIcon /></span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className={`${styles.input} ${styles.inputWithLeadIcon} ${styles.inputWithIcon}`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'reset-password' && (
                  <>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Security Question</label>
                      <div className={styles.securityQuestionDisplay}>
                        {securityQuestion}
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="securityAnswer">Your Answer</label>
                      <div className={styles.inputWrap}>
                        <span className={styles.inputIcon}><LockIcon /></span>
                        <input
                          type="text"
                          id="securityAnswer"
                          className={`${styles.input} ${styles.inputWithLeadIcon}`}
                          placeholder="Answer"
                          value={securityAnswer}
                          onChange={(e) => setSecurityAnswer(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="newPassword">New Password</label>
                      <div className={styles.inputWrap}>
                        <span className={styles.inputIcon}><LockIcon /></span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="newPassword"
                          className={`${styles.input} ${styles.inputWithLeadIcon} ${styles.inputWithIcon}`}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className={styles.eyeButton}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                  </>
                )}


                {(mode === 'forgot-password' || mode === 'reset-password') && (
                  <div className={styles.metaRow}>
                    <a href="#back" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); switchMode('login'); }}>
                      ← Back to Login
                    </a>
                  </div>
                )}

                {error && (
                  <motion.div
                    className={styles.errorMsg}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className={styles.errorIcon}>⚠</span>
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className={styles.ctaBtn}
                  disabled={isLoading}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        className={styles.ctaBtnContent}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className={styles.loadingSpinner} />
                        {mode === 'login' ? 'Signing in…' :
                          mode === 'signup' ? 'Creating account…' :
                            mode === 'forgot-password' ? 'Processing…' : 'Updating…'}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="label"
                        className={styles.ctaBtnContent}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <span>{mode === 'login' ? 'Continue with Email' :
                          mode === 'signup' ? 'Create Account' :
                            mode === 'forgot-password' ? 'Reset Password' : 'Change Password'}
                        </span>
                        <ArrowIcon />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {(mode === 'login' || mode === 'signup') && (
                  <>
                    <div className={styles.divider}><span>or</span></div>
                    <button
                      type="button"
                      className={styles.guestBtn}
                      onClick={handleGuestAccess}
                      disabled={isLoading}
                    >
                      <span className={styles.guestBtnIcon}>⚡</span>
                      <span>Explore as Guest</span>
                    </button>
                  </>
                )}
              </motion.form>
            </AnimatePresence>

            {/* Privacy note */}
            <p className={styles.privacyNote}>
              By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ── SVG ICONS ── */

function LogoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 18, height: 18 }}>
      <path d="M9 16.5L13.5 21L23 11" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0110 20c-6 0-9-6-9-6a17.93 17.93 0 013.06-4.06M9.9 4.24A9.12 9.12 0 0110 4c6 0 9 6 9 6a18 18 0 01-1.92 2.56M12.83 12.83A3 3 0 018 8l4.83 4.83z" />
      <path d="M1 1l18 18" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <path d="M2 7l8 5 8-5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="9" width="12" height="9" rx="2" />
      <path d="M7 9V7a3 3 0 016 0v2" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="15" height="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      width="15"
      height="15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </motion.svg>
  )
}
