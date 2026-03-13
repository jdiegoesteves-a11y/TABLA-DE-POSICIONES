"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

export default function CalendarioPro() {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  
  const [config, setConfig] = useState({
    genero: "Varones",
    deporte: "Futbol",
    categoria: "Inferior"
  });

  const [nuevoPartido, setNuevoPartido] = useState({
    local: "",
    visitante: "",
    fecha: "",
    hora: ""
  });

  // 1. Cargar equipos filtrados para los selectores
  useEffect(() => {
    const qE = query(
      collection(db, "equipos"),
      where("genero", "==", config.genero),
      where("deporte", "==", config.deporte)
    );
    const unsubE = onSnapshot(qE, (s) => {
      setEquipos(s.docs.map(d => d.data().nombre));
    });

    // 2. Cargar calendario filtrado por los 3 criterios
    const qC = query(
      collection(db, "calendario"),
      where("genero", "==", config.genero),
      where("deporte", "==", config.deporte),
      where("categoria", "==", config.categoria),
      orderBy("fecha", "asc")
    );
    const unsubC = onSnapshot(qC, (s) => {
      setEventos(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubE(); unsubC(); };
  }, [config]);

  const agendar = async () => {
    if (!nuevoPartido.local || !nuevoPartido.visitante || !nuevoPartido.fecha) {
      alert("Completa los equipos y la fecha");
      return;
    }
    setCargando(true);
    try {
      await addDoc(collection(db, "calendario"), {
        ...nuevoPartido,
        ...config
      });
      alert("✅ Partido agendado");
      setNuevoPartido({ local: "", visitante: "", fecha: "", hora: "" });
    } catch (e) {
      alert("Error al agendar");
    }
    setCargando(false);
  };

  const eliminar = async (id: string) => {
    if (confirm("¿Eliminar este evento del calendario?")) {
      await deleteDoc(doc(db, "calendario", id));
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "650px", margin: "0 auto" }}>
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "1.8rem", color: "#fbbf24", margin: "0" }}>📅 CRONOGRAMA DE JUEGOS</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Programación de Fechas y Horarios</p>
        </div>

        {/* SELECTORES DE CATEGORÍA (FILTROS) */}
        <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "25px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", border: "1px solid #334155" }}>
          <div style={groupStyle}>
            <label style={labelStyle}>Género</label>
            <select style={selectStyle} value={config.genero} onChange={(e) => setConfig({...config, genero: e.target.value})}>
              <option value="Varones">Varones</option>
              <option value="Damas">Damas</option>
            </select>
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Deporte</label>
            <select style={selectStyle} value={config.deporte} onChange={(e) => setConfig({...config, deporte: e.target.value})}>
              <option value="Futbol">Fútbol</option>
              <option value="Volley">Volley</option>
              <option value="Basket">Basket</option>
            </select>
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Categoría</label>
            <select style={selectStyle} value={config.categoria} onChange={(e) => setConfig({...config, categoria: e.target.value})}>
              <option value="Inferior">Inferior</option>
              <option value="Intermedia">Intermedia</option>
              <option value="Superior">Superior</option>
            </select>
          </div>
        </div>

        {/* FORMULARIO DE AGENDAR */}
        <div style={{ backgroundColor: "#1e293b", padding: "25px", borderRadius: "12px", border: "1px solid #fbbf24", marginBottom: "30px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
            <select style={selectStyle} value={nuevoPartido.local} onChange={(e) => setNuevoPartido({...nuevoPartido, local: e.target.value})}>
              <option value="">Local</option>
              {equipos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select style={selectStyle} value={nuevoPartido.visitante} onChange={(e) => setNuevoPartido({...nuevoPartido, visitante: e.target.value})}>
              <option value="">Visitante</option>
              {equipos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <input type="date" style={selectStyle} value={nuevoPartido.fecha} onChange={(e) => setNuevoPartido({...nuevoPartido, fecha: e.target.value})} />
            <input type="time" style={selectStyle} value={nuevoPartido.hora} onChange={(e) => setNuevoPartido({...nuevoPartido, hora: e.target.value})} />
          </div>
          <button onClick={agendar} disabled={cargando} style={btnGold}>
            {cargando ? "Agendando..." : "AGENDAR PARTIDO"}
          </button>
        </div>

        {/* LISTADO DE PRÓXIMOS PARTIDOS */}
        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
          <div style={{ padding: "15px", backgroundColor: "#334155", color: "#fbbf24", fontWeight: "bold", textAlign: "center", fontSize: "0.8rem" }}>
            PARTIDOS PROGRAMADOS - {config.categoria.toUpperCase()}
          </div>
          {eventos.length === 0 ? (
            <p style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>No hay partidos para esta selección.</p>
          ) : (
            eventos.map((ev) => (
              <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: "1px solid #334155" }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{ev.local} vs {ev.visitante}</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>🗓️ {ev.fecha} | ⏰ {ev.hora || "TBD"}</div>
                </div>
                <button onClick={() => eliminar(ev.id)} style={{ color: "#ef4444", background: "none", border: "1px solid #ef4444", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.7rem" }}>
                  ELIMINAR
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ESTILOS REUTILIZABLES
const groupStyle = { display: "flex", flexDirection: "column" as const, gap: "5px" };
const labelStyle = { fontSize: "0.7rem", color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase" as const };
const selectStyle = { padding: "12px", borderRadius: "8px", backgroundColor: "#0f172a", color: "#fff", border: "1px solid #475569", outline: "none", width: "100%" };
const btnGold = { width: "100%", padding: "15px", borderRadius: "8px", border: "none", backgroundColor: "#fbbf24", color: "#0f172a", fontWeight: "bold", cursor: "pointer" };