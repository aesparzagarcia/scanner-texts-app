import React, { useState } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Small reusable input
const InputField = ({ name, type, placeholder, value, onChange, required }) => (
  <input
    name={name}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    className="w-full p-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
);

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    reference: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        setMessage('✅ Login successful!');
      } else {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        const uid = userCredential.user.uid;

        // Save extra fields in Firestore
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          {isLogin ? 'Login' : 'Registrarse'}
        </h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <InputField
                name="name"
                type="text"
                placeholder="Nombre"
                value={form.name}
                onChange={handleChange}
                required
              />
              <InputField
                name="phone"
                type="tel"
                placeholder="Teléfono"
                value={form.phone}
                onChange={handleChange}
                required
              />
              <InputField
                name="reference"
                type="text"
                placeholder="Referencia"
                value={form.reference}
                onChange={handleChange}
                required
              />
            </>
          )}

          <InputField
            name="email"
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={handleChange}
            required
          />
          <InputField
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Procesando...' : isLogin ? 'Login' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? '¿Necesitas una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
          <span
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            {isLogin ? 'Registrarse' : 'Login'}
          </span>
        </p>

        {message && (
          <p
            className={`mt-3 text-center text-sm font-medium ${
              message.startsWith('✅') || message.startsWith('🎉')
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
