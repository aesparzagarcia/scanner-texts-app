import React, { useEffect, useState } from 'react';

function MainApp() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('');
  const [filterColony, setFilterColony] = useState('');
  const [filterDuplicated, setFilterDuplicated] = useState(null);
  const [filteredTexts, setFilteredTexts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10; // ✅ show 10 per page

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
        !sectionTerm || (text.seccion && text.seccion.toLowerCase().includes(sectionTerm));
      const matchesColony =
        !colonyTerm || (text.colonia && text.colonia.toLowerCase().includes(colonyTerm));
      const matchesDuplicated =
        filterDuplicated === null || duplicated === filterDuplicated;

      return matchesSection && matchesColony && matchesDuplicated;
    });

    setFilteredTexts(filtered);
    setCurrentPage(1); // reset page when filters change
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

  useEffect(() => applyFilters(), [filterDuplicated, texts]);

  // ✅ pagination logic
  const totalItems = filteredTexts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = filteredTexts.slice(startIndex, endIndex);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: 20, textAlign: 'left' }}>📋 INES Escaneadas</h1>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Sección"
          value={filterSection}
          onChange={e => setFilterSection(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', width: 100, fontSize: 14 }}
        />
        <input
          type="text"
          placeholder="Colonia"
          value={filterColony}
          onChange={e => setFilterColony(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', width: 150, fontSize: 14 }}
        />

        <button
          onClick={() => setFilterDuplicated(true)}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            backgroundColor: filterDuplicated === true ? '#dc3545' : '#f8d7da',
            color: filterDuplicated === true ? 'white' : '#721c24',
            border: '1px solid #dc3545',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Duplicados
        </button>

        <button
          onClick={() => setFilterDuplicated(false)}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            backgroundColor: filterDuplicated === false ? '#28a745' : '#d4edda',
            color: filterDuplicated === false ? 'white' : '#155724',
            border: '1px solid #28a745',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          No Duplicados
        </button>

        <button
          onClick={handleClearFilter}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Limpiar
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center' }}>⏳ Cargando datos...</p>}
      {!loading && currentItems.length === 0 && <p style={{ textAlign: 'center' }}>No texts found.</p>}

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
                  {['Nombre', 'Domicilio', 'Teléfono', 'Sección', 'Colonia', 'Petición', 'Estatus', 'Referencia', 'Creado por'].map(header => (
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
    </div>
  );
}

export default MainApp;
