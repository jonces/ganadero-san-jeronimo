/**
 * Adaptadores de protocolo para conexión con dispositivos físicos.
 * Arquitectura preparada para REST, WebSocket, MQTT, Bluetooth, WiFi, LoRa, 4G/5G.
 * Cada adapter implementa la interfaz: { conectar, leer, escribir, desconectar }.
 */

export class BaseAdapter {
  constructor(tipo, config = {}) {
    this.tipo      = tipo;
    this.config    = config;
    this.conectado = false;
    this.callbacks = { onData: null, onError: null, onStatus: null };
  }
  onData(fn)   { this.callbacks.onData   = fn; return this; }
  onError(fn)  { this.callbacks.onError  = fn; return this; }
  onStatus(fn) { this.callbacks.onStatus = fn; return this; }

  async conectar()      { this.conectado = false; throw new Error(`${this.tipo}: conectar() no implementado`); }
  async leer()          { throw new Error(`${this.tipo}: leer() no implementado`); }
  async escribir(_cmd)  { throw new Error(`${this.tipo}: escribir() no implementado`); }
  async desconectar()   { this.conectado = false; }
  isConectado()         { return this.conectado; }
}

/** Adapter REST — polling a un endpoint HTTP. */
export class RESTAdapter extends BaseAdapter {
  constructor(config) {
    super("rest", config);
    this._pollInterval = null;
  }
  async conectar() {
    // En producción: GET config.url + token auth header
    this.conectado = false; // stub — sin hardware real
    return false;
  }
  startPolling(intervalMs = 5000) {
    this._pollInterval = setInterval(() => this.leer(), intervalMs);
  }
  stopPolling() {
    clearInterval(this._pollInterval);
  }
  async leer() {
    // En producción: fetch(this.config.url) → parsea JSON → this.callbacks.onData(data)
    return null;
  }
}

/** Adapter WebSocket — stream bidireccional. */
export class WebSocketAdapter extends BaseAdapter {
  constructor(config) { super("websocket", config); this._ws = null; }
  async conectar() {
    // En producción: this._ws = new WebSocket(this.config.url)
    // this._ws.onmessage = e => this.callbacks.onData?.(JSON.parse(e.data))
    this.conectado = false;
    return false;
  }
  async escribir(cmd) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return false;
    this._ws.send(JSON.stringify(cmd));
    return true;
  }
  async desconectar() { this._ws?.close(); this.conectado = false; }
}

/** Adapter MQTT — pub/sub para IoT (vía MQTT over WebSocket). */
export class MQTTAdapter extends BaseAdapter {
  constructor(config) { super("mqtt", config); }
  async conectar() {
    // En producción: mqtt.connect(config.broker, { clientId, username, password })
    // client.subscribe(config.topic)
    // client.on("message", (topic, payload) => this.callbacks.onData?.(JSON.parse(payload)))
    this.conectado = false;
    return false;
  }
  async publicar(topic, payload) {
    // client.publish(topic, JSON.stringify(payload))
    return false;
  }
}

/** Adapter Bluetooth Web — para lectores RFID y básculas via BLE. */
export class BluetoothAdapter extends BaseAdapter {
  constructor(config) { super("bluetooth", config); this._device = null; }
  async conectar() {
    if (!navigator?.bluetooth) return false;
    // En producción:
    // this._device = await navigator.bluetooth.requestDevice({ filters: [...] })
    // const server = await this._device.gatt.connect()
    // leer características BLE → this.callbacks.onData(data)
    this.conectado = false;
    return false;
  }
}

/** Adapter LoRa — via gateway HTTP (The Things Network / ChirpStack). */
export class LoRaAdapter extends BaseAdapter {
  constructor(config) { super("lora", config); }
  async conectar() {
    // En producción: polling a TTN/ChirpStack HTTP Integration
    this.conectado = false;
    return false;
  }
}

/** Registry de adapters disponibles. */
export const AdapterRegistry = {
  _map: new Map(),
  register(deviceId, adapter) { this._map.set(deviceId, adapter); },
  get(deviceId)               { return this._map.get(deviceId) ?? null; },
  remove(deviceId)            { this._map.delete(deviceId); },
  getAll()                    { return [...this._map.entries()]; },
  getConnected()              { return [...this._map.values()].filter(a => a.isConectado()); },
};

/** Factory — crea el adapter adecuado según protocolo. */
export function createAdapter(protocolo, config) {
  switch (protocolo) {
    case "wifi":
    case "ethernet":
    case "4g":
    case "5g":       return new RESTAdapter(config);
    case "mqtt":     return new MQTTAdapter(config);
    case "bluetooth":return new BluetoothAdapter(config);
    case "lora":     return new LoRaAdapter(config);
    default:         return new RESTAdapter(config);
  }
}

/** Seguridad: genera token de dispositivo (firma básica — en prod usar JWT). */
export function generateDeviceToken(deviceId, secret = "sfh-secret") {
  const payload = `${deviceId}:${Date.now()}`;
  // En producción: usar crypto.subtle.sign() con HMAC-SHA256
  return btoa(payload);
}
