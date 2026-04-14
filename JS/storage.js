/**
 * Este archivo centraliza todas las operaciones de lectura y escritura
 * de datos en el localStorage del navegador. Todos los demás archivos
 * JS importan sus funciones desde aquí, lo que permite un único punto
 * de control sobre cómo se guardan y recuperan los datos.

/* ══════════════════════════════════════════════════════════
   CLAVES DE ALMACENAMIENTO
   Constantes que definen los nombres de las entradas en localStorage.
   Centralizarlas aquí evita errores de tipeo y facilita cambiarlas.
   ══════════════════════════════════════════════════════════ */
const DB_KEY      = "acme_bank_db";      // clave de la base de datos completa
const SESSION_KEY = "acme_bank_session"; // clave del ID del usuario en sesión

// Estructura inicial vacía cuando no existe base de datos en el navegador
const initialDB = { users: [] };

/* ══════════════════════════════════════════════════════════
   LECTURA DE LA BASE DE DATOS: getDB()
   Recupera y deserializa la base de datos desde localStorage.
   Si no existe o el JSON está corrupto, retorna la estructura
   inicial vacía para evitar errores en el resto de la app.
   ══════════════════════════════════════════════════════════ */
export const getDB = () => {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return structuredClone(initialDB); // primera vez: DB vacía
  try {
    const parsed = JSON.parse(raw);
    // Verificar que el arreglo de usuarios exista y sea válido
    if (!Array.isArray(parsed.users)) return structuredClone(initialDB);
    return parsed;
  } catch {
    // Si el JSON está dañado, retornar DB vacía como medida de seguridad
    return structuredClone(initialDB);
  }
};

/* ══════════════════════════════════════════════════════════
   ESCRITURA DE LA BASE DE DATOS: saveDB()
   Serializa el objeto de base de datos a JSON y lo guarda en
   localStorage. Se llama después de cada modificación de datos.
   ══════════════════════════════════════════════════════════ */
export const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

/* ══════════════════════════════════════════════════════════
   HASH DE CONTRASEÑA: hashPassword()
   Convierte una contraseña en texto plano a un hash SHA-256
   usando la Web Crypto API nativa del navegador (sin librerías).
   La contraseña nunca se almacena en texto plano; solo el hash.

   Proceso:
     1. Codifica el texto a bytes con TextEncoder (UTF-8)
     2. Aplica SHA-256 con crypto.subtle.digest()
     3. Convierte el buffer de bytes resultante a hexadecimal

   Es una función asíncrona porque crypto.subtle.digest()
   retorna una Promise.
   ══════════════════════════════════════════════════════════ */
export const hashPassword = async (value) => {
  const bytes  = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/* ══════════════════════════════════════════════════════════
   FORMATEADORES DE DATOS

   formatCurrency(): convierte un número al formato de moneda
   colombiana (COP) usando la API Intl del navegador.
   Ejemplo: 1500000 → "$ 1.500.000"

   formatDateTime(): convierte una fecha ISO 8601 al formato
   legible en español colombiano (dd/mm/aaaa, hh:mm a.m./p.m.)
   Si no se pasa argumento, usa la fecha y hora actuales.
   ══════════════════════════════════════════════════════════ */
export const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDateTime = (iso = new Date().toISOString()) =>
  new Date(iso).toLocaleString("es-CO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

/* ══════════════════════════════════════════════════════════
   GENERADORES DE IDENTIFICADORES ÚNICOS

   createAccountNumber(): genera un número de cuenta bancaria
   de 10 dígitos que siempre comienza por 1 (nunca por 0).
   Ejemplo: "3847291056"

   createReference(): genera una referencia de transacción con
   prefijo REF- seguido de 6 dígitos aleatorios.
   Ejemplo: "REF-483920"
   ══════════════════════════════════════════════════════════ */
export const createAccountNumber = () =>
  `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

export const createReference = () =>
  `REF-${Math.floor(100000 + Math.random() * 900000)}`;

/* ══════════════════════════════════════════════════════════
   BÚSQUEDA DE USUARIO: findUserByIdentity()
   Recorre el arreglo de usuarios y retorna el primero cuyo
   tipo Y número de identificación coincidan con los parámetros.
   Se usa en el login y en la recuperación de contraseña.
   Retorna null si no encuentra ninguna coincidencia.
   ══════════════════════════════════════════════════════════ */
export const findUserByIdentity = (idType, idNumber) => {
  const db = getDB();
  return db.users.find(
    (user) => user.idType === idType && user.idNumber === idNumber
  ) || null;
};

/* ══════════════════════════════════════════════════════════
   ACTUALIZACIÓN DE USUARIO: updateUser()
   Reemplaza los datos de un usuario existente por los nuevos.
   Se usa al actualizar el saldo y el historial de transacciones.
   Identifica al usuario por su ID único (UUID).
   ══════════════════════════════════════════════════════════ */
export const updateUser = (updatedUser) => {
  const db = getDB();
  db.users = db.users.map((user) =>
    user.id === updatedUser.id ? updatedUser : user
  );
  saveDB(db);
};

/* ══════════════════════════════════════════════════════════
   GESTIÓN DE SESIÓN

   saveSession():   guarda el ID del usuario autenticado en localStorage.
                    Este ID se consulta en cada página protegida para
                    verificar que hay una sesión activa.

   clearSession():  elimina el ID de sesión al cerrar sesión. Garantiza
                    que al volver al login no quede acceso al dashboard.

   getSessionUser(): recupera el objeto de usuario completo correspondiente
                    al ID de sesión guardado. Retorna null si no hay sesión
                    o si el ID ya no corresponde a ningún usuario existente.
   ══════════════════════════════════════════════════════════ */
export const saveSession   = (userId) => localStorage.setItem(SESSION_KEY, userId);
export const clearSession  = ()       => localStorage.removeItem(SESSION_KEY);

export const getSessionUser = () => {
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null; // no hay sesión activa
  const db = getDB();
  return db.users.find((user) => user.id === userId) || null;
};
