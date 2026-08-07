"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getProgreso, getCursoContent, saveCursoContent, marcarLeccionCompletada, addHistorial, addTiempoEstudio } from "../services/academia-storage.js";
import { generateCursoContent, generateExamen } from "../services/content-generator.js";

/**
 * Hook para el visor de un curso individual.
 * Maneja generación de contenido, navegación de lecciones y progreso.
 */
export function useCurso(curso) {
  const [content,        setContent]        = useState(null);
  const [leccionActual,  setLeccionActual]  = useState(0);
  const [progreso,       setProgreso]       = useState(null);
  const [generando,      setGenerando]      = useState(false);
  const [error,          setError]          = useState(null);
  const [examen,         setExamen]         = useState(null);
  const [generandoExamen,setGenerandoExamen]= useState(false);

  // Timer para medir tiempo de estudio
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const stopTimer = useCallback(() => {
    if (startTimeRef.current) {
      const secs = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (secs > 5) addTiempoEstudio(curso.id, secs);
      startTimeRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, [curso.id]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!curso) return;

    // Cargar progreso y contenido
    const prog = getProgreso(curso.id);
    setProgreso(prog);
    setLeccionActual(prog.leccionActual ?? 0);
    addHistorial(curso.id, "abierto");

    const cached = getCursoContent(curso.id);
    if (cached) {
      setContent(cached);
    } else {
      generarContenido();
    }

    startTimer();
    return () => { stopTimer(); };
  }, [curso?.id]);

  const generarContenido = useCallback(async () => {
    if (!curso) return;
    setGenerando(true);
    setError(null);
    try {
      const data = await generateCursoContent(curso);
      saveCursoContent(curso.id, data);
      setContent(data);
    } catch (err) {
      setError(`No se pudo generar el contenido: ${err.message}`);
    } finally {
      setGenerando(false);
    }
  }, [curso]);

  const irLeccion = useCallback((idx) => {
    if (!content?.lecciones) return;
    const clamped = Math.max(0, Math.min(idx, content.lecciones.length - 1));
    setLeccionActual(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [content]);

  const completarLeccion = useCallback((idx) => {
    if (!content?.lecciones) return;
    const resultado = marcarLeccionCompletada(curso.id, idx, content.lecciones.length);
    const prog = getProgreso(curso.id);
    setProgreso(prog);
    return resultado; // "completado" | null
  }, [curso, content]);

  const generarExamenFn = useCallback(async () => {
    if (!curso) return;
    setGenerandoExamen(true);
    try {
      const ex = await generateExamen(curso, content);
      setExamen(ex);
    } catch (err) {
      setError(`No se pudo generar el examen: ${err.message}`);
    } finally {
      setGenerandoExamen(false);
    }
  }, [curso, content]);

  const leccionData = content?.lecciones?.[leccionActual] ?? null;
  const totalLecciones = content?.lecciones?.length ?? curso?.lecciones ?? 0;
  const isLast = leccionActual >= totalLecciones - 1;
  const isFirst = leccionActual === 0;

  return {
    content,
    leccionData,
    leccionActual,
    totalLecciones,
    progreso,
    generando,
    error,
    examen,
    generandoExamen,
    isFirst,
    isLast,
    irLeccion,
    completarLeccion,
    generarExamen: generarExamenFn,
    regenerarContenido: generarContenido,
  };
}
