import React, { useEffect, useState } from 'react';

function MainApp() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('');
  const [filterColony, setFilterColony] = useState('');
  const [filterDuplicated, setFilterDuplicated] = useState(null);
  const [filteredTexts, setFilteredTexts] = useState([]);
  const [showClearButton, setShowClearButton] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('https://scanner-texts-app.onrender.com/texts')
      .then(res => res.json())
      .then(data => {
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
        !sectionTerm || (text.seccion && text.seccion.toLowerCase().startsWith(sectionTerm));
      const matchesColony =
        !colonyTerm || (text.colonia && text.colonia.toLowerCase().startsWith(colonyTerm));
      const matchesDuplicated =
        filterDuplicated === null || duplicated === filterDuplicated;

      return matchesSection && matchesColony && matchesDuplicated;
    });

    setFilteredTexts(filtered);
  };

  const handleClearFilter = () => {
    setFilterSection('');
    setFilterColony('');
    setFilterDuplicated(null);
    setFilteredTexts(texts);
  };

  const toggleStatus = (id, newStatus) => {
    fetch(`https://scanner-texts-app.onrender.com/texts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then(res => res.json())
      .then(updatedText => {
        setTexts(prev =>
          prev.map(t => (t.id === updatedText.id ? { ...t, status: updatedText.status } : t))
        );
        setFilteredTexts(prev =>
          prev.map(t => (t.id === updatedText.id ? { ...t, status: updatedText.status } : t))
        );
      })
      .catch(() => alert('Error updating status'));
  };

  // Reapply filters whenever texts, duplicated filter, or inputs change
  useEffect(() => {
    applyFilters();
  }, [texts, filterDuplicated, filterSection, filterColony]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: 20, textAlign: 'left' }}>📋 INES Escaneadas</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Sección"
          value={filterSection}
          onChange={e => setFilterSection(e.target.value)}
          style={{ padding: 8, borderRadius: 5, border: '1px solid #ccc', width: 120 }}
        />
        <input
          type="text"
          placeholder="Colonia"
          value={filterColony}
          onChange={e => setFilterColony(e.target.value)}
          style={{ padding: 8, borderRadius: 5, border: '1px solid #ccc', width: 120 }}
        />
        <button
          onClick={handleClearFilter}
          style={{ padding: '8px 16px', borderRadius: 5, backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Limpiar
        </button>

        <button
          onClick={() => setFilterDuplicated(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 5,
            backgroundColor: filterDuplicated === true ? '#dc3545' : '#f8d7da',
            color: filterDuplicated === true ? 'white' : '#721c24',
            border: '1px solid #dc3545',
            cursor: 'pointer'
          }}
        >
          Duplicados
        </button>
        <button
          onClick={() => setFilterDuplicated(false)}
          style={{
            padding: '8px 16px',
            borderRadius: 5,
            backgroundColor: filterDuplicated === false ? '#28a745' : '#d4edda',
            color: filterDuplicated === false ? 'white' : '#155724',
            border: '1px solid #28a745',
            cursor: 'pointer'
          }}
        >
          No Duplicados
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center' }}>⏳ Cargando datos...</p>}
      {!loading && filteredTexts.length === 0 && <p style={{ textAlign: 'center' }}>No texts found.</p>}

      {!loading && filteredTexts.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 0 5px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f1f1f1' }}>
              <tr>
                {['Nombre', 'Domicilio', 'Teléfono', 'Sección', 'Colonia', 'Petición', 'Estatus', 'Referencia', 'Creado por'].map(header => (
                  <th key={header} style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #ccc' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTexts.map(({ id, text, status }) => (
                <tr key={id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}>
                  <td style={{ padding: 8 }}>{text.nombre || 'N/A'}</td>
                  <td style={{ padding: 8 }}>{text.domicilio || 'N/A'}</td>
                  <td style={{ padding: 8 }}>{text.telefono || 'N/A'}</td>
                  <td style={{ padding: 8 }}>{text.seccion || 'N/A'}</td>
                  <td style={{ padding: 8 }}>{text.colonia || 'N/A'}</td>
                  <td style={{ padding: 8 }}>{text.peticion || 'N/A'}</td>
                  <td style={{ padding: 8 }}>
                    <button
                      onClick={() => toggleStatus(id, !status)}
                      style={{
                        backgroundColor: status ? '#28a745' : '#dc3545',
                        color: 'white',
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer'
                      }}
                    >
                      {status ? 'Completado' : 'Pendiente'}
                    </button>
                  </td>
                  <td style={{ padding: 8 }}>{text.referencia || 'N/A'}</td>
                  <td style={{ padding: 8 }}>{text.creadopor || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MainApp;
