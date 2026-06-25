// GoalTracker.jsx — Goal progress cards with +/- controls
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGoals } from '../hooks/useGoals'
import styles from './GoalTracker.module.css'

const ICONS = ['🎯','🏆','🔥','⚡','🚀','💡','📈','🌟','💎','🛡️']
const COLORS = ['#7c6af7','#f43f5e','#f59e0b','#10b981','#22d3ee','#ec4899','#6366f1']

export default function GoalTracker({ user }) {
  const { goals, addGoal, increment, decrement, deleteGoal, getProgress } = useGoals(user)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', target: '', unit: '', icon: '🎯', color: '#7c6af7', dueDate: '' })

  const handleAdd = () => {
    if (!form.title.trim() || !form.target) return
    addGoal(form)
    setForm({ title: '', target: '', unit: '', icon: '🎯', color: '#7c6af7', dueDate: '' })
    setAdding(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>Goals</h3>
        <motion.button
          className={styles.addBtn}
          onClick={() => setAdding(v => !v)}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        >
          {adding ? '✕ Cancel' : '+ Add Goal'}
        </motion.button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            className={styles.form}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}
          >
            <div className={styles.formInner}>
              <div className={styles.iconRow}>
                {ICONS.map(ic => (
                  <button key={ic} className={`${styles.iconBtn} ${form.icon === ic ? styles.iconBtnActive : ''}`}
                    onClick={() => setForm(f => ({ ...f, icon: ic }))}>{ic}</button>
                ))}
              </div>
              <div className={styles.colorRow}>
                {COLORS.map(c => (
                  <button key={c} className={`${styles.colorBtn} ${form.color === c ? styles.colorBtnActive : ''}`}
                    style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
              <input className={styles.input} placeholder="Goal title…" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={50} />
              <div className={styles.formRow}>
                <input className={styles.input} placeholder="Target (e.g. 30)" type="number" min="1"
                  value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
                <input className={styles.input} placeholder="Unit (e.g. tasks)"
                  value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <button className={styles.saveBtn} onClick={handleAdd} disabled={!form.title.trim() || !form.target}>
                Create Goal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.list}>
        <AnimatePresence>
          {goals.length === 0 && !adding && (
            <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span>🏆</span><p>No activity yet</p>
            </motion.div>
          )}
          {goals.map((g, i) => {
            const pct = getProgress(g)
            const done = pct >= 100
            return (
              <motion.div
                key={g.id}
                className={`${styles.card} ${done ? styles.cardDone : ''}`}
                style={{ '--gc': g.color }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardIcon} style={{ background: `color-mix(in srgb, ${g.color} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${g.color} 30%, transparent)` }}>
                    {g.icon}
                  </div>
                  <div className={styles.cardBody}>
                    <span className={styles.cardTitle}>{g.title}</span>
                    <span className={styles.cardMeta}>{g.current} / {g.target} {g.unit}</span>
                  </div>
                  <div className={styles.pctBadge} style={{ color: g.color }}>{pct}%</div>
                  <button className={styles.delBtn} onClick={() => deleteGoal(g.id)}>✕</button>
                </div>

                <div className={styles.track}>
                  <motion.div
                    className={styles.fill}
                    style={{ '--gc': g.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                <div className={styles.cardBtns}>
                  <button className={styles.minusBtn} onClick={() => decrement(g.id)} disabled={g.current <= 0}>−</button>
                  <span className={styles.progressLabel}>{done ? '🎉 Complete!' : `${g.target - g.current} ${g.unit} to go`}</span>
                  <button className={styles.plusBtn} style={{ '--gc': g.color }} onClick={() => increment(g.id)} disabled={done}>+</button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
