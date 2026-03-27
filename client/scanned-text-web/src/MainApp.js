import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineUser,
  AiOutlinePhone,
  AiOutlineTag,
} from 'react-icons/ai';
import * as XLSX from 'xlsx';
import './MainApp.css'; // ✅ use same theme

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
  // Comma-separated list in env, e.g.:
  // REACT_APP_PROTECTED_USER_EMAILS=owner@domain.com,founder@domain.com
  const PROTECTED_USER_EMAILS = (process.env.REACT_APP_PROTECTED_USER_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

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
    reference: ''
  });
  const [regMessage, setRegMessage] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false); // ✅ controls popup

  // --- gestionar is_leader por email (panel líderes) ---
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [leaderMessage, setLeaderMessage] = useState('');

  // --- users modal state ---
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoadingMore, setUsersLoadingMore] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [users, setUsers] = useState([]);
  const [usersFilter, setUsersFilter] = useState('');
  const [usersLastDoc, setUsersLastDoc] = useState(null);
  const [usersHasMore, setUsersHasMore] = useState(true);
  const [userEdits, setUserEdits] = useState({});
  const [userSaving, setUserSaving] = useState({});
  const USERS_PAGE_SIZE = 200;

  const closeUsersModal = () => {
    setShowUsersModal(false);
    setUsersError('');
    setUsersFilter('');
  };

  const normalizeText = (v) => (v ?? '').toString().trim().toLowerCase();
  const isProtectedUserEmail = (email) => PROTECTED_USER_EMAILS.includes(normalizeText(email));

  const upsertUserEdits = (uid, patch) => {
    setUserEdits((prev) => ({
      ...prev,
      [uid]: {
        ...(prev[uid] || {}),
        ...patch,
      },
    }));
  };

  const loadUsersPage = async ({ reset } = { reset: false }) => {
    const runLoadingSetter = reset ? setUsersLoading : setUsersLoadingMore;
    runLoadingSetter(true);
    setUsersError('');
    try {
      const base = collection(db, 'users');
      const q = reset
        ? query(base, orderBy('email'), limit(USERS_PAGE_SIZE))
        : query(base, orderBy('email'), startAfter(usersLastDoc), limit(USERS_PAGE_SIZE));

      const snap = await getDocs(q);
      const batch = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          email: data.email || '',
          name: data.name || '',
          phone: data.phone || '',
          reference: data.reference || '',
          is_leader: !!data.is_leader,
          leader: data.leader || '',
        };
      });

      const last = snap.docs[snap.docs.length - 1] || null;
      const hasMore = snap.docs.length === USERS_PAGE_SIZE;

      if (reset) {
        setUsers(batch);
      } else {
        setUsers((prev) => [...prev, ...batch]);
      }
      setUsersLastDoc(last);
      setUsersHasMore(hasMore);

      // Initialize edit buffers for newly loaded users (don’t overwrite existing edits).
      setUserEdits((prev) => {
        const next = { ...prev };
        for (const u of batch) {
          if (!next[u.id]) {
            next[u.id] = {
              is_leader: u.is_leader,
              leader: u.leader,
              reference: u.reference,
            };
          }
        }
        return next;
      });
    } catch (err) {
      const msg = err?.message || 'Error loading users';
      setUsersError(msg);
    } finally {
      runLoadingSetter(false);
    }
  };

  useEffect(() => {
    if (!showUsersModal) return;
    // Reset paging state on open.
    setUsers([]);
    setUsersLastDoc(null);
    setUsersHasMore(true);
    setUserEdits({});
    loadUsersPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUsersModal]);

  const saveUserRow = async (uid) => {
    setUsersError('');
    setUserSaving((prev) => ({ ...prev, [uid]: true }));
    try {
      const targetUser = users.find((u) => u.id === uid);
      if (targetUser && isProtectedUserEmail(targetUser.email)) {
        setUsersError('Este usuario está protegido y no se puede modificar.');
        return;
      }
      const edits = userEdits[uid] || {};
      const payload = {
        is_leader: !!edits.is_leader,
        leader: (edits.leader ?? '').toString().trim(),
        reference: (edits.reference ?? '').toString().trim(),
      };
      await updateDoc(doc(db, 'users', uid), payload);
      setUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, ...payload } : u))
      );
    } catch (err) {
      const msg = err?.message || 'Error saving user';
      setUsersError(msg);
    } finally {
      setUserSaving((prev) => ({ ...prev, [uid]: false }));
    }
  };

  const handleUpdateLeader = async (isLeader) => {
    setLeaderMessage('');
    const email = leaderEmail.trim();
    if (!email) {
      setLeaderMessage('❌ Escribe el correo del usuario.');
      return;
    }
    setLeaderLoading(true);
    try {
      let snap = await getDocs(
        query(collection(db, 'users'), where('email', '==', email))
      );
      if (snap.empty) {
        snap = await getDocs(
          query(collection(db, 'users'), where('email', '==', email.toLowerCase()))
        );
      }
      if (snap.empty) {
        setLeaderMessage('❌ No se encontró usuario con ese correo.');
        return;
      }
      const foundData = snap.docs[0].data() || {};
      if (isProtectedUserEmail(foundData.email || email)) {
        setLeaderMessage('❌ Este usuario está protegido y no se puede modificar.');
        return;
      }
      await updateDoc(snap.docs[0].ref, { is_leader: isLeader });
      setLeaderMessage(
        isLeader
          ? '✅ Usuario marcado como líder. En el menú, busca la opción actualizar permisos'
          : '✅ Usuario ya no es líder.'
      );
    } catch (err) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'permission-denied' || msg.includes('permission')) {
        setLeaderMessage(
          '❌ Sin permiso en Firestore. Revisa reglas: ver FIRESTORE_RULES_LEADER_PANEL.md'
        );
      } else {
        setLeaderMessage(`❌ ${msg || code || 'Error al actualizar'}`);
      }
    } finally {
      setLeaderLoading(false);
    }
  };

  useEffect(() => {
    const fetchTexts = async () => {
      try {
        setLoading(true);

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          console.log('❌ No logged user yet');
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        console.log('🔥 TOKEN EXISTS:', !!token);

        const response = await fetch(
          'https://scanner-texts-app.onrender.com/texts',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error('❌ Unauthorized', response.status);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setTexts(data);
        setFilteredTexts(data);
      } catch (err) {
        console.error('❌ Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTexts();
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

  const exportToExcel = () => {
    const headers = ['Nombre', 'Domicilio', 'Teléfono', 'Sección', 'Colonia', 'Petición', 'Clave de Elector', 'Estatus', 'Referencia', 'Lider', 'Creado por', 'Carro', 'Tipo Carro'];
    const rows = filteredTexts.map(({ text, status }) => [
      text.nombre || 'N/A',
      text.domicilio || 'N/A',
      text.telefono || 'N/A',
      text.seccion || 'N/A',
      text.colonia || 'N/A',
      text.peticion || 'N/A',
      text.clave_elector || 'N/A',
      status ? 'Completado' : 'Pendiente',
      text.referencia || 'N/A',
      text.lider || 'N/A',
      text.creadopor || 'N/A',
      text.carro || 'N/A',
      text.tipo_carro || 'N/A',
    ]);
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'INES Escaneadas');
    XLSX.writeFile(wb, `ines-escaneadas-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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

      {/* Panel: gestionar is_leader por correo (Firestore users) */}
      <div
        style={{
          marginBottom: 20,
          padding: 14,
          border: '1px solid #cce5ff',
          borderRadius: 8,
          backgroundColor: '#f0f8ff',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0', fontSize: 16, fontWeight: 600 }}>
          Gestionar líderes (web)
        </h2>
        <p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#555' }}>
          Busca un usuario el correo del usuario y conviételo el lider.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={leaderEmail}
            onChange={(e) => setLeaderEmail(e.target.value)}
            disabled={leaderLoading}
            style={{
              padding: '6px 10px',
              borderRadius: 4,
              border: '1px solid #ccc',
              minWidth: 220,
              fontSize: 14,
            }}
          />
          <button
            type="button"
            disabled={leaderLoading}
            onClick={() => handleUpdateLeader(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              cursor: leaderLoading ? 'wait' : 'pointer',
              fontSize: 14,
            }}
          >
            Hacer líder
          </button>
          <button
            type="button"
            disabled={leaderLoading}
            onClick={() => handleUpdateLeader(false)}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              cursor: leaderLoading ? 'wait' : 'pointer',
              fontSize: 14,
            }}
          >
            Quitar líder
          </button>
        </div>
        {leaderMessage && (
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>{leaderMessage}</p>
        )}
        {leaderLoading && (
          <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13, color: '#666' }}>
            Actualizando…
          </p>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <input type="text" placeholder="Sección" value={filterSection}
          onChange={e => setFilterSection(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', width: 100, fontSize: 14 }} />
        <input type="text" placeholder="Colonia" value={filterColony}
          onChange={e => setFilterColony(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', width: 150, fontSize: 14 }} />

        <button onClick={applyFilters}
          style={{ padding: '4px 12px', borderRadius: 4, backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          Filtrar
        </button>

        <button onClick={() => setFilterDuplicated(true)}
          style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: filterDuplicated === true ? '#dc3545' : '#f8d7da',
                   color: filterDuplicated === true ? 'white' : '#721c24', border: '1px solid #dc3545', cursor: 'pointer', fontSize: 14 }}>
          Duplicados
        </button>
        <button onClick={() => setFilterDuplicated(false)}
          style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: filterDuplicated === false ? '#28a745' : '#d4edda',
                   color: filterDuplicated === false ? 'white' : '#155724', border: '1px solid #28a745', cursor: 'pointer', fontSize: 14 }}>
          No Duplicados
        </button>
        <button onClick={handleClearFilter}
          style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          Limpiar
        </button>
        {filteredTexts.length > 0 && (
          <button onClick={exportToExcel}
            style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            Exportar a Excel
          </button>
        )}
      </div>

      {loading && <p style={{ textAlign: 'center' }}>⏳ Cargando datos...</p>}
      {!loading && currentItems.length === 0 && <p style={{ textAlign: 'center' }}>No hay escaneos aún.</p>}

      {!loading && currentItems.length > 0 && (
        <>
          {/* Counter */}
          <p style={{ marginBottom: 10, fontSize: 14, color: '#555' }}>
            Mostrando {startIndex + 1}–{endIndex} de {totalItems}
          </p>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 0 5px rgba(0,0,0,0.1)' }}>
              <thead style={{ backgroundColor: '#f1f1f1' }}>
                <tr>
                  {['Nombre', 'Domicilio', 'Teléfono', 'Sección', 'Colonia', 'Petición', 'Clave de Elector', 'Estatus', 'Referencia', 'Lider', 'Creado por', 'Carro', 'Tipo Carro'].map(header => (
                    <th key={header} style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #ccc' }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.map(({ id, text, status }) => (
                  <tr key={id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                    <td style={{ padding: 8 }}>{text.nombre || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.domicilio || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.telefono || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.seccion || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.colonia || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.peticion || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.clave_elector || 'N/A'}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => toggleStatus(id, !status)}
                        style={{ backgroundColor: status ? '#28a745' : '#dc3545', color: 'white',
                                 padding: '4px 8px', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                        {status ? 'Completado' : 'Pendiente'}
                      </button>
                    </td>
                    <td style={{ padding: 8 }}>{text.referencia || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.lider || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.creadopor || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.carro || 'N/A'}</td>
                    <td style={{ padding: 8 }}>{text.tipo_carro || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div style={{ marginTop: 15, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer' }}
            >
              ⬅️ Anterior
            </button>
            <span style={{ alignSelf: 'center' }}>Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer' }}
            >
              Siguiente ➡️
            </button>
          </div>
        </>
      )}

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

      {/* --- Users FAB + Modal --- */}
      <button
        type="button"
        className="fab-btn"
        title="Usuarios"
        onClick={() => setShowUsersModal(true)}
      >
        👤
      </button>

      {showUsersModal && (
        <div className="modal-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeUsersModal();
        }}>
          <div className="modal-box wide" role="dialog" aria-modal="true" aria-label="Usuarios">
            <div className="modal-header">
              <h2 className="modal-title">Usuarios</h2>
              <div className="modal-actions">
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Filtrar por nombre…"
                  value={usersFilter}
                  onChange={(e) => setUsersFilter(e.target.value)}
                />
                <button type="button" className="small-btn secondary" onClick={closeUsersModal}>
                  Cerrar
                </button>
              </div>
            </div>

            {usersError && (
              <div style={{ marginBottom: 10, color: '#b00020', fontSize: 13 }}>
                {usersError}
              </div>
            )}

            {(usersLoading) && (
              <div style={{ marginBottom: 10, fontSize: 13, color: '#666' }}>Cargando usuarios…</div>
            )}

            <div className="table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Es líder</th>
                    <th>Líder</th>
                    <th>Phone</th>
                    <th>Referencia</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => {
                      const term = normalizeText(usersFilter);
                      if (!term) return true;
                      return normalizeText(u.name).includes(term);
                    })
                    .map((u) => {
                      const isProtected = isProtectedUserEmail(u.email);
                      const edits = userEdits[u.id] || {
                        is_leader: u.is_leader,
                        leader: u.leader,
                        reference: u.reference,
                      };
                      const saving = !!userSaving[u.id];
                      return (
                        <tr key={u.id}>
                          <td style={{ minWidth: 180 }}>{u.name || '—'}</td>
                          <td style={{ minWidth: 220 }}>{u.email || '—'}</td>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!edits.is_leader}
                              disabled={isProtected}
                              onChange={(e) => upsertUserEdits(u.id, { is_leader: e.target.checked })}
                            />
                          </td>
                          <td style={{ minWidth: 240, paddingRight: 20 }}>
                            <input
                              className="cell-input"
                              type="text"
                              value={edits.leader ?? ''}
                              disabled={isProtected}
                              onChange={(e) => upsertUserEdits(u.id, { leader: e.target.value })}
                              placeholder="leader"
                            />
                          </td>
                          <td style={{ minWidth: 170 }}>{u.phone || '—'}</td>
                          <td style={{ minWidth: 250, paddingRight: 24 }}>
                            <input
                              className="cell-input"
                              type="text"
                              value={edits.reference ?? ''}
                              disabled={isProtected}
                              onChange={(e) => upsertUserEdits(u.id, { reference: e.target.value })}
                              placeholder="reference"
                            />
                          </td>
                          <td style={{ whiteSpace: 'nowrap', paddingLeft: 12 }}>
                            <button
                              type="button"
                              className="small-btn primary"
                              disabled={saving || isProtected}
                              onClick={() => saveUserRow(u.id)}
                            >
                              {isProtected ? 'Protegido' : saving ? 'Guardando…' : 'Guardar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
              <div style={{ fontSize: 13, color: '#666' }}>
                Cargados: {users.length}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="small-btn secondary"
                  disabled={usersLoading || usersLoadingMore}
                  onClick={() => loadUsersPage({ reset: true })}
                >
                  Recargar
                </button>
                <button
                  type="button"
                  className="small-btn primary"
                  disabled={!usersHasMore || usersLoadingMore || usersLoading || !usersLastDoc}
                  onClick={() => loadUsersPage({ reset: false })}
                >
                  {usersLoadingMore ? 'Cargando…' : usersHasMore ? 'Cargar más' : 'Sin más'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainApp;
