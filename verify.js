import { spawn } from 'child_process';

const run = async () => {
  const server = spawn('node', ['server/index.js'], { cwd: process.cwd() });
  
  server.stdout.on('data', (d) => console.log(`[Server] ${d}`));
  server.stderr.on('data', (d) => console.error(`[Server ERR] ${d}`));

  await new Promise(r => setTimeout(r, 2000));

  const email = `test_${Date.now()}@test.com`;
  
  // 1. Signup
  const res1 = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email, password: 'password', securityQuestion: 'Q', securityAnswer: 'A' })
  });
  console.log('Signup 1:', res1.status);
  
  // Stop server
  server.kill();
  await new Promise(r => setTimeout(r, 2000));
  
  // 2. Start server again
  const server2 = spawn('node', ['server/index.js'], { cwd: process.cwd() });
  server2.stdout.on('data', (d) => console.log(`[Server 2] ${d}`));
  
  await new Promise(r => setTimeout(r, 2000));
  
  // 3. Login
  const res2 = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password', remember: true })
  });
  console.log('Login 2:', res2.status, await res2.text());
  
  server2.kill();
};

run();
