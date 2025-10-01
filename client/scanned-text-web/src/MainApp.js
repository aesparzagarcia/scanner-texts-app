import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AiOutlineUser, AiOutlinePhone, AiOutlineMail, AiOutlineLock, AiOutlineTag } from 'react-icons/ai';

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

function MainApp() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registration form state
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', reference: '' });
  const [regMessage, setRegMessage] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('https://scanner-texts-app.onrender.com/texts')
      .then(res => res.json())
      .then(data => {
        setTexts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMessage('');
    setRegLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        name: form.name,
        phone: form.phone,
        email: form.email,
        reference: form.reference,
        is_leader: false, // only admins can set true
        createdAt: serverTimestamp()
      });

      setRegMessage('🎉 Registered successfully!');
      setForm({ name: '', phone: '', email: '', password: '', reference: '' });
    } catch (err) {
      setRegMessage(`❌ ${err.message}`);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>📋 INES Escaneadas</h1>

      {/* Leader Registration Form */}
      <div style={{ marginBottom: 30, border: '1px solid #ccc', padding: 15, borderRadius: 6, maxWidth: 400 }}>
        <h3>➕ Registrar nuevo usuario</h3>
        <form onSubmit={handleRegister}>
          <InputField icon={AiOutlineUser} name="name" type="text" placeholder="Nombre" value={form.name} onChange={handleFormChange} required />
          <InputField icon={AiOutlinePhone} name="phone" type="tel" placeholder="Teléfono" value={form.phone} onChange={handleFormChange} required />
          <InputField icon={AiOutlineTag} name="reference" type="text" placeholder="Referencia" value={form.reference} onChange={handleFormChange} required />
          <InputField icon={AiOutlineMail} name="email" type="email" placeholder="Correo" value={form.email} onChange={handleFormChange} required />
          <InputField icon={AiOutlineLock} name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleFormChange} required />
          <button type="submit" disabled={regLoading} style={{ marginTop: 10 }}>
            {regLoading ? 'Procesando...' : 'Registrar'}
          </button>
        </form>
        {regMessage && <p style={{ marginTop: 10 }}>{regMessage}</p>}
      </div>

      {/* Existing texts table (simplified) */}
      {loading && <p>⏳ Cargando datos...</p>}
      {!loading && texts.length === 0 && <p>No texts found.</p>}
      {!loading && texts.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nombre', 'Domicilio', 'Teléfono', 'Sección', 'Colonia', 'Petición', 'Estatus', 'Referencia', 'Creado por'].map(h => <th key={h} style={{ padding: 8 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {texts.map(({ id, text, status }) => (
              <tr key={id}>
                <td>{text.nombre}</td>
                <td>{text.domicilio}</td>
                <td>{text.telefono}</td>
                <td>{text.seccion}</td>
                <td>{text.colonia}</td>
                <td>{text.peticion}</td>
                <td>{status ? 'Completado' : 'Pendiente'}</td>
                <td>{text.referencia}</td>
                <td>{text.creadopor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MainApp;

