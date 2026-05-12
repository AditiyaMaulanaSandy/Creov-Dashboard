import { useState } from 'react';

const KODE_RAHASIA = "123";

export default function Login({ onLoginSuccess }) {
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = () => {
    if (pinInput === KODE_RAHASIA) {
      onLoginSuccess();
    } else {
      setLoginError(true);
      setPinInput('');
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <img src="/logo.png" alt="Creove Logo" style={{ width: 60, borderRadius: '50%', marginBottom: 15 }} />
        <h2>Login Admin</h2>
        <p className="login-help-text">
          Masukkan PIN akses Creove Dashboard
        </p>
        <input 
          type="password" 
          placeholder="PIN" 
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button onClick={handleLogin} className="btn-login">Masuk</button>
        {loginError && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 10 }}>PIN salah!</p>}
      </div>
    </div>
  );
}
