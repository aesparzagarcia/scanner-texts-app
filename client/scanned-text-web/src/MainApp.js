import React, { useEffect, useState } from "react";

function MainApp() {
  const [texts, setTexts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDuplicated, setFilterDuplicated] = useState("all"); 
  // "all" | "duplicated" | "notDuplicated"

  useEffect(() => {
    fetch("https://scanner-texts-app.onrender.com/texts")
      .then((res) => res.json())
      .then((data) => setTexts(data))
      .catch((err) => console.error("❌ Fetch error:", err));
  }, []);

  const filteredTexts = texts.filter(({ text, duplicated }) => {
    const matchesSearch = Object.values(text || {})
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    if (filterDuplicated === "duplicated") {
      return matchesSearch && duplicated;
    } else if (filterDuplicated === "notDuplicated") {
      return matchesSearch && !duplicated;
    }
    return matchesSearch; // "all"
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>Lista de Escaneos</h2>

      {/* 🔎 Search */}
      <input
        type="text"
        placeholder="Buscar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "8px", marginBottom: "12px", width: "300px" }}
      />

      {/* 🔘 Filter buttons */}
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => setFilterDuplicated("all")}
          style={{
            marginRight: "8px",
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
            marginRight: "8px",
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
