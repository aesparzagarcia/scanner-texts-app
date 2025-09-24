import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AiOutlineMail, AiOutlineLock, AiOutlineUser, AiOutlinePhone, AiOutlineTag } from 'react-icons/ai';
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
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', reference: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        setMessage('✅ Login successful!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const uid = userCredential.user.uid;
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: form.name,
          phone: form.phone,
          email: form.email,
          reference: form.reference,
          createdAt: serverTimestamp()
        });
        setMessage('🎉 Registered successfully!');
      }
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>{isLogin ? 'Login' : 'Registrarse'}</h2>
        <p>{isLogin ? 'Accede a tu cuenta' : 'Crea una nueva cuenta'}</p>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <InputField icon={AiOutlineUser} name="name" type="text" placeholder="Nombre" value={form.name} onChange={handleChange} required />
              <InputField icon={AiOutlinePhone} name="phone" type="tel" placeholder="Teléfono" value={form.phone} onChange={handleChange} required />
              <InputField icon={AiOutlineTag} name="reference" type="text" placeholder="Referencia" value={form.reference} onChange={handleChange} required />
            </>
          )}
          <InputField icon={AiOutlineMail} name="email" type="email" placeholder="Correo" value={form.email} onChange={handleChange} required />
          <InputField icon={AiOutlineLock} name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} required />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Procesando...' : isLogin ? 'Login' : 'Registrarse'}
          </button>
        </form>
        <p>
          {isLogin ? '¿Necesitas una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
          <span onClick={() => setIsLogin(!isLogin)} className="switch-link">
            {isLogin ? 'Registrarse' : 'Login'}
          </span>
        </p>
        {message && <p className={`message ${message.startsWith('✅') || message.startsWith('🎉') ? 'success' : 'error'}`}>{message}</p>}
      </div>
    </div>
  );
};

export default AuthForm;
