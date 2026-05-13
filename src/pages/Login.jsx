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
        <img src="/logo.png" alt="Creove Logo" className="login-logo" />
        <h1>Login Admin</h1>
        <p className="login-help-text">
          Masukkan PIN akses Creove Dashboard
        </p>
        <label className="login-pin-label" htmlFor="admin-pin">PIN Admin</label>
        <input 
          id="admin-pin"
          type="password" 
          placeholder="PIN" 
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          aria-invalid={loginError}
        />
        <button onClick={handleLogin} className="btn-login">Masuk</button>
        {loginError && <p className="login-error">PIN salah.</p>}
      </div>
    </div>
  );
}
