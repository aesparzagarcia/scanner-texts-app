import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AiOutlineMail, AiOutlineLock, AiOutlineUser, AiOutlinePhone, AiOutlineTag } from 'react-icons/ai';

const InputField = ({ icon: Icon, name, type, placeholder, value, onChange, required }) => (
  <div className="flex items-center border rounded-md mb-3 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
    <div className="px-2 text-gray-500"><Icon /></div>
    <input
      className="w-full p-2 focus:outline-none"
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white shadow-xl rounded-3xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{isLogin ? 'Login' : 'Registrarse'}</h2>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Accede a tu cuenta' : 'Crea una nueva cuenta'}
          </p>
        </div>

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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl mt-4 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Procesando...' : isLogin ? 'Login' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          {isLogin ? '¿Necesitas una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
          <span
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline cursor-pointer font-semibold"
          >
            {isLogin ? 'Registrarse' : 'Login'}
          </span>
        </p>

        {message && (
          <p className={`mt-3 text-center text-sm font-medium ${message.startsWith('✅') || message.startsWith('🎉') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
