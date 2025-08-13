import React, { useState } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert('Submitting form');
    console.log("Form submitted", form, isLogin);
    setMessage('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        setMessage('Login successful!');
      } else {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const uid = userCredential.user.uid;

        // Save extra fields in Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: form.name,
          phone: form.phone,
          email: form.email,
          createdAt: serverTimestamp()
        });

        // You can save name/phone in Firestore here if needed
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
        {!isLogin && (
          <>
            <input
              name="name"
              type="text"
              placeholder="Nombre"
              value={form.name}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
            <input
              name="phone"
              type="tel"
              placeholder="Teléfono"
              value={form.phone}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: 10 }}
            />
          </>
        )}
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
        {isLogin ? '¿Necesitas una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          style={{
            border: 'none',
            color: 'blue',
            background: 'none',
            cursor: 'pointer',
            padding: 0
          }}
        >
          {isLogin ? 'Registrarse' : 'Login'}
        </button>
      </p>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
};

export default AuthForm;
