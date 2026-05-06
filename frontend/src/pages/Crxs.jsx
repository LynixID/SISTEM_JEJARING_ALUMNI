import React from 'react'

const Crxs = () => {
  const demoCredentials = [
    { role: 'Alumni', email: 'alumni@demo.com', password: 'password123' },
    { role: 'Pengurus', email: 'pengurus@demo.com', password: 'password123' },
    { role: 'Administrator', email: 'admin@demo.com', password: 'password123' }
  ]

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>System Credentials</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {demoCredentials.map((cred, index) => (
          <li key={index} style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{cred.role}</div>
            <div>Email: {cred.email}</div>
            <div>Password: {cred.password}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Crxs
