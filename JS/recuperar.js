/**
 * Ewste archivo Controla el formulario de recuperación de acceso (recuperar.html).
 * Funciona en dos pasos secuenciales:
 *
 * PASO 1 – Verificación de identidad:
 *   El usuario ingresa su tipo de documento, número de documento
 *   y correo electrónico. Si los tres datos coinciden con los
 *   registrados en localStorage, se confirma la identidad y
 *   se habilita el formulario del paso 2.
 *
 * PASO 2 – Asignación de nueva contraseña:
 *   El usuario escribe la nueva contraseña. Se valida el formato
 *   y se actualiza el hash SHA-256 en localStorage. Luego se
 *   redirige automáticamente al login para ingresar con la nueva clave.
 */

import { findUserByIdentity, getDB, hashPassword, saveDB } from "./storage.js";

/* ══════════════════════════════════════════════════════════
   REFERENCIAS AL DOM
   Dos formularios independientes: el primero para verificar la
   identidad y el segundo (inicialmente oculto) para la nueva clave.
   ══════════════════════════════════════════════════════════ */
const verifyForm     = document.getElementById("verifyForm");
const resetForm      = document.getElementById("resetForm");
const verifyFeedback = document.getElementById("verifyFeedback");
const resetFeedback  = document.getElementById("resetFeedback");

/* Variable que guarda el ID del usuario verificado en el paso 1
   para poder actualizar su contraseña en el paso 2.
   Empieza en null como medida de seguridad: si alguien accede
   directamente al paso 2 sin pasar por el paso 1, no funciona. */
let verifiedUserId = null;

/* ══════════════════════════════════════════════════════════
   FUNCIÓN: setError()
   Muestra un mensaje de error debajo del campo indicado.
   ══════════════════════════════════════════════════════════ */
const setError = (fieldId, message) => {
  const node = document.querySelector(`.error[data-for="${fieldId}"]`);
  if (node) node.textContent = message;
};

/* ══════════════════════════════════════════════════════════
   FUNCIÓN: clearErrors()
   Limpia todos los errores y mensajes de feedback de ambos
   formularios antes de cada nueva validación.
   ══════════════════════════════════════════════════════════ */
const clearErrors = () => {
  document.querySelectorAll(".error").forEach((n) => (n.textContent = ""));
  verifyFeedback.textContent = "";
  resetFeedback.textContent  = "";
};

/* ══════════════════════════════════════════════════════════
   PASO 1 – EVENTO: Verificación de identidad (submit)
   Al enviar el primer formulario:
     1. Validar el formato de los tres campos
     2. Buscar el usuario por tipo y número de documento
     3. Verificar que el correo ingresado coincida exactamente
        con el correo registrado en la cuenta
     4. Si todo coincide: guardar el ID del usuario, ocultar
        este formulario y mostrar el formulario de nueva clave
     5. Si no coincide: mostrar mensaje de error genérico
        (no revelar cuál dato específico está mal, por seguridad)
   ══════════════════════════════════════════════════════════ */
verifyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();

  const idType   = document.getElementById("idType").value.trim();
  const idNumber = document.getElementById("idNumber").value.trim();
  const email    = document.getElementById("email").value.trim().toLowerCase();

  // Validar el formato de cada campo antes de consultar la base de datos
  let ok = true;
  if (!idType) {
    setError("idType", "Selecciona un tipo de identificación.");
    ok = false;
  }
  if (!/^\d{5,15}$/.test(idNumber)) {
    setError("idNumber", "Documento inválido.");
    ok = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("email", "Correo inválido.");
    ok = false;
  }
  if (!ok) return;

  // Buscar el usuario y verificar que el correo coincida
  const user = findUserByIdentity(idType, idNumber);
  if (!user || user.email !== email) {
    // Mensaje genérico: no revelar si el usuario existe o si el correo está mal
    verifyFeedback.textContent = "No fue posible validar la información.";
    verifyFeedback.className   = "feedback error-text";
    return;
  }

  // Identidad verificada exitosamente: activar el paso 2
  verifiedUserId = user.id; // guardar el ID para usarlo en el paso 2
  verifyFeedback.textContent = "Identidad validada. Ahora define una nueva contraseña.";
  verifyFeedback.className   = "feedback success-text";
  verifyForm.classList.add("hidden");    // ocultar formulario de verificación
  resetForm.classList.remove("hidden");  // mostrar formulario de nueva clave
});

/* ══════════════════════════════════════════════════════════
   PASO 2 – EVENTO: Asignación de nueva contraseña (submit)
   Al enviar el segundo formulario:
     1. Validar el formato de la nueva contraseña
        (mínimo 8 caracteres, al menos 1 mayúscula y 1 número)
     2. Verificar que verifiedUserId tenga valor (paso 1 completado)
     3. Recorrer todos los usuarios y actualizar el hash SHA-256
        únicamente del usuario que verificó su identidad
     4. Guardar la base de datos actualizada en localStorage
     5. Mostrar mensaje de éxito y redirigir al login en 1.8 segundos
   ══════════════════════════════════════════════════════════ */
resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  const newPassword = document.getElementById("newPassword").value.trim();

  // Verificar que la nueva contraseña cumpla los requisitos de seguridad
  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
    setError("newPassword", "Mínimo 8 caracteres, 1 mayúscula y 1 número.");
    return;
  }

  // Seguridad: no proceder si el paso 1 no fue completado correctamente
  if (!verifiedUserId) return;

  // Actualizar solo el hash de contraseña del usuario verificado
  const db = getDB();
  db.users = await Promise.all(
    db.users.map(async (u) =>
      u.id === verifiedUserId
        ? { ...u, passwordHash: await hashPassword(newPassword) } // nuevo hash
        : u                                                         // sin cambios
    )
  );
  saveDB(db); // persistir los cambios en localStorage

  // Notificar al usuario y redirigir al login automáticamente
  resetFeedback.textContent = "Contraseña actualizada correctamente. Redirigiendo...";
  resetFeedback.className   = "feedback success-text";
  setTimeout(() => { window.location.href = "index.html"; }, 1800);
});
