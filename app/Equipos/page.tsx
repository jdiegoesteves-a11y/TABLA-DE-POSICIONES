"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from "firebase/firestore";

export default function EquiposPro() {
  // Estado para la protección
  const [autenticado, setAutenticado] = useState(false);
  const [claveInput, setClaveInput] = useState("");

  const [nombre, setNombre] = useState("");
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  const [equipos, setEquipos] = useState<any[]>([]);
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
    const q = query(
      collection(db, "equipos"),
      where("genero", "==", config.genero),
      where("deporte", "==", config.deporte),
      where("categoria", "==", config.categoria)
    );
    return onSnapshot(q, (snapshot) => {
      setEquipos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [config, autenticado]);

  const agregarEquipo = async () => {
    if (!nombre.trim()) return;
    setCargando(true);
    try {
      await addDoc(collection(db, "equipos"), {
        nombre: nombre.trim(),
        ...config,
        fechaCreacion: new Date().toISOString()
      });
      setNombre("");
    } catch (error) {
      console.error("Error al agregar:", error);
    }
    setCargando(false);
  };

  const eliminarEquipo = async (id: string) => {
    if (confirm("¿Eliminar este equipo?")) {
      await deleteDoc(doc(db, "equipos", id));
    }
  };

  // PANTALLA DE LOGIN
  if (!autenticado) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div style={{ backgroundColor: "#1e293b", padding: "40px", borderRadius: "20px", textAlign: "center", border: "1px solid #fbbf24", maxWidth: "400px", width: "100%" }}>
          <h2 style={{ color: "white", marginBottom: "20px" }}>🛡️ Gestión de Clubes</h2>
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={claveInput}
            onChange={(e) => setClaveInput(e.target.value)}
            style={inputStyle}
          />
          <button onClick={intentarAcceso} style={btnStyle}>INGRESAR</button>
        </div>
      </div>
    );
  }

  // CONTENIDO PROTEGIDO
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "1.8rem", color: "#fbbf24", margin: "0" }}>🛡️ GESTIÓN DE CLUBES</h1>
        </div>

        <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", border: "1px solid #334155" }}>
          {["genero", "deporte", "categoria"].map((key) => (
            <div key={key} style={inputGroup}>
              <label style={labelStyle}>{key}</label>
              <select style={selectStyle} value={config[key as keyof typeof config]} onChange={(e) => setConfig({...config, [key]: e.target.value})}>
                {key === "genero" && <><option value="Varones">Varones</option><option value="Damas">Damas</option></>}
                {key === "deporte" && <><option value="Futbol">Fútbol</option><option value="Volley">Volley</option><option value="Basket">Basket</option></>}
                {key === "categoria" && <><option value="Inferior">Inferior</option><option value="Intermedia">Intermedia</option><option value="Superior">Superior</option></>}
              </select>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Nombre del nuevo equipo..." value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <button onClick={agregarEquipo} disabled={cargando} style={{ padding: "0 25px", borderRadius: "8px", border: "none", backgroundColor: "#fbbf24", color: "#0f172a", fontWeight: "bold", cursor: "pointer" }}>
            {cargando ? "..." : "REGISTRAR"}
          </button>
        </div>

        <div style={{ backgroundColor: "#1e293b", borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
          <div style={{ padding: "15px", backgroundColor: "#334155", color: "#fbbf24", fontWeight: "bold", textAlign: "center" }}>
            Equipos: {config.deporte} {config.genero} ({equipos.length})
          </div>
          {equipos.map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #334155" }}>
              <span>{e.nombre}</span>
              <button onClick={() => eliminarEquipo(e.id)} style={{ color: "#ef4444", background: "none", border: "1px solid #ef4444", padding: "4px 8px", cursor: "pointer" }}>ELIMINAR</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputGroup = { display: "flex", flexDirection: "column" as const, gap: "5px" };
const labelStyle = { fontSize: "0.7rem", color: "#94a3b8", fontWeight: "bold", textTransform: "uppercase" as const };
const selectStyle = { padding: "10px", borderRadius: "8px", backgroundColor: "#0f172a", color: "#fff", border: "1px solid #475569" };
const inputStyle = { padding: "12px", borderRadius: "8px", backgroundColor: "#0f172a", color: "#fff", border: "1px solid #475569", width: "100%" };
const btnStyle = { width: "100%", padding: "12px", backgroundColor: "#fbbf24", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#0f172a", marginTop: "10px" };