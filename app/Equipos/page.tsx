"use client";

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";

export default function Equipos() {
  const [nombre, setNombre] = useState("");
  const [equipos, setEquipos] = useState<any[]>([]);

  // Cargar equipos en tiempo real desde Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "equipos"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEquipos(lista);
    });
    return () => unsub();
  }, []);

  const agregarEquipo = async () => {
    if (!nombre.trim()) return;

    // Validación: Evitar duplicados
    const yaExiste = equipos.some(e => e.nombre.toLowerCase() === nombre.trim().toLowerCase());
    if (yaExiste) {
      alert("Este equipo ya está registrado.");
      return;
    }

    await addDoc(collection(db, "equipos"), { nombre: nombre.trim() });
    setNombre("");
  };

  const borrarEquipo = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este equipo?")) {
      await deleteDoc(doc(db, "equipos", id));
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5", padding: "40px 20px" }}>
      <div style={{ 
        maxWidth: "500px", 
        margin: "0 auto", 
        backgroundColor: "#ffffff", 
        padding: "30px", 
        borderRadius: "12px", 
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        border: "2px solid #1e293b"
      }}>
        
        {/* Enlace de retorno */}
        <div style={{ marginBottom: "20px" }}>
          <a href="/" style={{ color: "#475569", textDecoration: "underline", fontSize: "0.9rem" }}>← Volver al Dashboard</a>
        </div>

        <h1 style={{ color: "#1e293b", textAlign: "center", marginBottom: "20px" }}>⚽ Registrar Equipos</h1>

        {/* Input con contraste forzado */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Nombre del equipo..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ 
              flex: 1, 
              padding: "12px", 
              borderRadius: "6px", 
              border: "2px solid #1e293b", 
              backgroundColor: "#ffffff", 
              color: "#000000",
              outline: "none"
            }}
          />
          <button 
            onClick={agregarEquipo}
            style={{ 
              backgroundColor: "#1e293b", 
              color: "#ffffff", 
              padding: "12px 20px", 
              borderRadius: "6px", 
              border: "none", 
              cursor: "pointer", 
              fontWeight: "bold" 
            }}
          >
            Agregar
          </button>
        </div>

        <h2 style={{ color: "#475569", fontSize: "1.2rem", marginTop: "30px" }}>Equipos registrados</h2>
        
        <ul style={{ listStyle: "none", padding: 0 }}>
          {equipos.map((equipo) => (
            <li 
              key={equipo.id} 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                backgroundColor: "#f8fafc", 
                padding: "12px", 
                borderRadius: "6px", 
                marginBottom: "8px", 
                border: "1px solid #cbd5e1",
                color: "#1e293b", 
                fontWeight: "500" 
              }}
            >
              {equipo.nombre}
              <button 
                onClick={() => borrarEquipo(equipo.id)}
                style={{ 
                  backgroundColor: "#ef4444", 
                  color: "#ffffff", 
                  border: "none", 
                  borderRadius: "4px", 
                  padding: "6px 12px", 
                  cursor: "pointer", 
                  fontSize: "12px" 
                }}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}