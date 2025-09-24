import React, { useEffect, useState } from "react";

function MainApp() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterSection, setFilterSection] = useState("");
  const [filterColony, setFilterColony] = useState("");
  const [filterDuplicated, setFilterDuplicated] = useState("all"); 
  // "all" | "duplicated" | "notDuplicated"

  useEffect(() => {
    fetch("https://scanner-texts-app.onrender.com/texts")
      .then((res) => res.json())
      .then((data) => {
        setTexts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleClearFilter = () => {
    setFilterSection("");
    setFilterColony("");
    setFilterDuplicated("all");
  };

  const filteredTexts = texts.filter(({ text, duplicated }) => {
    const sectionTerm = filterSection.trim().toLowerCase();
    const colonyTerm = filterColony.trim().toLowerCase();

    const matchesSection =
      !sectionTerm ||
      (text.seccion && text.seccion.toLowerCase().includes(sectionTerm));

    const matchesColony =
      !colonyTerm ||
      (text.colonia && text.colonia.toLowerCase().includes(colonyTerm));

    let matchesDuplicated = true;
    if (filterDuplicated === "duplicated") {
      matchesDuplicated = duplicated === true;
    } else if (filterDuplicated === "notDuplicated") {
      matchesDuplicated = duplicated === false;
    }

    return matchesSection && matchesColony && matchesDuplicated;
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Lista de Escaneos</h2>

      {/* 🔍 Filters */}
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

        <button
          onClick={handleClearFilter}
          style={{ marginRight: 16 }}
        >
          Limpiar filtros
        </button>

        {/* 🔘 Duplicated filters */}
        <button
          onClick={() => setFilterDuplicated("all")}
          style={{
            marginRight: 8,
            backgroundColor: filterDuplicated === "all" ? "#007bff" : "#ccc",
            color: "white",
            padding: "6px 12px",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterDuplicated("duplicated")}
          style={{
            marginRight: 8,
            backgroundColor: filterDuplicated === "duplicated" ? "#28a745" : "#ccc",
            color: "white",
            padding: "6px 12px",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Duplicados
        </button>
        <button
          onClick={() => setFilterDuplicated("notDuplicated")}
          style={{
            backgroundColor: filterDuplicated === "notDuplicated" ? "#dc3545" : "#ccc",
            color: "white",
            padding: "6px 12px",
            border: "none",
            borderRadius: "4px",
          }}
        >
          No Duplicados
        </button>
      </div>

      {/* 📊 Results counter */}
      <p>
        Mostrando <strong>{filteredTexts.length}</strong> de{" "}
        {texts.length} registros
      </p>

      {/* 🕑 Loading */}
      {loading && <p>Cargando...</p>}
      {!loading && filteredTexts.length === 0 && <p>No se encontraron registros.</p>}

      {/* 📋 Table */}
      <table
        border="1"
        cellPadding="8"
        cellSpacing="0"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Domicilio</th>
            <th>Teléfono</th>
            <th>Sección</th>
            <th>Colonia</th>
            <th>Petición</th>
            <th>Estado</th>
            <th>Referencia</th>
            <th>Creado por</th>
          </tr>
        </thead>
        <tbody>
          {filteredTexts.map(({ id, text, status }) => (
            <tr key={id}>
              <td>{text.nombre || "N/A"}</td>
              <td>{text.domicilio || "N/A"}</td>
              <td>{text.telefono || "N/A"}</td>
              <td>{text.seccion || "N/A"}</td>
              <td>{text.colonia || "N/A"}</td>
              <td>{text.peticion || "N/A"}</td>
              <td style={{ color: status ? "green" : "red" }}>
                {status ? "Resuelto" : "Sin resolver"}
              </td>
              <td>{text.referencia || "N/A"}</td>
              <td>{text.creadopor || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MainApp;
