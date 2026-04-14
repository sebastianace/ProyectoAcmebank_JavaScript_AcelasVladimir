/**
 * registro.js – Lógica del formulario de creación de cuenta
 *
 * Controla el formulario de registro de nuevos usuarios (registro.html).
 *
 * Proceso completo al crear una cuenta:
 *   1. Validación en tiempo real de cada campo con sus reglas específicas
 *   2. Al enviar: verificar que no exista ya ese número de identificación
 *   3. Crear el objeto usuario con todos sus datos, número de cuenta
 *      generado aleatoriamente y contraseña hasheada con SHA-256
 *   4. Guardar el nuevo usuario en localStorage
 *   5. Mostrar el resumen de creación con el número de cuenta asignado
 */

import {
  createAccountNumber,
  findUserByIdentity,
  formatDateTime,
  getDB,
  hashPassword,
  saveDB,
} from "./storage.js";

/* ══════════════════════════════════════════════════════════
   REFERENCIAS AL DOM
   ══════════════════════════════════════════════════════════ */
const form     = document.getElementById("registerForm");
const feedback = document.getElementById("registerFeedback");
const summary  = document.getElementById("registerSummary");

/* ══════════════════════════════════════════════════════════
   REGLAS DE VALIDACIÓN POR CAMPO
   Cada propiedad es una función que recibe el valor del campo
   y retorna:
     - true      → el campo es válido
     - string    → mensaje de error a mostrar al usuario

   Reglas aplicadas:
     idType      → debe seleccionarse una opción (no vacío)
     idNumber    → solo dígitos, entre 5 y 15 caracteres
     firstName   → mínimo 2 caracteres
     lastName    → mínimo 2 caracteres
     gender      → debe seleccionarse una opción
     phone       → solo dígitos, entre 7 y 15 caracteres
     email       → formato correo válido (contiene @ y dominio)
     city        → mínimo 2 caracteres
     address     → mínimo 5 caracteres
     regPassword → mínimo 8 caracteres, al menos 1 mayúscula y 1 número
   ══════════════════════════════════════════════════════════ */
const validators = {
  idType:      (v) => !!v                                   || "Selecciona tipo de identificación.",
  idNumber:    (v) => /^\d{5,15}$/.test(v)                  || "Documento inválido.",
  firstName:   (v) => v.length >= 2                         || "Ingresa nombres válidos.",
  lastName:    (v) => v.length >= 2                         || "Ingresa apellidos válidos.",
  gender:      (v) => !!v                                   || "Selecciona género.",
  phone:       (v) => /^\d{7,15}$/.test(v)                  || "Teléfono inválido.",
  email:       (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Correo inválido.",
  city:        (v) => v.length >= 2                         || "Ingresa una ciudad válida.",
  address:     (v) => v.length >= 5                         || "Ingresa una dirección válida.",
  regPassword: (v) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(v) || "La contraseña no cumple el formato.",
};

/* ══════════════════════════════════════════════════════════
   FUNCIÓN: showFieldError()
   Muestra u oculta el mensaje de error de un campo específico.
   Recibe el ID del campo y el texto del error (o "" para limpiar).
   ══════════════════════════════════════════════════════════ */
const showFieldError = (id, message) => {
  const node = document.querySelector(`.error[data-for="${id}"]`);
  if (node) node.textContent = typeof message === "string" ? message : "";
};

/* ══════════════════════════════════════════════════════════
   FUNCIÓN: validateField()
   Valida un campo individual aplicando su regla del objeto
   validators y actualiza el mensaje de error correspondiente.
   Retorna true si el campo es válido, false si tiene error.
   ══════════════════════════════════════════════════════════ */
const validateField = (id) => {
  const value  = document.getElementById(id).value.trim();
  const result = validators[id](value);
  showFieldError(id, result === true ? "" : result);
  return result === true;
};

/* ══════════════════════════════════════════════════════════
   FUNCIÓN: validateForm()
   Ejecuta validateField() para todos los campos del formulario.
   Retorna true solo si TODOS los campos son válidos.
   Usa every() para que la validación se detenga al primer error.
   ══════════════════════════════════════════════════════════ */
const validateForm = () => Object.keys(validators).every((id) => validateField(id));

/* ══════════════════════════════════════════════════════════
   VALIDACIÓN EN TIEMPO REAL
   Escucha el evento "input" en cada campo del formulario para
   validar individualmente cada vez que el usuario escribe.
   Proporciona retroalimentación instantánea sin esperar al envío.
   ══════════════════════════════════════════════════════════ */
Object.keys(validators).forEach((id) => {
  document.getElementById(id).addEventListener("input", () => validateField(id));
});

/* ══════════════════════════════════════════════════════════
   EVENTO: Envío del formulario de registro (submit)
   Secuencia al hacer clic en "Crear cuenta":
     1. Prevenir recarga de la página
     2. Limpiar el resumen anterior si existía
     3. Validar todos los campos; detener si hay errores
     4. Recopilar los valores del formulario
     5. Verificar que no exista ya ese número de identificación
     6. Construir el objeto usuario completo:
        - ID único con crypto.randomUUID()
        - Número de cuenta de 10 dígitos (aleatorio)
        - Hash SHA-256 de la contraseña
        - Saldo inicial de $0 y arreglo vacío de transacciones
     7. Agregar el usuario a la base de datos y guardar
     8. Mostrar el resumen de creación al usuario
   ══════════════════════════════════════════════════════════ */
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedback.textContent = "";
  summary.classList.add("hidden");

  // Validar todos los campos antes de proceder
  if (!validateForm()) {
    feedback.textContent = "Corrige los campos marcados para continuar.";
    feedback.className   = "feedback error-text";
    return;
  }

  // Recopilar los valores ingresados por el usuario
  const payload = {
    idType:    document.getElementById("idType").value.trim(),
    idNumber:  document.getElementById("idNumber").value.trim(),
    firstName: document.getElementById("firstName").value.trim(),
    lastName:  document.getElementById("lastName").value.trim(),
    gender:    document.getElementById("gender").value.trim(),
    phone:     document.getElementById("phone").value.trim(),
    email:     document.getElementById("email").value.trim().toLowerCase(),
    city:      document.getElementById("city").value.trim(),
    address:   document.getElementById("address").value.trim(),
    password:  document.getElementById("regPassword").value.trim(),
  };

  // Verificar que no exista ya una cuenta con ese documento
  if (findUserByIdentity(payload.idType, payload.idNumber)) {
    feedback.textContent = "Ya existe una cuenta con ese tipo y número de identificación.";
    feedback.className   = "feedback error-text";
    return;
  }

  // Construir el objeto usuario completo que se guardará en localStorage
  const db            = getDB();
  const createdAt     = new Date().toISOString();
  const accountNumber = createAccountNumber();

  const user = {
    id:           crypto.randomUUID(),              // ID único e irrepetible
    idType:       payload.idType,
    idNumber:     payload.idNumber,
    firstName:    payload.firstName,
    lastName:     payload.lastName,
    gender:       payload.gender,
    phone:        payload.phone,
    email:        payload.email,
    city:         payload.city,
    address:      payload.address,
    passwordHash: await hashPassword(payload.password), // contraseña hasheada
    accountNumber,
    createdAt,
    balance:      0,    // toda cuenta nueva empieza en $0
    transactions: [],   // historial vacío al inicio
  };

  // Agregar el nuevo usuario y guardar la base de datos actualizada
  db.users.push(user);
  saveDB(db);

  // Limpiar el formulario y mostrar el resumen con los datos asignados
  form.reset();
  feedback.textContent = "Cuenta creada correctamente.";
  feedback.className   = "feedback success-text";
  summary.classList.remove("hidden");
  summary.innerHTML = `
    <h3>Resumen de creación de cuenta</h3>
    <p><strong>Titular:</strong> ${user.firstName} ${user.lastName}</p>
    <p><strong>Número de cuenta asignado:</strong> ${accountNumber}</p>
    <p><strong>Fecha de creación:</strong> ${formatDateTime(createdAt)}</p>
    <a href="index.html">Ir a inicio de sesión</a>
  `;
});
