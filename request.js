const req = async () => {
  const email = 'test_signup_44@example.com';
  try {
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
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
};
req();
