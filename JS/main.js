/**
 * Este archivo controla el formulario de login (index.html).
 * Implementa la autenticación del usuario en dos pasos:
 *
 * Paso 1 – Validación de formulario:
 *   Verifica en tiempo real (evento "input") que cada campo cumpla
 *   el formato requerido antes de enviar al servidor.
 *
 * Paso 2 – Verificación de credenciales:
 *   Al enviar el formulario, busca el usuario en localStorage por
 *   tipo y número de identificación, luego compara el hash SHA-256
 *   de la contraseña ingresada con el hash almacenado.
 *   Si coinciden, guarda la sesión y redirige al dashboard.
 */

import { findUserByIdentity, hashPassword, saveSession } from "./storage.js";

/* ══════════════════════════════════════════════════════════
   REFERENCIAS AL DOM
   Se obtienen una sola vez al cargar el script para no
   repetir la búsqueda en cada evento del usuario.
   ══════════════════════════════════════════════════════════ */
const form     = document.getElementById("loginForm");
const feedback = document.getElementById("loginFeedback");

/* ══════════════════════════════════════════════════════════
   FUNCIÓN: showError()
   Muestra un mensaje de error debajo del campo indicado.
   Busca el elemento <small class="error" data-for="campoId">
   y le asigna el texto del error para que sea visible al usuario.

   Parámetros:
     fieldId (string) → ID del campo con error (ej: "docType")
     message (string) → Texto descriptivo del error
   ══════════════════════════════════════════════════════════ */
const showError = (fieldId, message) => {
  const node = document.querySelector(`.error[data-for="${fieldId}"]`);
  if (node) node.textContent = message;
};

/* ══════════════════════════════════════════════════════════
   FUNCIÓN: clearErrors()
   Limpia todos los mensajes de error del formulario antes de
   cada nueva validación, para que los errores anteriores no
   permanezcan si el usuario ya corrigió el campo.
   ══════════════════════════════════════════════════════════ */
const clearErrors = () => {
  document.querySelectorAll(".error").forEach((n) => (n.textContent = ""));
  feedback.textContent = "";
  feedback.className   = "feedback";
};

/* ══════════════════════════════════════════════════════════
   FUNCIÓN: validate()
   Valida el formato de los tres campos del formulario de login:
     - Tipo de identificación: debe seleccionarse una opción
     - Número de documento: solo dígitos, entre 5 y 15 caracteres
     - Contraseña: no puede estar vacía

   Retorna true si todos los campos son válidos, false si hay
   al menos un error. Los mensajes se muestran debajo de cada campo.
   ══════════════════════════════════════════════════════════ */
const validate = () => {
  clearErrors();
  const docType   = document.getElementById("docType").value.trim();
  const docNumber = document.getElementById("docNumber").value.trim();
  const password  = document.getElementById("password").value.trim();
  let ok = true;

  if (!docType) {
    showError("docType", "Selecciona un tipo de identificación.");
    ok = false;
  }
  // Regex: solo dígitos, mínimo 5 y máximo 15
  if (!/^\d{5,15}$/.test(docNumber)) {
    showError("docNumber", "Ingresa un documento válido (5 a 15 dígitos).");
    ok = false;
  }
  if (!password) {
    showError("password", "Ingresa tu contraseña.");
    ok = false;
  }

  return ok;
};

/* ══════════════════════════════════════════════════════════
   EVENTO: Validación en tiempo real (input)
   Se activa cada vez que el usuario escribe en cualquier campo.
   Esto proporciona retroalimentación inmediata sin necesidad de
   enviar el formulario primero.
   ══════════════════════════════════════════════════════════ */
form.addEventListener("input", validate);

/* ══════════════════════════════════════════════════════════
   EVENTO: Envío del formulario (submit)
   Secuencia de autenticación al hacer clic en "Iniciar sesión":
     1. Prevenir el comportamiento nativo del formulario (recarga)
     2. Validar los campos; si hay errores, detener el proceso
     3. Buscar el usuario en localStorage por tipo y número de doc
     4. Calcular el hash SHA-256 de la contraseña ingresada
     5. Comparar el hash calculado con el hash almacenado
     6. Si coinciden: guardar sesión y redirigir al dashboard
     7. Si no coinciden: mostrar mensaje de error genérico
        (sin revelar si el problema es el usuario o la contraseña)
   ══════════════════════════════════════════════════════════ */
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // evitar que el formulario recargue la página
  if (!validate()) return; // no continuar si hay campos inválidos

  const docType   = document.getElementById("docType").value.trim();
  const docNumber = document.getElementById("docNumber").value.trim();
  const password  = document.getElementById("password").value.trim();

  // Buscar si existe un usuario con ese tipo y número de documento
  const user = findUserByIdentity(docType, docNumber);

  // Mensaje genérico para no revelar qué dato es incorrecto (seguridad)
  if (!user) {
    feedback.textContent = "No se pudo validar tu identidad.";
    feedback.className   = "feedback error-text";
    return;
  }

  // Hashear la contraseña ingresada y compararla con la almacenada
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    feedback.textContent = "No se pudo validar tu identidad.";
    feedback.className   = "feedback error-text";
    return;
  }

  // Autenticación exitosa: guardar ID de sesión y redirigir al dashboard
  saveSession(user.id);
  window.location.href = "dashboard.html";
});
