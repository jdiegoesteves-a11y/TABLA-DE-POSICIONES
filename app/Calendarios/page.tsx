"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

export default function CalendarioPro() {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  
  // Incluimos hora en el estado del formulario
  const [nuevoPartido, setNuevoPartido] = useState({ local: "", visitante: "", fecha: "", hora: "" });

  useEffect(() => {
    const qE = query(collection(db, "equipos"), 
      where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria)
    );
    return onSnapshot(qE, (s) => setEquipos(s.docs.map(d => d.data().nombre)));
  }, [config]);

  useEffect(() => {
    const qC = query(collection(db, "calendario"), 
      where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria),
      orderBy("fecha", "asc")
    );
    return onSnapshot(qC, (s) => setEventos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [config]);

  const agendar = async () => {
    if (!nuevoPartido.local || !nuevoPartido.visitante || !nuevoPartido.fecha || !nuevoPartido.hora) {
      alert("Por favor, completa Local, Visitante, Fecha y HORA.");
      return;
    }
    setCargando(true);
    await addDoc(collection(db, "calendario"), { ...nuevoPartido, ...config });
    setNuevoPartido({ local: "", visitante: "", fecha: "", hora: "" });
    setCargando(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", color: "#fbbf24" }}>📅 PROGRAMACIÓN</h1>

        {/* SELECTORES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          <select style={inputStyle} value={config.genero} onChange={(e) => setConfig({...config, genero: e.target.value})}>
            <option value="Varones">Varones</option><option value="Damas">Damas</option>
          </select>
          <select style={inputStyle} value={config.deporte} onChange={(e) => setConfig({...config, deporte: e.target.value})}>
            <option value="Futbol">Futbol</option><option value="Volley">Volley</option><option value="Basket">Basket</option>
          </select>
          <select style={inputStyle} value={config.categoria} onChange={(e) => setConfig({...config, categoria: e.target.value})}>
            <option value="Inferior">Inferior</option><option value="Intermedia">Intermedia</option><option value="Superior">Superior</option>
          </select>
        </div>

        {/* AGENDAR CON HORA */}
        <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "10px", border: "1px solid #fbbf24" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <select style={inputStyle} value={nuevoPartido.local} onChange={(e) => setNuevoPartido({...nuevoPartido, local: e.target.value})}>
              <option value="">Local</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select style={inputStyle} value={nuevoPartido.visitante} onChange={(e) => setNuevoPartido({...nuevoPartido, visitante: e.target.value})}>
              <option value="">Visitante</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <input type="date" style={inputStyle} value={nuevoPartido.fecha} onChange={(e) => setNuevoPartido({...nuevoPartido, fecha: e.target.value})} />
            <input type="time" style={inputStyle} value={nuevoPartido.hora} onChange={(e) => setNuevoPartido({...nuevoPartido, hora: e.target.value})} />
          </div>
          <button onClick={agendar} style={btnStyle}>AGENDAR PARTIDO</button>
        </div>

        {/* LISTA CON HORA */}
        <div style={{ marginTop: "20px" }}>
          {eventos.map(ev => (
            <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "#1e293b", borderRadius: "8px", marginBottom: "5px" }}>
              <div>
                <div style={{ fontWeight: "bold" }}>{ev.local} vs {ev.visitante}</div>
                <div style={{ fontSize: "0.8rem", color: "#fbbf24" }}>{ev.fecha} a las {ev.hora} hs</div>
              </div>
              <button onClick={() => deleteDoc(doc(db, "calendario", ev.id))} style={{color: "#ff4444", background: "none", border: "none", cursor: "pointer"}}>Eliminar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white" };
const btnStyle = { width: "100%", padding: "12px", backgroundColor: "#fbbf24", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" };