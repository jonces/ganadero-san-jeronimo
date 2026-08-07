"use client";
import { IAProvider }   from "../../modules/ia-ganadero/index.js";
import { CentroIAShell } from "../../modules/ia-ganadero/components/CentroIAShell.js";

export default function CentroIAPage() {
  return (
    <IAProvider>
      <CentroIAShell />
    </IAProvider>
  );
}
