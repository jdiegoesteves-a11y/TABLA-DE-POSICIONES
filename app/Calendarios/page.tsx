"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

export default function CalendarioPro() {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  const [nuevoPartido, setNuevoPartido] = useState({ local: "", visitante: "", fecha: "", hora: "" });

  // 1. Cargar equipos filtrados
  useEffect(() => {
    const qE = query(
      collection(db, "equipos"),
      where("genero", "==", config.genero),
      where("deporte", "==", config.deporte),
      where("categoria", "==", config.categoria)
    );
    return onSnapshot(qE, (s) => setEquipos(s.docs.map(d => d.data().nombre)));
  }, [config]);

  // 2. Cargar calendario filtrado
  useEffect(() => {
    const qC = query(
      collection(db, "calendario"),
      where("genero", "==", config.genero),
      where("deporte", "==", config.deporte),
      where("categoria", "==", config.categoria),
      orderBy("fecha", "asc")
    );
    
    return onSnapshot(qC, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setEventos(data);
    }, (err) => console.error("Error al leer:", err));
  }, [config]);

  // 3. Función de Guardado (ELIMINAMOS EL ERROR DE ESCRITURA)
  const agendar = async () => {
    if (!nuevoPartido.local || !nuevoPartido.visitante || !nuevoPartido.fecha) {
      alert("Por favor, selecciona Local, Visitante y Fecha.");
      return;
    }
    setCargando(true);
    try {
      await addDoc(collection(db, "calendario"), {
        local: nuevoPartido.local,
        visitante: nuevoPartido.visitante,
        fecha: nuevoPartido.fecha,
        hora: nuevoPartido.hora,
        genero: config.genero,
        deporte: config.deporte,
        categoria: config.categoria
      });
      alert("✅ Partido guardado en: " + config.categoria);
      setNuevoPartido({ local: "", visitante: "", fecha: "", hora: "" });
    } catch (e) {
      alert("Error al guardar: " + e);
    }
    setCargando(false);
  };

  const eliminar = async (id: string) => {
    await deleteDoc(doc(db, "calendario", id));
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", color: "#fbbf24" }}>📅 GESTIÓN CALENDARIO</h1>

        {/* SELECTORES DE FILTRO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {["genero", "deporte", "categoria"].map((key) => (
            <select key={key} style={inputStyle} value={config[key as keyof typeof config]} 
              onChange={(e) => setConfig({...config, [key]: e.target.value})}>
              {key === "genero" && ["Varones", "Damas"].map(o => <option key={o} value={o}>{o}</option>)}
              {key === "deporte" && ["Futbol", "Volley", "Basket"].map(o => <option key={o} value={o}>{o}</option>)}
              {key === "categoria" && ["Inferior", "Intermedia", "Superior"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* AGENDAR */}
        <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "10px" }}>
          <select style={inputStyle} value={nuevoPartido.local} onChange={(e) => setNuevoPartido({...nuevoPartido, local: e.target.value})}>
            <option value="">Equipo Local</option>
            {equipos.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select style={inputStyle} value={nuevoPartido.visitante} onChange={(e) => setNuevoPartido({...nuevoPartido, visitante: e.target.value})}>
            <option value="">Equipo Visitante</option>
            {equipos.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input type="date" style={inputStyle} value={nuevoPartido.fecha} onChange={(e) => setNuevoPartido({...nuevoPartido, fecha: e.target.value})} />
          <button onClick={agendar} style={btnStyle} disabled={cargando}>{cargando ? "Guardando..." : "AGENDAR"}</button>
        </div>

        {/* LISTA */}
        <div style={{ marginTop: "20px" }}>
          {eventos.map(ev => (
            <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", padding: "15px", backgroundColor: "#1e293b", borderRadius: "8px", marginBottom: "5px" }}>
              <span>{ev.local} vs {ev.visitante} ({ev.fecha})</span>
              <button onClick={() => eliminar(ev.id)} style={{color: "#ff4444", background: "none", border: "none"}}>Eliminar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white" };
const btnStyle = { width: "100%", padding: "15px", backgroundColor: "#fbbf24", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" };