// server/jobs/retentionCleanup.js
import { Op } from 'sequelize'
import { Task, FocusSession, Habit } from '../models/index.js'

/**
 * Runs the 32-day data retention cleanup process.
 * Eligible historical data older than 32 days will be deleted.
 * User accounts, settings, and aggregate data are NEVER deleted by this process.
 */
export const runRetentionCleanup = async () => {
  console.log('[Retention Cleanup] Starting 32-day data retention cleanup process...')
  
  try {
    // Calculate the cutoff date (32 days ago)
    const thirtyTwoDaysAgo = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000)
    
    // 1. Cleanup Tasks
    // Delete tasks if they were completed OR deleted older than 32 days ago
    const deletedTasksCount = await Task.destroy({
      where: {
        [Op.or]: [
          {
            completedAt: {
              [Op.lt]: thirtyTwoDaysAgo,
              [Op.ne]: null
            }
          },
          {
            deletedAt: {
              [Op.lt]: thirtyTwoDaysAgo,
              [Op.ne]: null
            }
          }
        ]
      }
    })
    
    console.log(`[Retention Cleanup] Tasks removed: ${deletedTasksCount}`)

    // 2. Cleanup Focus Sessions
    // Delete historical focus sessions created older than 32 days ago
    const deletedSessionsCount = await FocusSession.destroy({
      where: {
        createdAt: {
          [Op.lt]: thirtyTwoDaysAgo
        }
      }
    })
    
    console.log(`[Retention Cleanup] Focus sessions removed: ${deletedSessionsCount}`)

    // 3. Cleanup Habit Completions
    // Prune the JSON completions object for dates older than 32 days
    const habits = await Habit.findAll()
    let prunedHabitCount = 0
    let totalKeysRemoved = 0

    for (const habit of habits) {
      if (!habit.completions || typeof habit.completions !== 'object') continue

      const completions = { ...habit.completions }
      let isModified = false

      for (const dateKey of Object.keys(completions)) {
        // dateKey is expected to be 'YYYY-MM-DD'
        const completionDate = new Date(dateKey)
        // If it's a valid date and older than 32 days
        if (!isNaN(completionDate.getTime()) && completionDate < thirtyTwoDaysAgo) {
          delete completions[dateKey]
          isModified = true
          totalKeysRemoved++
        }
      }

      if (isModified) {
        habit.completions = completions
        // In Sequelize, if assigning a new object to a JSON field, it detects the change
        // We explicitly tell it the field changed just to be safe
        habit.changed('completions', true)
        await habit.save()
        prunedHabitCount++
      }
    }

    console.log(`[Retention Cleanup] Habit completion dates removed: ${totalKeysRemoved} (from ${prunedHabitCount} habits)`)
    console.log('[Retention Cleanup] Process completed successfully.')

  } catch (error) {
    console.error('[Retention Cleanup] ERROR during cleanup process:', error.message)
    // We swallow the error so it doesn't crash the server, but it is logged.
  }
}
