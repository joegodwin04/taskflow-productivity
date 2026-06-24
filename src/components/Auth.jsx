// Auth.jsx — Persistent User Registry and Authentication screen Loop via API
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import styles from './Auth.module.css'
import { API_BASE_URL } from '../utils/api'

export default function Auth({ onLoginSuccess }) {
  const { theme } = useTheme()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'verify-otp' | 'forgot-password' | 'reset-password'
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  
  // Auth state
  const [userId, setUserId] = useState(null)
  
  // Feedback states
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAuthApi = async (endpoint, payload) => {
    if (endpoint === 'signup') {
      console.log("Sending signup request", payload);
    }
    const res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.requiresVerification) {
        setUserId(data.userId)
        setMode('verify-otp')
        setSuccess('Please verify your email. An OTP has been sent to your email.')
      }
      throw new Error(data.message || 'An error occurred.')
    }
    return data
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)
    
    try {
      if (mode === 'login') {
        const data = await handleAuthApi('login', { email, password, remember })
        localStorage.setItem('tf_token', data.token)
        onLoginSuccess(data.user)
      } else if (mode === 'signup') {
        console.log("Signup clicked");
        const data = await handleAuthApi('signup', { name, email, password })
        setUserId(data.userId)
        setMode('verify-otp')
        setSuccess(data.message)
      } else if (mode === 'verify-otp') {
        const data = await handleAuthApi('verify-email', { userId, email, otp })
        localStorage.setItem('tf_token', data.token)
        onLoginSuccess(data.user)
      } else if (mode === 'forgot-password') {
        const data = await handleAuthApi('forgot-password', { email })
        setMode('reset-password')
        setSuccess(data.message)
      } else if (mode === 'reset-password') {
        const data = await handleAuthApi('reset-password', { email, otp, newPassword })
        setMode('login')
        setSuccess(data.message)
        setOtp('')
        setPassword('')
        setNewPassword('')
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
      localStorage.setItem('tf_token', data.token)
      onLoginSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      const data = await handleAuthApi('resend-otp', { userId, email })
      setSuccess(data.message || 'OTP resent successfully.')
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
    initial: { opacity: 0, x: mode === 'login' ? -15 : 15, y: 0 },
    animate: { opacity: 1, x: 0, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, x: mode === 'login' ? 15 : -15, transition: { duration: 0.2 } }
  }

  return (
    <div className={styles.wrap} data-theme={theme}>
      
      {/* ── MARKETING SHOWCASE PANEL (LEFT) ── */}
      <div className={styles.marketingSide}>
        <div className={styles.marketingHeader}>
          <div className={styles.marketingLogo}>
            <LogoIcon />
          </div>
          <span className={styles.marketingBrand}>TaskFlow</span>
        </div>
        
        <div className={styles.marketingBody}>
          <div className={styles.marketingTag}>
            <span>✨ SYSTEM RELEASE V5.0</span>
          </div>
          
          <h1 className={styles.marketingTitle}>
            Organize work.<br />
            Focus on what <span>matters.</span>
          </h1>
          
          <p className={styles.marketingDesc}>
            The premium workspace designed for developers, builders, and high-performance teams. Combine tasks, goals, habits, and deep focus sessions in one gorgeous cockpit.
          </p>
          
          {/* Decorative premium floating element */}
          <div className={styles.mockupWrap}>
            <div className={styles.mockupHeader}>
              <div className={styles.mockupDots}>
                <span className={styles.mockupDot} />
                <span className={styles.mockupDot} />
                <span className={styles.mockupDot} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-300)' }}>TaskFlow cockpit.exe</span>
            </div>
            <div className={styles.mockupItem}>
              <div className={styles.mockupCheck}>✓</div>
              <div className={styles.mockupLine} />
            </div>
            <div className={styles.mockupItem}>
              <div className={styles.mockupCheck} style={{ borderColor: 'rgba(255,255,255,0.1)' }}></div>
              <div className={styles.mockupLine} />
            </div>
            <div className={styles.mockupItem} style={{ marginBottom: 0 }}>
              <div className={styles.mockupCheck} style={{ borderColor: 'rgba(255,255,255,0.1)' }}></div>
              <div className={styles.mockupLine} style={{ width: '60%', flexGrow: 0 }} />
            </div>
          </div>
        </div>
        
        <div className={styles.marketingFooter}>
          <span>© 2026 TaskFlow Technologies Inc.</span>
          <div className={styles.footerStats}>
            <div className={styles.statItem}>
              <span className={styles.statVal}>99.9%</span>
              <span className={styles.statLbl}>Uptime</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statVal}>120k+</span>
              <span className={styles.statLbl}>Active Builders</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ── AUTH FORMS PANEL (RIGHT) ── */}
      <div className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoIcon}>
              <LogoIcon />
            </div>
            <h2 className={styles.title}>
              {mode === 'login' ? 'Welcome back' : 
               mode === 'signup' ? 'Create your workspace' : 
               mode === 'verify-otp' ? 'Verify your email' :
               mode === 'forgot-password' ? 'Forgot Password' : 'Reset Password'}
            </h2>
            <p className={styles.subtitle}>
              {mode === 'login' ? 'Enter your details to access your dashboard' : 
               mode === 'signup' ? 'Join high-performers tracking work today' : 
               mode === 'verify-otp' ? 'Enter the 6-digit OTP sent to your email' :
               mode === 'forgot-password' ? 'Enter your email to receive a password reset OTP' : 'Enter the OTP and your new password'}
            </p>
          </div>
          
          {/* Animated Tab Switcher (Only show on Login/Signup) */}
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
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            </div>
          )}
          
          {/* Animated Form container */}
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
                <div className={styles.successMsg} style={{ color: '#10b981', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <span>✓</span> {success}
                </div>
              )}

              {mode === 'signup' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name"
                    className={styles.input} 
                    placeholder="Joe Godwin" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              
              {(mode === 'login' || mode === 'signup' || mode === 'forgot-password' || mode === 'reset-password') && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="email">Work Email</label>
                  <input 
                    type="email" 
                    id="email"
                    className={styles.input} 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              )}
              
              {(mode === 'login' || mode === 'signup') && (
                <div className={styles.fieldGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="password">Password</label>
                    {mode === 'login' && (
                      <a href="#forgot" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); switchMode('forgot-password'); }}>
                        Forgot?
                      </a>
                    )}
                  </div>
                  <div className={styles.inputWrap}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="password"
                      className={`${styles.input} ${styles.inputWithIcon}`} 
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

              {(mode === 'verify-otp' || mode === 'reset-password') && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="otp">6-Digit OTP</label>
                  <input 
                    type="text" 
                    id="otp"
                    className={styles.input} 
                    placeholder="123456" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>
              )}

              {mode === 'reset-password' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="newPassword">New Password</label>
                  <div className={styles.inputWrap}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="newPassword"
                      className={`${styles.input} ${styles.inputWithIcon}`} 
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
              )}
              
              {mode === 'login' && (
                <div className={styles.metaRow}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      className={styles.checkbox} 
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span>Remember this device</span>
                  </label>
                </div>
              )}

              {(mode === 'verify-otp' || mode === 'forgot-password' || mode === 'reset-password') && (
                <div className={styles.metaRow} style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <a href="#back" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); switchMode('login'); }}>
                    ← Back to Login
                  </a>
                  {mode === 'verify-otp' && (
                    <a href="#resend" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); handleResendOtp(); }}>
                      Resend OTP
                    </a>
                  )}
                </div>
              )}
              
              {error && (
                <div className={styles.errorMsg}>
                  <span>⚠️</span> {error}
                </div>
              )}
              
              <button 
                type="submit" 
                className={styles.ctaBtn} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className={styles.loadingSpinner} />
                ) : (
                  <span>{
                    mode === 'login' ? 'Continue with Email' : 
                    mode === 'signup' ? 'Create Account' : 
                    mode === 'verify-otp' ? 'Verify Email' :
                    mode === 'forgot-password' ? 'Send OTP' : 'Reset Password'
                  }</span>
                )}
              </button>
              
              {/* Premium explore guest button for testing and direct entry */}
              {(mode === 'login' || mode === 'signup') && (
                <button 
                  type="button" 
                  className={`${styles.ctaBtn} ${styles.guestBtn}`} 
                  onClick={handleGuestAccess}
                  disabled={isLoading}
                >
                  <span>⚡ Explore as Guest</span>
                </button>
              )}
            </motion.form>
          </AnimatePresence>
          
        </div>
      </div>
      
    </div>
  )
}

/* ── MOCK SVGS AND SUB-COMPONENTS ── */

function LogoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 22, height: 22 }}>
      <path d="M9 16.5L13.5 21L23 11" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0110 20c-6 0-9-6-9-6a17.93 17.93 0 013.06-4.06M9.9 4.24A9.12 9.12 0 0110 4c6 0 9 6 9 6a18 18 0 01-1.92 2.56M12.83 12.83A3 3 0 018 8l4.83 4.83z" />
      <path d="M1 1l18 18" />
    </svg>
  )
}
