import React, { useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AiOutlineMail, AiOutlineLock } from 'react-icons/ai';
import './AuthForm.css'; // custom CSS

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

const AuthForm = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;

      // Check if user is leader
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();

      if (!userData?.is_leader) {
        await signOut(auth);
        setMessage('❌ No tienes permisos para acceder.');
        return;
      }

      setMessage('✅ Login successful!');
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
        <p>¿Necesitas una cuenta? Llama al admin</p>
        {message && (
          <p className={`message ${message.startsWith('✅') || message.startsWith('🎉') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
