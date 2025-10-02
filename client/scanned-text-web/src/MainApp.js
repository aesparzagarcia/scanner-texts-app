import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineUser,
  AiOutlinePhone,
  AiOutlineTag,
} from 'react-icons/ai';
import './AuthForm.css'; // ✅ use same theme

function InputField({ icon: Icon, name, type, placeholder, value, onChange, required }) {
  return (
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
}

function MainApp() {
  // --- texts state ---
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('');
  const [filterColony, setFilterColony] = useState('');
  const [filterDuplicated, setFilterDuplicated] = useState(null);
  const [filteredTexts, setFilteredTexts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- new register state ---
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    reference: '',
  });
  const [regMessage, setRegMessage] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false); // ✅ controls popup

  useEffect(() => {
    setLoading(true);
    fetch('https://scanner-texts-app.onrender.com/texts')
      .then((res) => res.json())
      .then((data) => {
        setTexts(data);
        setFilteredTexts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const applyFilters = () => {
    const sectionTerm = filterSection.trim().toLowerCase();
    const colonyTerm = filterColony.trim().toLowerCase();

    const filtered = texts.filter(({ text, duplicated }) => {
      const matchesSection =
        !sectionTerm ||
        (text.seccion && text.seccion.toLowerCase().includes(sectionTerm));
      const matchesColony =
        !colonyTerm ||
        (text.colonia && text.colonia.toLowerCase().includes(colonyTerm));
      const matchesDuplicated =
        filterDuplicated === null || duplicated === filterDuplicated;

      return matchesSection && matchesColony && matchesDuplicated;
    });

    setFilteredTexts(filtered);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterSection('');
    setFilterColony('');
    setFilterDuplicated(null);
    setFilteredTexts(texts);
    setCurrentPage(1);
  };

  const toggleStatus = (id, newStatus) => {
    fetch(`https://scanner-texts-app.onrender.com/texts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => res.json())
      .then((updatedText) => {
        setTexts((prev) =>
          prev.map((t) =>
            t.id === updatedText.id ? { ...t, status: updatedText.status } : t
          )
        );
        setFilteredTexts((prev) =>
          prev.map((t) =>
            t.id === updatedText.id ? { ...t, status: updatedText.status } : t
          )
        );
      })
      .catch(() => alert('Error updating status'));
  };

  useEffect(() => applyFilters(), [filterDuplicated, texts]);

  // pagination
  const totalItems = filteredTexts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredTexts.slice(startIndex, endIndex);

  // --- register handlers ---
  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegMessage('');
    setRegLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        name: form.name,
        phone: form.phone,
        email: form.email,
        reference: form.reference,
        is_leader: false, // ✅ leaders create normal users
        createdAt: serverTimestamp(),
      });

      setRegMessage('🎉 Usuario registrado con éxito');
      setForm({
        name: '',
        phone: '',
        email: '',
        password: '',
        reference: '',
      });
    } catch (err) {
      setRegMessage(`❌ ${err.message}`);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: 20, textAlign: 'left' }}>📋 INES Escaneadas</h1>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 20,
          alignItems: 'center',
        }}
      >
        {/* inputs and buttons */}
        {/* ... same filter UI as before ... */}
      </div>

      {loading && <p style={{ textAlign: 'center' }}>⏳ Cargando datos...</p>}
      {!loading && currentItems.length === 0 && (
        <p style={{ textAlign: 'center' }}>No texts found.</p>
      )}

      {/* ... table and pagination as before ... */}

      {/* --- Button to open registration popup --- */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button
          onClick={() => setShowRegister(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ➕ Registrar nuevo usuario
        </button>
      </div>

      {/* --- Registration Modal --- */}
      {showRegister && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div className="auth-box" style={{ width: 400 }}>
            <h2>Registrar nuevo usuario</h2>
            <form onSubmit={handleRegister}>
              <InputField
                icon={AiOutlineUser}
                name="name"
                type="text"
                placeholder="Nombre"
                value={form.name}
                onChange={handleFormChange}
                required
              />
              <InputField
                icon={AiOutlinePhone}
                name="phone"
                type="tel"
                placeholder="Teléfono"
                value={form.phone}
                onChange={handleFormChange}
                required
              />
              <InputField
                icon={AiOutlineTag}
                name="reference"
                type="text"
                placeholder="Referencia"
                value={form.reference}
                onChange={handleFormChange}
                required
              />
              <InputField
                icon={AiOutlineMail}
                name="email"
                type="email"
                placeholder="Correo"
                value={form.email}
                onChange={handleFormChange}
                required
              />
              <InputField
                icon={AiOutlineLock}
                name="password"
                type="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={handleFormChange}
                required
              />
              <button type="submit" disabled={regLoading}>
                {regLoading ? 'Procesando...' : 'Registrar'}
              </button>
            </form>
            {regMessage && (
              <p
                className={`message ${
                  regMessage.startsWith('🎉') ? 'success' : 'error'
                }`}
              >
                {regMessage}
              </p>
            )}

            {/* Close button */}
            <button
              onClick={() => setShowRegister(false)}
              style={{
                marginTop: 10,
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainApp;
