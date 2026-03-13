"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from "firebase/firestore";

export default function Calendario() {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [programados, setProgramados] = useState<any[]>([]);
  const [nuevoPartido, setNuevoPartido] = useState({
    local: "",
    visitante: "",
    fecha: "",
    hora: ""
  });

  // 1. Cargar equipos para los select y partidos programados
  useEffect(() => {
    const unsubE = onSnapshot(collection(db, "equipos"), (s) => {
      setEquipos(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    // Traemos el calendario ordenado por fecha
    const qCalendario = query(collection(db, "calendario"), orderBy("fecha", "asc"));
    const unsubC = onSnapshot(qCalendario, (s) => {
      setProgramados(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubE(); unsubC(); };
  }, []);

  const agendarPartido = async () => {
    if (!nuevoPartido.local || !nuevoPartido.visitante || !nuevoPartido.fecha) {
      alert("Por favor completa los equipos y la fecha");
      return;
    }
    await addDoc(collection(db, "calendario"), nuevoPartido);
    alert("Partido agendado con éxito");
  };

  const eliminarAgendado = async (id: string) => {
    if (confirm("¿Eliminar este partido del calendario?")) {
      await deleteDoc(doc(db, "calendario", id));
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5", padding: "40px 20px", color: "#1e293b", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "20px" }}>
          <a href="/" style={{ color: "#475569", textDecoration: "underline" }}>← Volver al Dashboard</a>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", border: "2px solid #1e293b" }}>
          <h1 style={{ textAlign: "center", marginBottom: "20px" }}>📅 Programar Calendario</h1>

          {/* FORMULARIO DE REGISTRO */}
          <div style={{ display: "grid", gap: "15px", marginBottom: "30px" }}>
            <select 
              style={{ padding: "12px", borderRadius: "6px", border: "2px solid #1e293b" }}
              onChange={(e) => setNuevoPartido({...nuevoPartido, local: e.target.value})}
            >
              <option value="">Seleccionar Local</option>
              {equipos.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>

            <select 
              style={{ padding: "12px", borderRadius: "6px", border: "2px solid #1e293b" }}
              onChange={(e) => setNuevoPartido({...nuevoPartido, visitante: e.target.value})}
            >
              <option value="">Seleccionar Visitante</option>
              {equipos.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>

            <div style={{ display: "flex", gap: "10px" }}>
              <input 
                type="date" 
                style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "2px solid #1e293b" }}
                onChange={(e) => setNuevoPartido({...nuevoPartido, fecha: e.target.value})}
              />
              <input 
                type="time" 
                style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "2px solid #1e293b" }}
                onChange={(e) => setNuevoPartido({...nuevoPartido, hora: e.target.value})}
              />
            </div>

            <button 
              onClick={agendarPartido}
              style={{ backgroundColor: "#1e293b", color: "#fff", padding: "15px", borderRadius: "6px", border: "none", fontWeight: "bold", cursor: "pointer" }}
            >
              Agendar Partido
            </button>
          </div>

          <hr />

          {/* LISTA DE PRÓXIMOS PARTIDOS */}
          <h2 style={{ fontSize: "1.2rem", margin: "20px 0" }}>Próximos Encuentros</h2>
          {programados.length === 0 && <p style={{ color: "#64748b" }}>No hay partidos programados.</p>}
          
          {programados.map((p) => (
            <div key={p.id} style={{ 
              backgroundColor: "#f8fafc", 
              padding: "15px", 
              borderRadius: "8px", 
              marginBottom: "10px", 
              border: "1px solid #cbd5e1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{p.local} vs {p.visitante}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>🗓️ {p.fecha} | ⏰ {p.hora || "Por definir"}</div>
              </div>
              <button 
                onClick={() => eliminarAgendado(p.id)}
                style={{ backgroundColor: "#ef4444", color: "white", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}