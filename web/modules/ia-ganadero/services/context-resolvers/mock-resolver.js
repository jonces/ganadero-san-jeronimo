import { ContextResolver }  from "../context-resolver.js";
import { ROL, IDIOMA, MONEDA, ZONA_HORARIA } from "../../constants/context.js";

/**
 * Resolver de demostración con datos hardcodeados.
 * Se activa en desarrollo y cuando no hay sesión real.
 * Sustituir por ApiResolver al integrar el backend.
 */
export class MockContextResolver extends ContextResolver {
  id = "mock";

  // Fincas disponibles para simular el selector de finca
  #fincas = [
    {
      id:            "finca-001",
      nombre:        "Finca San Jerónimo",
      codigo:        "FSJ-001",
      pais:          "Nicaragua",
      departamento:  "Chontales",
      municipio:     "Juigalpa",
      hectareas:     320,
      tipos:         ["carne", "doble propósito"],
      animalesTotal: 34,
    },
    {
      id:            "finca-002",
      nombre:        "El Paraíso",
      codigo:        "ELP-002",
      pais:          "Nicaragua",
      departamento:  "Boaco",
      municipio:     "Boaco",
      hectareas:     180,
      tipos:         ["leche"],
      animalesTotal: 21,
    },
  ];

  #activeFincaId = "finca-001";

  async initialize() {
    // Mock: sin inicialización real
  }

  async resolveFinca() {
    await delay(40);
    return this.#fincas.find(f => f.id === this.#activeFincaId) ?? this.#fincas[0];
  }

  async resolveEmpresa() {
    await delay(40);
    return {
      id:     "empresa-001",
      nombre: "Ganadería San Jerónimo S.A.",
      ruc:    "J0310000000001",
      pais:   "Nicaragua",
      plan:   "pro",
      activa: true,
    };
  }

  async resolveUsuario() {
    await delay(40);
    return {
      id:            "usuario-001",
      nombre:        "Jonster Celestino Henríquez",
      email:         "jhonces20@gmail.com",
      roles:         [ROL.ADMIN, ROL.VETERINARIO],
      rolPrincipal:  ROL.ADMIN,
    };
  }

  async resolveLocalizacion() {
    await delay(40);
    return {
      idioma:            IDIOMA.ES,
      moneda:            MONEDA.NIO,
      zonaHoraria:       ZONA_HORARIA.MANAGUA,
      formatoFecha:      "DD/MM/YYYY",
      separadorDecimal:  ".",
    };
  }

  async switchFinca(fincaId) {
    const existe = this.#fincas.some(f => f.id === fincaId);
    if (!existe) throw new Error(`Finca "${fincaId}" no encontrada`);
    this.#activeFincaId = fincaId;
    return this.resolve();
  }

  /** Lista de fincas a las que tiene acceso el usuario (para el selector) */
  async listFincas() {
    await delay(40);
    return this.#fincas;
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
