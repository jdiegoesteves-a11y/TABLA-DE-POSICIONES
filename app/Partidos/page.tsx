"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, query, where } from "firebase/firestore";

export default function RegistrarPartido() {
  const [config, setConfig] = useState({ genero: "Varones", deporte: "Futbol", categoria: "Inferior" });
  const [equipos, setEquipos] = useState<any[]>([]);
  const [partido, setPartido] = useState({ local: "", visitante: "", golesLocal: 0, golesVisitante: 0, goleadoresLocal: "", goleadoresVisitante: "", mvp: "" });

  useEffect(() => {
    const q = query(collection(db, "equipos"), 
      where("genero", "==", config.genero),
      where("deporte", "==", config.deporte)
    );
    const unsub = onSnapshot(q, (s) => setEquipos(s.docs.map(d => d.data().nombre)));
    return () => unsub();
  }, [config]);

  const guardar = async () => {
    await addDoc(collection(db, "partidos"), { ...partido, ...config });
    alert("Partido guardado!");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Registrar Resultado</h2>
      {/* Selectores de Categoría */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px", marginBottom: "20px" }}>
        <select onChange={(e) => setConfig({...config, genero: e.target.value})}>
          <option value="Varones">Varones</option>
          <option value="Damas">Damas</option>
        </select>
        <select onChange={(e) => setConfig({...config, deporte: e.target.value})}>
          <option value="Futbol">Futbol</option>
          <option value="Volley">Volley</option>
          <option value="Basket">Basket</option>
        </select>
        <select onChange={(e) => setConfig({...config, categoria: e.target.value})}>
          <option value="Inferior">Inferior</option>
          <option value="Intermedia">Intermedia</option>
        </select>
      </div>

      {/* Marcador */}
      <select onChange={(e) => setPartido({...partido, local: e.target.value})}><option>Local</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}</select>
      <input type="number" placeholder="Goles L" onChange={(e) => setPartido({...partido, golesLocal: Number(e.target.value)})} />
      <br />
      <select onChange={(e) => setPartido({...partido, visitante: e.target.value})}><option>Visitante</option>{equipos.map(n => <option key={n} value={n}>{n}</option>)}</select>
      <input type="number" placeholder="Goles V" onChange={(e) => setPartido({...partido, golesVisitante: Number(e.target.value)})} />
      
      <button onClick={guardar} style={{ width: "100%", marginTop: "20px", padding: "10px", backgroundColor: "#0f172a", color: "white" }}>Finalizar Partido</button>
    </div>
  );
}