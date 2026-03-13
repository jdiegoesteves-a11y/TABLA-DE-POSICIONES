"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from "firebase/firestore";

export default function Equipos() {
  const [nombre, setNombre] = useState("");
  const [filtro, setFiltro] = useState({ genero: "Varones", deporte: "Futbol" });
  const [equipos, setEquipos] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "equipos"), 
      where("genero", "==", filtro.genero),
      where("deporte", "==", filtro.deporte)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setEquipos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [filtro]);

  const agregar = async () => {
    if (!nombre.trim()) return;
    await addDoc(collection(db, "equipos"), { ...filtro, nombre: nombre.trim() });
    setNombre("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Gestionar Equipos</h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <select onChange={(e) => setFiltro({...filtro, genero: e.target.value})}>
          <option value="Varones">Varones</option>
          <option value="Damas">Damas</option>
        </select>
        <select onChange={(e) => setFiltro({...filtro, deporte: e.target.value})}>
          <option value="Futbol">Futbol</option>
          <option value="Volley">Volley</option>
          <option value="Basket">Basket</option>
        </select>
      </div>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del equipo" style={{ padding: "10px", width: "70%" }} />
      <button onClick={agregar} style={{ padding: "10px" }}>Agregar</button>
      
      <ul>
        {equipos.map(e => (
          <li key={e.id}>{e.nombre} <button onClick={() => deleteDoc(doc(db, "equipos", e.id))}>x</button></li>
        ))}
      </ul>
    </div>
  );
}