import React, { useState } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        setMessage('Login successful!');
      } else {
        await createUserWithEmailAndPassword(auth, form.email, form.password);
        setMessage('Registered successfully!');
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: '0 auto', padding: 20 }}>
      <h2>{isLogin ? 'Login' : 'Registrarse'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10 }}
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: '100%', marginBottom: 10 }}
        />
        <button type="submit" style={{ width: '100%' }}>
          {isLogin ? 'Login' : 'Registrarse'}
        </button>
      </form>
      <p style={{ marginTop: 10 }}>
        {isLogin ? 'Necesitas una cuenta?' : 'Ya tienes una cuenta?'}{' '}
        <button onClick={() => setIsLogin(!isLogin)} style={{ border: 'none', color: 'blue', background: 'none', cursor: 'pointer' }}>
          {isLogin ? 'Registrarse' : 'Login'}
        </button>
      </p>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
};

export default AuthForm;
