import React, { useEffect, useState } from 'react';

function MainApp() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('');
  const [filterColony, setFilterColony] = useState('');
  const [filteredTexts, setFilteredTexts] = useState([]);
  const [showClearButton, setShowClearButton] = useState(false);

  useEffect(() => {
    fetch(`https://scanner-texts-app.onrender.com/texts`)
      .then(res => res.json())
      .then(data => {
        setTexts(data);
        setFilteredTexts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const parseMapString = (mapString) => {
    if (!mapString) return {};
    const cleanedString = mapString.trim().replace(/^\{|\}$/g, '');
    const regex = /(\w+)=((?:[^=,]|=(?!\w+=))+)/g;
    const obj = {};
    let match;
    while ((match = regex.exec(cleanedString)) !== null) {
      const key = match[1];
      const value = match[2].trim();
      obj[key] = value;
    }
    return obj;
  };

  const handleFilter = () => {
    const sectionTerm = filterSection.trim().toLowerCase();
    const colonyTerm = filterColony.trim().toLowerCase();

    const filtered = texts.filter(({ text }) => {
      const data = parseMapString(text);

      const matchesSection =
        !sectionTerm || (data.seccion && data.seccion.toLowerCase().includes(sectionTerm));

      const matchesColony =
        !colonyTerm || (data.colonia && data.colonia.toLowerCase().includes(colonyTerm));

      return matchesSection && matchesColony;
    });

    setFilteredTexts(filtered);
  };

  const handleClearFilter = () => {
    setFilterSection('');
    setFilterColony('');
    setFilteredTexts(texts);
  };

  const handleClearDatabase = () => {
    if (!window.confirm('Are you sure you want to clear the database? This action cannot be undone.')) return;
    fetch(`https://scanner-texts-app.onrender.com/texts`, { method: 'DELETE' })
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
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(updatedText => {
        setTexts(prev =>
          prev.map(t => t.id === updatedText.id ? { ...t, status: updatedText.status } : t)
        );
        setFilteredTexts(prev =>
          prev.map(t => t.id === updatedText.id ? { ...t, status: updatedText.status } : t)
        );
      })
      .catch(() => alert('Error updating status'));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Info scaneada</h1>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Filtrar por sección"
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          placeholder="Filtrar por colonia"
          value={filterColony}
          onChange={(e) => setFilterColony(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={handleFilter} style={{ marginRight: 8 }}>Filtrar</button>
        <button onClick={handleClearFilter} style={{ marginRight: 16 }}>Limpiar filtro</button>
        {showClearButton && (
          <button onClick={handleClearDatabase} style={{ backgroundColor: 'red', color: 'white' }}>
            Clear Database
          </button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {!loading && filteredTexts.length === 0 && <p>No texts found.</p>}

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
          {filteredTexts.map(({ id, text, status }) => {
            const data = parseMapString(text);
            return (
              <tr key={id}>
                <td>{data.nombre || 'N/A'}</td>
                <td>{data.domicilio || 'N/A'}</td>
                <td>{data.telefono || 'N/A'}</td>
                <td>{data.seccion || 'N/A'}</td>
                <td>{data.colonia || 'N/A'}</td>
                <td>{data.peticion || 'N/A'}</td>
                <td>
                  <button
                    onClick={() => toggleStatus(id, !status)}
                    style={{
                      backgroundColor: status ? 'green' : 'red',
                      color: 'white',
                      padding: '4px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {status ? 'Completado' : 'Pendiente'}
                  </button>
                </td>
                <td>{data.referencia || 'N/A'}</td>
                <td>{data.creadopor || 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MainApp;
