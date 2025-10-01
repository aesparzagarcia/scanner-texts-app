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

  // Registration form state (leader-only)
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
        is_leader: false, // leaders can later promote
        createdAt: serverTimestamp()
      });

      setRegMessage('🎉 Nuevo usuario registrado con éxito');
      setForm({ name: '', phone: '', email: '', password: '', reference: '' });
    } catch (err) {
      setRegMessage(`❌ ${err.message}`);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>📋 INES Escaneadas</h2>

        {/* ➕ Leader-only Registration Form */}
        <div style={{ marginBottom: 25 }}>
          <h3>Registrar nuevo usuario</h3>
          <form onSubmit={handleRegister}>
            <InputField icon={AiOutlineUser} name="name" type="text" placeholder="Nombre" value={form.name} onChange={handleFormChange} required />
            <InputField icon={AiOutlinePhone} name="phone" type="tel" placeholder="Teléfono" value={form.phone} onChange={handleFormChange} required />
            <InputField icon={AiOutlineTag} name="reference" type="text" placeholder="Referencia" value={form.reference} onChange={handleFormChange} required />
            <InputField icon={AiOutlineMail} name="email" type="email" placeholder="Correo" value={form.email} onChange={handleFormChange} required />
            <InputField icon={AiOutlineLock} name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleFormChange} required />
            <button type="submit" disabled={regLoading}>
              {regLoading ? 'Procesando...' : 'Registrar'}
            </button>
          </form>
          {regMessage && <p className={`message ${regMessage.startsWith('🎉') ? 'success' : 'error'}`}>{regMessage}</p>}
        </div>

        {/* Existing table */}
        {loading && <p>⏳ Cargando datos...</p>}
        {!loading && texts.length === 0 && <p>No se encontraron registros.</p>}
        {!loading && texts.length > 0 && (
          <table>
            <thead>
              <tr>
                {['Nombre', 'Domicilio', 'Teléfono', 'Sección', 'Colonia', 'Petición', 'Estatus', 'Referencia', 'Creado por'].map(h => (
                  <th key={h}>{h}</th>
                ))}
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
    </div>
  );
}

export default MainApp;
