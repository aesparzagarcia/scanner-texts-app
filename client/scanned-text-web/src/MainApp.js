import React, { useEffect, useState } from 'react';

function MainApp() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('');
  const [filterColony, setFilterColony] = useState('');
  const [filterDuplicated, setFilterDuplicated] = useState(null); // null = all, true = only duplicated, false = only not duplicated
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
        !sectionTerm || (text.seccion && text.seccion.toLowerCase().includes(sectionTerm));
      const matchesColony =
        !colonyTerm || (text.colonia && text.colonia.toLowerCase().includes(colonyTerm));
      const matchesDuplicated =
        filterDuplicated === null || duplicated === filterDuplicated;

      return matchesSection && matchesColony && matchesDuplicated;
    });

    setFilteredTexts(filtered);
  };

  const handleFilter = () => {
    applyFilters();
  };

  const handleClearFilter = () => {
    setFilterSection('');
    setFilterColony('');
    setFilterDuplicated(null);
    setFilteredTexts(texts);
  };

  const handleClearDatabase = () => {
    if (!window.confirm('Are you sure you want to clear the database? This action cannot be undone.')) return;

    fetch('https://scanner-texts-app.onrender.com/texts', { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setTexts([]);
          setFilteredTexts([]);
          alert('Database cleared!');
        } else {
          alert('Failed to clear database');
        }
      })
      .catch(() => alert('Error clearing database'));
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

  // React when duplicated filter changes
  useEffect(() => {
    applyFilters();
  }, [filterDuplicated, texts]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Info scaneada</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Filtrar por sección"
          value={filterSection}
          onChange={e => setFilterSection(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          placeholder="Filtrar por colonia"
          value={filterColony}
          onChange={e => setFilterColony(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={handleFilter} style={{ marginRight: 8 }}>
          Filtrar
        </button>
        <button onClick={handleClearFilter} style={{ marginRight: 16 }}>
          Limpiar filtro
        </button>

        <button onClick={() => setFilterDuplicated(true)} style={{ marginRight: 8 }}>
          Duplicados
        </button>
        <button onClick={() => setFilterDuplicated(false)} style={{ marginRight: 8 }}>
          No Duplicados
        </button>

        {showClearButton && (
          <button
            onClick={handleClearDatabase}
            style={{ backgroundColor: 'red', color: 'white' }}
          >
            Clear Database
          </button>
        )}
      </div>

      {loading && <p>⏳ Cargando datos...</p>}
      {!loading && filteredTexts.length === 0 && <p>No texts found.</p>}

      {!loading && filteredTexts.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          cellSpacing="0"
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Domicilio</th>
              <th>Teléfono</th>
              <th>Sección</th>
              <th>Colonia</th>
              <th>Petición</th>
              <th>Estatus</th>
              <th>Referencia</th>
              <th>Creado por</th>
            </tr>
          </thead>
          <tbody>
            {filteredTexts.map(({ id, text, status }) => (
              <tr key={id}>
                <td>{text.nombre || 'N/A'}</td>
                <td>{text.domicilio || 'N/A'}</td>
                <td>{text.telefono || 'N/A'}</td>
                <td>{text.seccion || 'N/A'}</td>
                <td>{text.colonia || 'N/A'}</td>
                <td>{text.peticion || 'N/A'}</td>
                <td>
                  <button
                    onClick={() => toggleStatus(id, !status)}
                    style={{
                      backgroundColor: status ? 'green' : 'red',
                      color: 'white',
                      padding: '4px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {status ? 'Completado' : 'Pendiente'}
                  </button>
                </td>
                <td>{text.referencia || 'N/A'}</td>
                <td>{text.creadopor || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MainApp;
