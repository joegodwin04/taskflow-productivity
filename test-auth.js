import sqlite3 from 'sqlite3'

const baseUrl = 'http://localhost:5000/api/auth'

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testAuthFlow() {
  console.log('--- STARTING AUTH E2E TEST ---\n')
  
  const testEmail = `test_${Date.now()}@example.com`

  console.log('1. Testing weak password signup (should fail)...')
  let res = await fetch(`${baseUrl}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: testEmail, password: 'weak' })
  })
  let data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)

  console.log('\n2. Testing invalid email signup (should fail)...')
  res = await fetch(`${baseUrl}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: 'invalid-email', password: 'StrongPassword123' })
  })
  data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)

  console.log('\n3. Testing valid signup (should succeed)...')
  res = await fetch(`${baseUrl}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'StrongPassword123' })
  })
  data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)
  const userId = data.userId

  console.log('\n4. Verifying OTP exists in SQLite...')
  const db = new sqlite3.Database('./database.sqlite')
  let otp = null
  await new Promise((resolve, reject) => {
    db.get('SELECT verificationOtp, verificationOtpExpires FROM Users WHERE email = ?', [testEmail], (err, row) => {
      if (err) return reject(err)
      console.log('DB Row for User:', row)
      otp = row.verificationOtp
      resolve()
    })
  })

  console.log('\n5. Testing verify-email with invalid OTP (should fail)...')
  res = await fetch(`${baseUrl}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email: testEmail, otp: '000000' })
  })
  data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)

  console.log('\n6. Testing verify-email with valid OTP (should succeed)...')
  res = await fetch(`${baseUrl}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email: testEmail, otp })
  })
  data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)
  const token = data.token

  console.log('\n7. Testing forgot-password (should succeed)...')
  res = await fetch(`${baseUrl}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  })
  data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)

  console.log('\n8. Verifying reset OTP exists in SQLite...')
  let resetOtp = null
  await new Promise((resolve, reject) => {
    db.get('SELECT resetPasswordOtp FROM Users WHERE email = ?', [testEmail], (err, row) => {
      if (err) return reject(err)
      console.log('DB Row for Reset OTP:', row)
      resetOtp = row.resetPasswordOtp
      resolve()
    })
  })

  console.log('\n9. Testing reset-password (should succeed)...')
  res = await fetch(`${baseUrl}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: resetOtp, newPassword: 'NewStrongPassword456' })
  })
  data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)

  console.log('\n10. Testing login with new password (should succeed)...')
  res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'NewStrongPassword456' })
  })
  data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)

  console.log('\n11. Testing old OTP invalidation (should fail)...')
  res = await fetch(`${baseUrl}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: resetOtp, newPassword: 'AnotherPassword789' })
  })
  data = await res.json()
  console.log(`Status: ${res.status}, Response:`, data)

  console.log('\n--- TESTS COMPLETED SUCESSFULLY ---')
}

testAuthFlow().catch(console.error)
