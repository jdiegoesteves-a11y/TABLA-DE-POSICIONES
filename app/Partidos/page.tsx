"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";

export default function RegistrarPartido() {
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  const [equipos, setEquipos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  
  const [partido, setPartido] = useState({
    local: "",
    visitante: "",
    golesLocal: 0,
    golesVisitante: 0,
    goleadoresLocal: "",
    goleadoresVisitante: "",
    mvp: ""
  });

  // Cargar solo los equipos que corresponden al deporte y género seleccionado
  useEffect(() => {
    const q = query(
      collection(db, "equipos"),
      where("genero", "==", config.genero),
      where("deporte", "==", config.deporte)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setEquipos(snapshot.docs.map(d => d.data().nombre));
    });
    return () => unsub();
  }, [config.genero, config.deporte]);

  const guardarPartido = async () => {
    if (!partido.local || !partido.visitante || partido.local === partido.visitante) {
      alert("Selecciona dos equipos diferentes");
      return;
    }
    setCargando(true);
    try {
      await addDoc(collection(db, "partidos"), {
        ...partido,
        ...config,
        fechaRegistro: new Date().toISOString()
      });
      alert("✅ Resultado guardado correctamente");
      // Limpiar marcador pero mantener la config de categoría
      setPartido({ ...partido, golesLocal: 0, golesVisitante: 0, goleadoresLocal: "", goleadoresVisitante: "", mvp: "" });
    } catch (e) {
      alert("Error al guardar");
    }
    setCargando(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#1e293b", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "1.5rem", color: "#fbbf24", margin: "0" }}>🏆 Panel de Resultados</h1>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Administración de Torneo Profesional</p>
        </div>

        {/* SELECTORES DE CATEGORÍA */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "25px" }}>
          <div style={groupStyle}>
            <label style={labelStyle}>Género</label>
            <select style={selectStyle} onChange={(e) => setConfig({...config, genero: e.target.value})}>
              <option value="Varones">Varones</option>
              <option value="Damas">Damas</option>
            </select>
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Deporte</label>
            <select style={selectStyle} onChange={(e) => setConfig({...config, deporte: e.target.value})}>
              <option value="Futbol">Fútbol</option>
              <option value="Volley">Volley</option>
              <option value="Basket">Basket</option>
            </select>
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Categoría</label>
            <select style={selectStyle} onChange={(e) => setConfig({...config, categoria: e.target.value})}>
              <option value="Inferior">Inferior</option>
              <option value="Intermedia">Intermedia</option>
            </select>
          </div>
        </div>

        <hr style={{ border: "0.5px solid #334155", marginBottom: "25px" }} />

        {/* MARCADOR EN VIVO */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <label style={labelStyle}>Local</label>
            <select style={selectStyle} value={partido.local} onChange={(e) => setPartido({...partido, local: e.target.value})}>
              <option value="">Seleccionar</option>
              {equipos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input type="number" style={scoreInput} value={partido.golesLocal} onChange={(e) => setPartido({...partido, golesLocal: Number(e.target.value)})} />
          </div>

          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#475569", marginTop: "25px" }}>VS</div>

          <div style={{ flex: 1, textAlign: "center" }}>
            <label style={labelStyle}>Visitante</label>
            <select style={selectStyle} value={partido.visitante} onChange={(e) => setPartido({...partido, visitante: e.target.value})}>
              <option value="">Seleccionar</option>
              {equipos.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input type="number" style={scoreInput} value={partido.golesVisitante} onChange={(e) => setPartido({...partido, golesVisitante: Number(e.target.value)})} />
          </div>
        </div>

        {/* DETALLES EXTRA */}
        <div style={{ marginBottom: "15px" }}>
          <label style={labelStyle}>Goleadores Local (Ej: Juan(2), Pedro(1))</label>
          <input style={inputFull} type="text" value={partido.goleadoresLocal} onChange={(e) => setPartido({...partido, goleadoresLocal: e.target.value})} placeholder="Nombre(goles), Nombre(goles)..." />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label style={labelStyle}>Goleadores Visitante</label>
          <input style={inputFull} type="text" value={partido.goleadoresVisitante} onChange={(e) => setPartido({...partido, goleadoresVisitante: e.target.value})} placeholder="Nombre(goles), Nombre(goles)..." />
        </div>
        <div style={{ marginBottom: "25px" }}>
          <label style={labelStyle}>MVP del Partido</label>
          <input style={inputFull} type="text" value={partido.mvp} onChange={(e) => setPartido({...partido, mvp: e.target.value})} placeholder="Nombre del mejor jugador" />
        </div>

        <button 
          onClick={guardarPartido} 
          disabled={cargando}
          style={{ 
            width: "100%", padding: "15px", borderRadius: "8px", border: "none", 
            backgroundColor: cargando ? "#475569" : "#fbbf24", 
            color: "#0f172a", fontWeight: "bold", fontSize: "1rem", cursor: "pointer",
            transition: "0.3s"
          }}
        >
          {cargando ? "Guardando..." : "PUBLICAR RESULTADO"}
        </button>
      </div>
    </div>
  );
}

// ESTILOS EN OBJETOS
const groupStyle = { display: "flex", flexDirection: "column" as const, gap: "5px" };
const labelStyle = { fontSize: "0.75rem", color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase" as const };
const selectStyle = { padding: "10px", borderRadius: "6px", backgroundColor: "#0f172a", color: "#fff", border: "1px solid #334155", outline: "none" };
const inputFull = { width: "100%", padding: "12px", borderRadius: "6px", backgroundColor: "#0f172a", color: "#fff", border: "1px solid #334155", boxSizing: "border-box" as const };
const scoreInput = { width: "60px", padding: "10px", marginTop: "10px", textAlign: "center" as const, borderRadius: "6px", backgroundColor: "#fbbf24", color: "#0f172a", border: "none", fontWeight: "bold", fontSize: "1.2rem" };