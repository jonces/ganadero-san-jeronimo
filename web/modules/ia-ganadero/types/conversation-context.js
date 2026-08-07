/**
 * Tipos del sistema de contexto de conversación.
 * Cada conversación carga automáticamente estos datos al iniciarse.
 * La IA los recibirá como contexto del sistema al conectarse.
 */

/**
 * @typedef {Object} FincaContext
 * @property {string}   id          - UUID de la finca
 * @property {string}   nombre      - Nombre comercial de la finca
 * @property {string}   codigo      - Código corto (ej. "FSJ-001")
 * @property {string}   pais        - País (ej. "Nicaragua")
 * @property {string}   departamento - Departamento / estado
 * @property {string}   municipio   - Municipio / ciudad
 * @property {number}   hectareas   - Extensión total en hectáreas
 * @property {string[]} tipos       - Tipos de producción (ej. ["carne", "leche"])
 * @property {number}   animalesTotal - Cantidad total de animales activos
 */

/**
 * @typedef {Object} EmpresaContext
 * @property {string}  id       - UUID de la empresa
 * @property {string}  nombre   - Razón social
 * @property {string}  ruc      - RUC / NIT / número fiscal
 * @property {string}  pais     - País de registro
 * @property {string}  plan     - Plan de suscripción (ej. "pro", "enterprise")
 * @property {boolean} activa   - Si la empresa está activa
 */

/**
 * @typedef {Object} UsuarioContext
 * @property {string}   id        - UUID del usuario
 * @property {string}   nombre    - Nombre completo
 * @property {string}   email     - Correo electrónico
 * @property {string[]} roles     - Lista de ROL del usuario en la finca activa
 * @property {string}   rolPrincipal - Rol de mayor jerarquía
 */

/**
 * @typedef {Object} LocalizacionContext
 * @property {string} idioma      - IDIOMA (ej. "es")
 * @property {string} moneda      - MONEDA (ej. "NIO")
 * @property {string} zonaHoraria - ZONA_HORARIA (ej. "America/Managua")
 * @property {string} formatoFecha - Formato de fecha (ej. "DD/MM/YYYY")
 * @property {string} separadorDecimal - "." o ","
 */

/**
 * Contexto completo que se adjunta a cada conversación.
 * Se construye automáticamente al crear/seleccionar una conversación.
 *
 * @typedef {Object} ConversationContext
 * @property {string}              resolvedAt   - ISO timestamp de cuando se resolvió
 * @property {string}              version      - Versión del schema ("1.0")
 * @property {FincaContext}        finca        - Datos de la finca activa
 * @property {EmpresaContext}      empresa      - Datos de la empresa propietaria
 * @property {UsuarioContext}      usuario      - Datos del usuario autenticado
 * @property {LocalizacionContext} localizacion - Idioma, moneda, zona horaria
 */
