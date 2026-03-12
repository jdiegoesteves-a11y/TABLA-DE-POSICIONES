"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";

export default function Partidos() {
  const [equipos, setEquipos] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  
  const [local, setLocal] = useState("");
  const [visitante, setVisitante] = useState("");
  const [golesLocal, setGolesLocal] = useState(0);
  const [golesVisitante, setGolesVisitante] = useState(0);
  const [goleadoresLocal, setGoleadoresLocal] = useState("");
  const [goleadoresVisitante, setGoleadoresVisitante] = useState("");
  const [mvp, setMvp] = useState("");

  useEffect(() => {
    const unsubEquipos = onSnapshot(collection(db, "equipos"), (snapshot) => {
      setEquipos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubPartidos = onSnapshot(collection(db, "partidos"), (snapshot) => {
      setPartidos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubEquipos(); unsubPartidos(); };
  }, []);

  const guardar = async () => {
    if (!local || !visitante || local === visitante) { alert("Elige equipos válidos"); return; }
    await addDoc(collection(db, "partidos"), { 
      local, visitante, 
      golesLocal: Number(golesLocal), 
      golesVisitante: Number(golesVisitante), 
      goleadoresLocal, goleadoresVisitante, mvp 
    });
    setGolesLocal(0); setGolesVisitante(0); setGoleadoresLocal(""); setGoleadoresVisitante(""); setMvp("");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#E5E7EB", padding: "40px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#FFFFFF", padding: "30px", border: "3px solid #000000" }}>
        
        <h1 style={{ color: "#000000", textAlign: "center", fontWeight: "900", marginBottom: "20px" }}>REGISTRAR PARTIDO</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <select onChange={(e) => setLocal(e.target.value)} style={inputStyle}>
            <option value="">EQUIPO LOCAL</option>
            {equipos.map((e) => <option key={e.id}>{e.nombre}</option>)}
          </select>
          <input type="number" placeholder="GOLES LOCAL" value={golesLocal} onChange={(e) => setGolesLocal(Number(e.target.value))} style={inputStyle} />
          <input type="text" placeholder="GOLEADORES LOCAL (Nombres)" value={goleadoresLocal} onChange={(e) => setGoleadoresLocal(e.target.value)} style={inputStyle} />
          
          <select onChange={(e) => setVisitante(e.target.value)} style={inputStyle}>
            <option value="">EQUIPO VISITANTE</option>
            {equipos.map((e) => <option key={e.id}>{e.nombre}</option>)}
          </select>
          <input type="number" placeholder="GOLES VISITANTE" value={golesVisitante} onChange={(e) => setGolesVisitante(Number(e.target.value))} style={inputStyle} />
          <input type="text" placeholder="GOLEADORES VISITANTE (Nombres)" value={goleadoresVisitante} onChange={(e) => setGoleadoresVisitante(e.target.value)} style={inputStyle} />
          
          <input type="text" placeholder="MVP DEL PARTIDO" value={mvp} onChange={(e) => setMvp(e.target.value)} style={inputStyle} />
          
          <button onClick={guardar} style={buttonStyle}>GUARDAR RESULTADO</button>
        </div>

        <h2 style={{ color: "#000000", fontWeight: "900", marginTop: "40px", borderBottom: "3px solid #000000" }}>HISTORIAL</h2>
        
        {partidos.map((p) => (
          <div key={p.id} style={{ 
            padding: "15px", border: "3px solid #000000", backgroundColor: "#FFFFFF",
            marginTop: "15px", fontWeight: "900", color: "#000000"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{p.local} {p.golesLocal} - {p.golesVisitante} {p.visitante}</span>
              <button onClick={() => deleteDoc(doc(db, "partidos", p.id))} style={deleteButtonStyle}>ELIMINAR</button>
            </div>
            <div style={{ fontSize: "13px", marginTop: "10px", borderTop: "2px solid #000", paddingTop: "8px" }}>
              <p>⚽ {p.local}: {p.goleadoresLocal || "---"}</p>
              <p>⚽ {p.visitante}: {p.goleadoresVisitante || "---"}</p>
              <p>⭐ MVP: {p.mvp || "---"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { 
  padding: "15px", border: "2px solid #000000", backgroundColor: "#FFFFFF", 
  color: "#000000", fontWeight: "900", fontSize: "16px" 
};
const buttonStyle: React.CSSProperties = { 
  padding: "15px", backgroundColor: "#000000", color: "#FFFFFF", 
  fontWeight: "900", cursor: "pointer", border: "none" 
};
const deleteButtonStyle: React.CSSProperties = { 
  backgroundColor: "#DC2626", color: "#FFFFFF", border: "2px solid #000000", 
  padding: "5px 10px", fontWeight: "900", cursor: "pointer" 
};