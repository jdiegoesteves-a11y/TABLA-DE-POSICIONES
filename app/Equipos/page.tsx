"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from "firebase/firestore";

export default function EquiposPro() {
  const [nombre, setNombre] = useState("");
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol" });
  const [equipos, setEquipos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  // Cargar equipos filtrados por deporte y género para mantener orden
  useEffect(() => {
    const q = query(
      collection(db, "equipos"),
      where("genero", "==", config.genero),
      where("deporte", "==", config.deporte)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setEquipos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [config]);

  const agregarEquipo = async () => {
    if (!nombre.trim()) return;
    setCargando(true);
    try {
      await addDoc(collection(db, "equipos"), {
        nombre: nombre.trim(),
        genero: config.genero,
        deporte: config.deporte,
        fechaCreacion: new Date().toISOString()
      });
      setNombre("");
    } catch (error) {
      console.error("Error al agregar:", error);
    }
    setCargando(false);
  };

  const eliminarEquipo = async (id: string) => {
    if (confirm("¿Eliminar este equipo de la base de datos?")) {
      await deleteDoc(doc(db, "equipos", id));
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        {/* ENCABEZADO PRO */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "1.8rem", color: "#fbbf24", margin: "0", letterSpacing: "1px" }}>🛡️ GESTIÓN DE CLUBES</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Registro Oficial de Equipos por Categoría</p>
        </div>

        {/* SELECTORES DE FILTRO Y ASIGNACIÓN */}
        <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", border: "1px solid #334155" }}>
          <div style={inputGroup}>
            <label style={labelStyle}>Género</label>
            <select style={selectStyle} value={config.genero} onChange={(e) => setConfig({...config, genero: e.target.value})}>
              <option value="Varones">Varones</option>
              <option value="Damas">Damas</option>
            </select>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Deporte</label>
            <select style={selectStyle} value={config.deporte} onChange={(e) => setConfig({...config, deporte: e.target.value})}>
              <option value="Futbol">Fútbol</option>
              <option value="Volley">Volley</option>
              <option value="Basket">Basket</option>
            </select>
          </div>
        </div>

        {/* INPUT DE REGISTRO */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
          <input 
            style={{ ...inputStyle, flex: 1 }} 
            placeholder="Nombre del nuevo equipo..." 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button 
            onClick={agregarEquipo}
            disabled={cargando}
            style={{ padding: "0 25px", borderRadius: "8px", border: "none", backgroundColor: "#fbbf24", color: "#0f172a", fontWeight: "bold", cursor: "pointer" }}
          >
            {cargando ? "..." : "REGISTRAR"}
          </button>
        </div>

        {/* LISTADO DE EQUIPOS REGISTRADOS */}
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
          <div style={{ padding: "15px", backgroundColor: "#334155", color: "#fbbf24", fontWeight: "bold", fontSize: "0.8rem", textTransform: "uppercase" }}>
            Equipos en {config.deporte} - {config.genero} ({equipos.length})
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {equipos.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No hay equipos registrados en esta categoría.</p>
            ) : (
              equipos.map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #334155" }}>
                  <span style={{ fontWeight: "500" }}>{e.nombre}</span>
                  <button 
                    onClick={() => eliminarEquipo(e.id)}
                    style={{ backgroundColor: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.7rem" }}
                  >
                    ELIMINAR
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ESTILOS PROFESIONALES
const inputGroup = { display: "flex", flexDirection: "column" as const, gap: "5px" };
const labelStyle = { fontSize: "0.7rem", color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase" as const };
const selectStyle = { padding: "12px", borderRadius: "8px", backgroundColor: "#0f172a", color: "#fff", border: "1px solid #475569", outline: "none" };
const inputStyle = { padding: "12px", borderRadius: "8px", backgroundColor: "#0f172a", color: "#fff", border: "1px solid #475569", outline: "none", fontSize: "1rem" };