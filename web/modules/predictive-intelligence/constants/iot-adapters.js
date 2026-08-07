/**
 * Adaptadores IoT — arquitectura preparada para integración futura.
 * RFID, GPS, Drones, Básculas electrónicas, Sensores, Cámaras inteligentes.
 * No implementados todavía. Cada adaptador define el contrato de interfaz.
 */

export const IOT_ADAPTER_TYPE = {
  RFID:    "rfid",
  GPS:     "gps",
  DRONE:   "drone",
  BASCULA: "bascula",
  SENSOR:  "sensor",
  CAMARA:  "camara",
  CLIMA:   "clima_api",
  MERCADO: "mercado_api",
};

/**
 * Interfaz base para todos los adaptadores IoT.
 * Implementar este contrato al conectar dispositivos reales.
 */
export class IoTAdapterBase {
  constructor(tipo, config = {}) {
    this.tipo     = tipo;
    this.config   = config;
    this.conectado = false;
    this.estado   = "desconectado"; // desconectado | conectando | activo | error
  }

  async conectar()       { throw new Error("No implementado"); }
  async desconectar()    { this.conectado = false; this.estado = "desconectado"; }
  async leerDatos()      { throw new Error("No implementado"); }
  getEstado()            { return { tipo: this.tipo, conectado: this.conectado, estado: this.estado }; }
  isDisponible()         { return false; }
}

/**
 * Stub: Lector RFID para identificación de animales.
 * Retorna datos simulados hasta que el hardware esté conectado.
 */
export class RFIDAdapter extends IoTAdapterBase {
  constructor(config) { super(IOT_ADAPTER_TYPE.RFID, config); }
  isDisponible()     { return false; }
  async leerDatos()  { return []; } // [{ animalId, tag, timestamp, ubicacion }]
}

/**
 * Stub: GPS para rastreo de animales en potrero.
 */
export class GPSAdapter extends IoTAdapterBase {
  constructor(config) { super(IOT_ADAPTER_TYPE.GPS, config); }
  isDisponible()     { return false; }
  async leerDatos()  { return []; } // [{ animalId, lat, lng, timestamp }]
}

/**
 * Stub: Báscula electrónica para pesaje automático.
 */
export class BásculaAdapter extends IoTAdapterBase {
  constructor(config) { super(IOT_ADAPTER_TYPE.BASCULA, config); }
  isDisponible()     { return false; }
  async leerDatos()  { return []; } // [{ animalId, peso, timestamp }]
}

/**
 * Stub: Sensores ambientales (temperatura, humedad, UV).
 */
export class SensorAmbientalAdapter extends IoTAdapterBase {
  constructor(config) { super(IOT_ADAPTER_TYPE.SENSOR, config); }
  isDisponible()     { return false; }
  async leerDatos()  { return {}; } // { temperatura, humedad, uv, timestamp }
}

/**
 * Stub: API de clima — se conectará a OpenWeatherMap u otro proveedor.
 */
export class ClimaApiAdapter extends IoTAdapterBase {
  constructor(config) { super(IOT_ADAPTER_TYPE.CLIMA, config); }
  isDisponible()     { return false; }
  async leerDatos()  { return null; } // { tempMax, tempMin, lluvia, humedad, alertas }
}

/**
 * Stub: API de precios de mercado ganadero.
 */
export class MercadoApiAdapter extends IoTAdapterBase {
  constructor(config) { super(IOT_ADAPTER_TYPE.MERCADO, config); }
  isDisponible()     { return false; }
  async leerDatos()  { return null; } // { precioKgCarne, precioLitroLeche, precioConcentrado }
}

/**
 * Registro central de adaptadores IoT activos.
 * Los motores predictivos consultan este registro para enriquecer predicciones.
 */
export const IoTRegistry = {
  _adapters: new Map(),

  register(tipo, adapter) {
    this._adapters.set(tipo, adapter);
  },

  get(tipo) {
    return this._adapters.get(tipo) ?? null;
  },

  getDisponibles() {
    return [...this._adapters.values()].filter(a => a.isDisponible());
  },

  isConectado(tipo) {
    return this._adapters.get(tipo)?.isDisponible() ?? false;
  },

  getEstados() {
    return [...this._adapters.entries()].map(([tipo, a]) => ({
      tipo,
      ...a.getEstado(),
      etiqueta: IOT_LABELS[tipo] ?? tipo,
    }));
  },
};

export const IOT_LABELS = {
  rfid:        "RFID — Identificación Animal",
  gps:         "GPS — Rastreo en Potrero",
  drone:       "Dron — Monitoreo Aéreo",
  bascula:     "Báscula Electrónica",
  sensor:      "Sensores Ambientales",
  camara:      "Cámaras Inteligentes",
  clima_api:   "API de Clima",
  mercado_api: "API de Mercado",
};

// Pre-registrar todos los stubs al cargar el módulo
IoTRegistry.register(IOT_ADAPTER_TYPE.RFID,    new RFIDAdapter({}));
IoTRegistry.register(IOT_ADAPTER_TYPE.GPS,     new GPSAdapter({}));
IoTRegistry.register(IOT_ADAPTER_TYPE.BASCULA, new BásculaAdapter({}));
IoTRegistry.register(IOT_ADAPTER_TYPE.SENSOR,  new SensorAmbientalAdapter({}));
IoTRegistry.register(IOT_ADAPTER_TYPE.CLIMA,   new ClimaApiAdapter({}));
IoTRegistry.register(IOT_ADAPTER_TYPE.MERCADO, new MercadoApiAdapter({}));
