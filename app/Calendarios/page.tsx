"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";

// --- ESTILOS COMPARTIDOS ---
const inputStyle = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "white", marginBottom: "10px", fontSize: "0.9rem" };
const btnStyle = { width: "100%", padding: "12px", backgroundColor: "#fbbf24", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", color: "#0f172a", transition: "0.3s" };
const cardStyle = { backgroundColor: "#1e293b", padding: "20px", borderRadius: "16px", border: "1px solid #334155" };
const navBtn = (active: boolean) => ({ padding: "10px 15px", backgroundColor: active ? "#fbbf24" : "#1e293b", color: active ? "#0f172a" : "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", flex: 1 });

export default function AdminPanel() {
  const [autenticado, setAutenticado] = useState(false);
  const [claveInput, setClaveInput] = useState("");
  const [seccion, setSeccion] = useState("equipos"); // equipos | partidos | calendario

  const intentarAcceso = () => {
    if (claveInput === "COPOL2026*") setAutenticado(true);
    else alert("Contraseña incorrecta");
  };

  if (!autenticado) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
        <div style={{ backgroundColor: "#1e293b", padding: "40px", borderRadius: "20px", textAlign: "center", border: "1px solid #fbbf24", maxWidth: "400px", width: "100%" }}>
          <h2 style={{ color: "white", marginBottom: "20px" }}>🔒 Panel Administrativo</h2>
          <input type="password" placeholder="Contraseña" value={claveInput} onChange={(e) => setClaveInput(e.target.value)} style={inputStyle} />
          <button onClick={intentarAcceso} style={btnStyle}>INGRESAR</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "650px", margin: "0 auto" }}>
        
        {/* NAVEGACIÓN */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "30px", backgroundColor: "#1e293b", padding: "10px", borderRadius: "12px" }}>
          <button style={navBtn(seccion === "equipos")} onClick={() => setSeccion("equipos")}>🛡️ EQUIPOS</button>
          <button style={navBtn(seccion === "partidos")} onClick={() => setSeccion("partidos")}>🏆 PARTIDOS</button>
          <button style={navBtn(seccion === "calendario")} onClick={() => setSeccion("calendario")}>📅 CALENDARIO</button>
        </div>

        {/* RENDERIZADO DINÁMICO */}
        {seccion === "equipos" && <EquiposComponent />}
        {seccion === "partidos" && <PartidosComponent />}
        {seccion === "calendario" && <CalendarioComponent />}

      </div>
    </div>
  );
}

// --- SUB-COMPONENTE EQUIPOS ---
function EquiposComponent() {
  const [nombre, setNombre] = useState("");
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  const [equipos, setEquipos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "equipos"), where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria));
    return onSnapshot(q, (snapshot) => setEquipos(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [config]);

  const agregar = async () => {
    if (!nombre.trim()) return;
    setCargando(true);
    await addDoc(collection(db, "equipos"), { nombre: nombre.trim(), ...config, fechaCreacion: new Date().toISOString() });
    setNombre("");
    setCargando(false);
  };

  return (
    <div>
      <h2 style={{ color: "#fbbf24", textAlign: "center" }}>GESTIÓN DE CLUBES</h2>
      <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        {["genero", "deporte", "categoria"].map(k => (
          <select key={k} style={inputStyle} value={(config as any)[k]} onChange={(e) => setConfig({...config, [k]: e.target.value})}>
            {k === "genero" && <><option value="Varones">Varones</option><option value="Damas">Damas</option></>}
            {k === "deporte" && <><option value="Futbol">Fútbol</option><option value="Volley">Volley</option><option value="Basket">Basket</option></>}
            {k === "categoria" && <><option value="Inferior">Inferior</option><option value="Intermedia">Intermedia</option><option value="Superior">Superior</option></>}
          </select>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Nuevo equipo..." value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <button onClick={agregar} disabled={cargando} style={{ ...btnStyle, width: "auto" }}>{cargando ? "..." : "REGISTRAR"}</button>
      </div>
      <div style={cardStyle}>
        {equipos.map(e => (
          <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #334155" }}>
            <span>{e.nombre}</span>
            <button onClick={() => deleteDoc(doc(db, "equipos", e.id))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE PARTIDOS ---
function PartidosComponent() {
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  const [equipos, setEquipos] = useState<string[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [partido, setPartido] = useState({ local: "", visitante: "", golesLocal: 0, golesVisitante: 0, goleadoresLocal: "", goleadoresVisitante: "", mvp: "" });

  useEffect(() => {
    const qE = query(collection(db, "equipos"), where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria));
    onSnapshot(qE, (s) => setEquipos(s.docs.map(d => d.data().nombre)));
    const qP = query(collection(db, "partidos"), where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria), orderBy("fecha", "desc"));
    onSnapshot(qP, (s) => setPartidos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [config]);

  const guardar = async () => {
    await addDoc(collection(db, "partidos"), { ...partido, ...config, fecha: new Date().toISOString() });
    setPartido({ local: "", visitante: "", golesLocal: 0, golesVisitante: 0, goleadoresLocal: "", goleadoresVisitante: "", mvp: "" });
  };

  return (
    <div>
      <h2 style={{ color: "#fbbf24", textAlign: "center" }}>RESULTADOS</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <select style={inputStyle} onChange={(e) => setConfig({...config, genero: e.target.value})}><option value="Varones">Varones</option><option value="Damas">Damas</option></select>
        <select style={inputStyle} onChange={(e) => setConfig({...config, deporte: e.target.value})}><option value="Futbol">Futbol</option><option value="Volley">Volley</option><option value="Basket">Basket</option></select>
        <select style={inputStyle} onChange={(e) => setConfig({...config, categoria: e.target.value})}><option value="Inferior">Inferior</option><option value="Intermedia">Intermedia</option><option value="Superior">Superior</option></select>
      </div>
      <div style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", alignItems: "center" }}>
          <select style={inputStyle} value={partido.local} onChange={(e) => setPartido({...partido, local: e.target.value})}><option value="">Local</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}</select>
          <span style={{ fontWeight: "bold" }}>VS</span>
          <select style={inputStyle} value={partido.visitante} onChange={(e) => setPartido({...partido, visitante: e.target.value})}><option value="">Visitante</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}</select>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <input type="number" placeholder="Goles L" style={inputStyle} onChange={(e) => setPartido({...partido, golesLocal: parseInt(e.target.value)})}/>
          <input type="number" placeholder="Goles V" style={inputStyle} onChange={(e) => setPartido({...partido, golesVisitante: parseInt(e.target.value)})}/>
        </div>
        <input style={inputStyle} placeholder="MVP" value={partido.mvp} onChange={(e) => setPartido({...partido, mvp: e.target.value})} />
        <button onClick={guardar} style={btnStyle}>PUBLICAR</button>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE CALENDARIO ---
function CalendarioComponent() {
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  const [equipos, setEquipos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [nuevo, setNuevo] = useState({ local: "", visitante: "", fecha: "", hora: "" });

  useEffect(() => {
    const qE = query(collection(db, "equipos"), where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria));
    onSnapshot(qE, (s) => setEquipos(s.docs.map(d => d.data().nombre)));
    const qC = query(collection(db, "calendario"), where("genero", "==", config.genero), where("deporte", "==", config.deporte), where("categoria", "==", config.categoria), orderBy("fecha", "asc"));
    onSnapshot(qC, (s) => setEventos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [config]);

  const agendar = async () => {
    await addDoc(collection(db, "calendario"), { ...nuevo, ...config });
    setNuevo({ local: "", visitante: "", fecha: "", hora: "" });
  };

  return (
    <div>
      <h2 style={{ color: "#fbbf24", textAlign: "center" }}>PROGRAMACIÓN</h2>
      <div style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <select style={inputStyle} value={nuevo.local} onChange={(e) => setNuevo({...nuevo, local: e.target.value})}><option value="">Local</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}</select>
          <select style={inputStyle} value={nuevo.visitante} onChange={(e) => setNuevo({...nuevo, visitante: e.target.value})}><option value="">Visitante</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}</select>
        </div>
        <input type="date" style={inputStyle} value={nuevo.fecha} onChange={(e) => setNuevo({...nuevo, fecha: e.target.value})} />
        <input type="time" style={inputStyle} value={nuevo.hora} onChange={(e) => setNuevo({...nuevo, hora: e.target.value})} />
        <button onClick={agendar} style={btnStyle}>AGENDAR</button>
      </div>
      <div style={{ marginTop: "20px" }}>
        {eventos.map(ev => (
          <div key={ev.id} style={{ ...cardStyle, marginBottom: "5px", display: "flex", justifyContent: "space-between" }}>
            <span>{ev.local} vs {ev.visitante} ({ev.fecha})</span>
            <button onClick={() => deleteDoc(doc(db, "calendario", ev.id))} style={{ color: "#ff4444", background: "none", border: "none" }}>✖</button>
          </div>
        ))}
      </div>
    </div>
  );
}