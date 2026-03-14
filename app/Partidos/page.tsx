"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy } from "firebase/firestore";

export default function RegistrarPartido() {
  // Estado para la protección
  const [autenticado, setAutenticado] = useState(false);
  const [claveInput, setClaveInput] = useState("");

  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  const [equipos, setEquipos] = useState<string[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [partido, setPartido] = useState({ 
    local: "", visitante: "", 
    golesLocal: 0, golesVisitante: 0, 
    goleadoresLocal: "", goleadoresVisitante: "", 
    mvp: "" 
  });
  const [cargando, setCargando] = useState(false);

  const intentarAcceso = () => {
    if (claveInput === "COPOL2026*") {
      setAutenticado(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  useEffect(() => {
    if (!autenticado) return;
    const qEquipos = query(collection(db, "equipos"), where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria));
    const unsubEquipos = onSnapshot(qEquipos, (s) => setEquipos(s.docs.map(d => d.data().nombre)));

    const qPartidos = query(collection(db, "partidos"), where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria), orderBy("fecha", "desc"));
    const unsubPartidos = onSnapshot(qPartidos, (s) => setPartidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubEquipos(); unsubPartidos(); };
  }, [config, autenticado]);

  const guardar = async () => {
    if (!partido.local || !partido.visitante) { alert("Selecciona ambos equipos"); return; }
    setCargando(true);
    try {
      await addDoc(collection(db, "partidos"), { ...partido, ...config, fecha: new Date().toISOString() });
      setPartido({ local: "", visitante: "", golesLocal: 0, golesVisitante: 0, goleadoresLocal: "", goleadoresVisitante: "", mvp: "" });
    } catch (e) { alert("Error: " + e); }
    setCargando(false);
  };

  const confirmarBorrar = async (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar este resultado?")) {
      await deleteDoc(doc(db, "partidos", id));
    }
  };

  // PANTALLA DE LOGIN
  if (!autenticado) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div style={{ backgroundColor: "#1e293b", padding: "40px", borderRadius: "20px", textAlign: "center", border: "1px solid #fbbf24", maxWidth: "400px", width: "100%" }}>
          <h2 style={{ color: "white", marginBottom: "20px" }}>🏆 Registro de Partidos</h2>
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={claveInput}
            onChange={(e) => setClaveInput(e.target.value)}
            style={inputStyle}
          />
          <button onClick={intentarAcceso} style={btnGold}>INGRESAR</button>
        </div>
      </div>
    );
  }

  // CONTENIDO PROTEGIDO
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <h1 style={{ color: "#fbbf24", textAlign: "center", marginBottom: "20px" }}>🏆 REGISTRO DE PARTIDOS</h1>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
           <select style={selectStyle} onChange={(e) => setConfig({...config, genero: e.target.value})}>{["Varones", "Damas"].map(o => <option key={o} value={o}>{o}</option>)}</select>
           <select style={selectStyle} onChange={(e) => setConfig({...config, deporte: e.target.value})}>{["Futbol", "Volley", "Basket"].map(o => <option key={o} value={o}>{o}</option>)}</select>
           <select style={selectStyle} onChange={(e) => setConfig({...config, categoria: e.target.value})}>{["Inferior", "Intermedia", "Superior"].map(o => <option key={o} value={o}>{o}</option>)}</select>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <select style={selectStyle} value={partido.local} onChange={(e) => setPartido({...partido, local: e.target.value})}>
                <option value="">Local</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <input type="number" style={scoreInput} value={partido.golesLocal === 0 ? "" : partido.golesLocal} onChange={(e) => setPartido({...partido, golesLocal: e.target.value === "" ? 0 : parseInt(e.target.value)})} />
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#475569" }}>VS</div>
            <div style={{ textAlign: "center" }}>
              <select style={selectStyle} value={partido.visitante} onChange={(e) => setPartido({...partido, visitante: e.target.value})}>
                <option value="">Visitante</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <input type="number" style={scoreInput} value={partido.golesVisitante === 0 ? "" : partido.golesVisitante} onChange={(e) => setPartido({...partido, golesVisitante: e.target.value === "" ? 0 : parseInt(e.target.value)})} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input style={inputStyle} placeholder="Goleadores Local" value={partido.goleadoresLocal} onChange={(e) => setPartido({...partido, goleadoresLocal: e.target.value})} />
            <input style={inputStyle} placeholder="Goleadores Visitante" value={partido.goleadoresVisitante} onChange={(e) => setPartido({...partido, goleadoresVisitante: e.target.value})} />
            <input style={inputStyle} placeholder="MVP del Partido" value={partido.mvp} onChange={(e) => setPartido({...partido, mvp: e.target.value})} />
          </div>
          <button onClick={guardar} disabled={cargando} style={btnGold}>{cargando ? "Guardando..." : "PUBLICAR RESULTADO"}</button>
        </div>

        <h2 style={{marginTop: "40px", color: "#fbbf24"}}>Historial de Partidos</h2>
        {partidos.map(p => (
          <div key={p.id} style={{...cardStyle, marginBottom: "10px", padding: "15px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
            <div>
              <div style={{fontWeight: "bold"}}>{p.local} {p.golesLocal} - {p.golesVisitante} {p.visitante}</div>
              <div style={{fontSize: "0.75rem", color: "#94a3b8"}}>MVP: {p.mvp}</div>
            </div>
            <button onClick={() => confirmarBorrar(p.id)} style={{backgroundColor: "#7f1d1d", color: "#fee2e2", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer"}}>Borrar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: "#1e293b", padding: "20px", borderRadius: "16px", border: "1px solid #334155" };
const selectStyle = { padding: "10px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid #475569", width: "100%", marginTop: "5px" };
const inputStyle = { padding: "12px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid #475569", width: "100%" };
const scoreInput = { width: "80px", padding: "10px", textAlign: "center" as const, borderRadius: "8px", background: "#fbbf24", color: "#0f172a", fontWeight: "900", border: "none", marginTop: "10px", fontSize: "1.5rem" };
const btnGold = { padding: "15px", borderRadius: "8px", background: "#fbbf24", color: "#0f172a", fontWeight: "bold", cursor: "pointer", border: "none", width: "100%", marginTop: "20px" };