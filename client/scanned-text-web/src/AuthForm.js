import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AiOutlineMail, AiOutlineLock } from 'react-icons/ai';
import './AuthForm.css';

const InputField = ({ icon: Icon, name, type, placeholder, value, onChange, required }) => (
  <div className="input-container">
    <Icon className="input-icon" />
    <input
      className="input-field"
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
  </div>
);

function AuthForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      setMessage('✅ Login successful');
      // IMPORTANT: Do NOT redirect here
      // App.js will react to auth state change
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>Login</h2>
        <p>Accede a tu cuenta</p>

        <form onSubmit={handleSubmit}>
          <InputField
            icon={AiOutlineMail}
            name="email"
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={handleChange}
            required
          />

          <InputField
            icon={AiOutlineLock}
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Procesando...' : 'Login'}
          </button>
        </form>

        {message && (
          <p
            className={`message ${
              message.startsWith('✅') ? 'success' : 'error'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthForm;

