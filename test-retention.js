import dotenv from 'dotenv'
dotenv.config()

import { connectDB } from './server/config/db.js'
import { User, Task, FocusSession, Habit, PomodoroSession, Goal, Routine } from './server/models/index.js'
import { runRetentionCleanup } from './server/jobs/retentionCleanup.js'

const runTests = async () => {
  await connectDB()

  console.log('--- Setting up mock data ---')
  
  // 1. Create a test user and a guest user
  const testUser = await User.create({
    name: 'Retention Test User',
    email: `retention-${Date.now()}@test.com`,
    password: 'password123',
    isGuest: false
  })

  const guestUser = await User.create({
    name: 'Retention Guest User',
    email: `guest-retention-${Date.now()}@test.com`,
    password: 'password123',
    isGuest: true
  })

  // Date constants
  const now = new Date()
  const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

  // 2. Tasks
  // TEST 1: Old completed Task (>32 days)
  const oldCompletedTask = await Task.create({
    userId: testUser.id,
    text: 'Old Completed Task',
    completed: true,
    completedAt: thirtyFiveDaysAgo
  })

  // TEST 2: Recent completed Task (<32 days)
  const recentCompletedTask = await Task.create({
    userId: testUser.id,
    text: 'Recent Completed Task',
    completed: true,
    completedAt: tenDaysAgo
  })

  // TEST 3: Old active/pending Task
  const oldActiveTask = await Task.create({
    userId: testUser.id,
    text: 'Old Active Task',
    completed: false
  })
  // Manually override createdAt to simulate old record
  oldActiveTask.createdAt = thirtyFiveDaysAgo
  await oldActiveTask.save({ silent: true })

  // 3. Focus Sessions
  // TEST 4: Old FocusSession (>32 days)
  const oldFocusSession = await FocusSession.create({
    userId: testUser.id,
    durationSeconds: 1500,
    completed: true
  })
  await FocusSession.update({ createdAt: thirtyFiveDaysAgo }, { where: { id: oldFocusSession.id }, silent: true })

  // TEST 5: Recent FocusSession
  const recentFocusSession = await FocusSession.create({
    userId: testUser.id,
    durationSeconds: 1500,
    completed: true
  })
  await FocusSession.update({ createdAt: tenDaysAgo }, { where: { id: recentFocusSession.id }, silent: true })

  // 4. Habits
  // TEST 6, 7, 8: Old date, recent date, Habit itself
  const habit = await Habit.create({
    userId: testUser.id,
    name: 'Test Habit',
    completions: {
      [thirtyFiveDaysAgo.toISOString().split('T')[0]]: true, // Old
      [tenDaysAgo.toISOString().split('T')[0]]: true // Recent
    }
  })

  // 5. Goals
  // TEST 9: Completed Goal older than 32 days
  const oldCompletedGoal = await Goal.create({
    userId: testUser.id,
    title: 'Old Goal',
    target: 10,
    current: 10
  })
  oldCompletedGoal.updatedAt = thirtyFiveDaysAgo
  await oldCompletedGoal.save({ silent: true })

  // 6. Routines
  // TEST 10: Routine older than 32 days
  const oldRoutine = await Routine.create({
    userId: testUser.id,
    text: 'Old Routine',
    scheduleType: 'daily'
  })
  oldRoutine.createdAt = thirtyFiveDaysAgo
  await oldRoutine.save({ silent: true })

  // 7. PomodoroSession
  // TEST 11: PomodoroSession aggregate
  const pomoAggregate = await PomodoroSession.create({
    userId: testUser.id,
    sessionCount: 15
  })
  pomoAggregate.createdAt = thirtyFiveDaysAgo
  await pomoAggregate.save({ silent: true })

  // Add an old guest task to verify guest data is cleaned
  const oldGuestTask = await Task.create({
    userId: guestUser.id,
    text: 'Old Guest Task',
    completed: true,
    completedAt: thirtyFiveDaysAgo
  })

  console.log('--- Running cleanup ---')
  await runRetentionCleanup()

  console.log('--- Verifying results ---')

  // TEST 1: Old completed Task should be deleted
  const checkTask1 = await Task.findByPk(oldCompletedTask.id)
  console.log('TEST 1 (Old completed task deleted):', checkTask1 === null ? 'PASS' : 'FAIL')

  // TEST 2: Recent completed Task should remain
  const checkTask2 = await Task.findByPk(recentCompletedTask.id)
  console.log('TEST 2 (Recent completed task preserved):', checkTask2 !== null ? 'PASS' : 'FAIL')

  // TEST 3: Old active/pending Task should remain
  const checkTask3 = await Task.findByPk(oldActiveTask.id)
  console.log('TEST 3 (Old active task preserved):', checkTask3 !== null ? 'PASS' : 'FAIL')

  // TEST 4: Old FocusSession should be deleted
  const checkFocus1 = await FocusSession.findByPk(oldFocusSession.id)
  console.log('TEST 4 (Old FocusSession deleted):', checkFocus1 === null ? 'PASS' : 'FAIL')

  // TEST 5: Recent FocusSession should remain
  const checkFocus2 = await FocusSession.findByPk(recentFocusSession.id)
  console.log('TEST 5 (Recent FocusSession preserved):', checkFocus2 !== null ? 'PASS' : 'FAIL')

  // TEST 6, 7, 8: Habit and its dates
  const checkHabit = await Habit.findByPk(habit.id)
  console.log('TEST 8 (Habit preserved):', checkHabit !== null ? 'PASS' : 'FAIL')
  if (checkHabit) {
    const oldKey = thirtyFiveDaysAgo.toISOString().split('T')[0]
    const recentKey = tenDaysAgo.toISOString().split('T')[0]
    console.log('TEST 6 (Old habit date removed):', !checkHabit.completions[oldKey] ? 'PASS' : 'FAIL')
    console.log('TEST 7 (Recent habit date preserved):', checkHabit.completions[recentKey] === true ? 'PASS' : 'FAIL')
  }

  // TEST 9: Old completed Goal should remain
  const checkGoal = await Goal.findByPk(oldCompletedGoal.id)
  console.log('TEST 9 (Old completed Goal preserved):', checkGoal !== null ? 'PASS' : 'FAIL')

  // TEST 10: Old Routine should remain
  const checkRoutine = await Routine.findByPk(oldRoutine.id)
  console.log('TEST 10 (Old Routine preserved):', checkRoutine !== null ? 'PASS' : 'FAIL')

  // TEST 11: PomodoroSession should remain
  const checkPomo = await PomodoroSession.findByPk(pomoAggregate.id)
  console.log('TEST 11 (PomodoroSession preserved):', checkPomo !== null ? 'PASS' : 'FAIL')

  // TEST 12: User account should remain
  const checkUser = await User.findByPk(testUser.id)
  console.log('TEST 12 (User account preserved):', checkUser !== null ? 'PASS' : 'FAIL')

  // TEST 13: Guest account and old guest data
  const checkGuestUser = await User.findByPk(guestUser.id)
  const checkGuestTask = await Task.findByPk(oldGuestTask.id)
  console.log('TEST 13 (Guest account preserved):', checkGuestUser !== null ? 'PASS' : 'FAIL')
  console.log('TEST 13b (Old guest task deleted):', checkGuestTask === null ? 'PASS' : 'FAIL')

  console.log('--- Cleaning up test mock data ---')
  await testUser.destroy()
  await guestUser.destroy() // Cascade will take care of the rest
  
  process.exit(0)
}

runTests().catch(console.error)
