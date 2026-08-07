"use client";
import { useState, useCallback, useEffect } from "react";
import { revokeFileUrls } from "../utils/file-handler.js";
import { UPLOAD_STATUS }  from "../constants/files.js";

/**
 * Hook que gestiona la lista de archivos cargados en el chat.
 * No sube nada al servidor — solo mantiene el estado local.
 *
 * @returns {{
 *   files:      FileItem[],
 *   addFiles:   (items: FileItem[]) => void,
 *   removeFile: (id: string) => void,
 *   clearAll:   () => void,
 *   readyFiles: FileItem[],
 *   hasFiles:   boolean,
 *   hasErrors:  boolean,
 * }}
 */
export function useFileUpload() {
  const [files, setFiles] = useState([]);

  // Revoca blob URLs al desmontar para liberar memoria
  useEffect(() => {
    return () => revokeFileUrls(files);
  }, []); // eslint-disable-line

  const addFiles = useCallback((newItems) => {
    setFiles(prev => {
      // Evita duplicados por nombre + tamaño
      const existing = new Set(prev.map(f => `${f.name}|${f.size}`));
      const unique   = newItems.filter(i => !existing.has(`${i.name}|${i.size}`));
      return [...prev, ...unique];
    });
  }, []);

  const removeFile = useCallback((id) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target) revokeFileUrls([target]);
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setFiles(prev => { revokeFileUrls(prev); return []; });
  }, []);

  const readyFiles = files.filter(f => f.status === UPLOAD_STATUS.READY);
  const hasFiles   = files.length > 0;
  const hasErrors  = files.some(f => f.status === UPLOAD_STATUS.ERROR);

  return { files, addFiles, removeFile, clearAll, readyFiles, hasFiles, hasErrors };
}
