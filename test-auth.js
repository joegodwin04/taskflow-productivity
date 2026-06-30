import { spawn } from 'child_process';
import path from 'path';

const server = spawn('node', ['server/index.js'], { cwd: process.cwd() });

server.stdout.on('data', (data) => console.log(`stdout: ${data}`));
server.stderr.on('data', (data) => console.error(`stderr: ${data}`));

setTimeout(async () => {
  try {
    const email = `test_persist_${Date.now()}@example.com`;
    console.log('Sending signup...');
    const res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Persist',
        email,
        password: 'password123',
        securityQuestion: 'Q?',
        securityAnswer: 'A!'
      })
    });
    console.log('Signup 1 Status:', res.status);
    
    // Stop server
    server.kill();
    
    setTimeout(async () => {
      // Start server again
      const server2 = spawn('node', ['server/index.js'], { cwd: process.cwd() });
      server2.stdout.on('data', (data) => console.log(`stdout2: ${data}`));
      setTimeout(async () => {
        const res2 = await fetch('http://localhost:5000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Persist',
            email,
            password: 'password123',
            securityQuestion: 'Q?',
            securityAnswer: 'A!'
          })
        });
        console.log('Signup 2 Status:', res2.status);
        server2.kill();
      }, 2000);
    }, 1000);
  } catch(e) {
    console.error(e);
    server.kill();
  }
}, 2000);
