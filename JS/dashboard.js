/**
 * Este archivo controla toda la interactividad del dashboard.
 * Cada función renderX() construye el HTML de una vista y lo inyecta
 * dentro del contenedor #viewContainer según la opción que seleccione
 * el usuario en el menú lateral.
 *
 * Vistas disponibles:
 *   renderOverview()       → Resumen de la cuenta con tarjetas (Web Components)
 *   renderTransactions()   → Tabla de las 10 últimas transacciones con colores
 *   renderMovementForm()   → Formulario de consignación o retiro (reutilizable)
 *   renderServices()       → Formulario de pago de servicios públicos
 *   renderCertificate()    → Certificado bancario formal listo para imprimir
 */

import {
  clearSession,
  createReference,
  formatCurrency,
  formatDateTime,
  getSessionUser,
  updateUser,
} from "./storage.js";

import "./components.js";

/* ══════════════════════════════════════════════════════════
   VERIFICACIÓN DE SESIÓN ACTIVA
   Si el usuario intenta acceder al dashboard sin haber iniciado
   sesión, se redirige inmediatamente al login. Esto protege
   las rutas privadas de la aplicación.
   ══════════════════════════════════════════════════════════ */
let user = getSessionUser();
if (!user) window.location.href = "index.html";

/* ══════════════════════════════════════════════════════════
   REFERENCIAS AL DOM
   Se obtienen una sola vez al cargar el archivo para evitar
   consultas repetidas al DOM en cada renderizado.
   ══════════════════════════════════════════════════════════ */
const welcomeName   = document.getElementById("welcomeName");
const accountMeta   = document.getElementById("accountMeta");
const viewContainer = document.getElementById("viewContainer");
const menuButtons   = document.querySelectorAll("[data-view]");

/* ══════════════════════════════════════════════════════════
   FUNCIÓN AUXILIAR: printHTML()
   Abre una nueva ventana del navegador con contenido HTML
   formateado y lanza el diálogo de impresión del sistema.
   Se usa para generar comprobantes y el certificado bancario.

   Parámetros:
     title (string) → Título que aparece en la pestaña y al imprimir
     html  (string) → Contenido HTML del documento a imprimir
   ══════════════════════════════════════════════════════════ */
const printHTML = (title, html) => {
  const popup = window.open("", "_blank");
  popup.document.write(`
    <!doctype html><html><head>
      <title>${title}</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; padding: 32px; color: #191c1e; }
        h1   { font-family: 'Manrope', Arial, sans-serif; color: #00236f; margin-bottom: 24px; }
        table{ border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
        th   { background: #f3f4f6; font-weight: 600; }
        p    { margin-bottom: 10px; line-height: 1.6; }
      </style>
    </head><body>${html}</body></html>
  `);
  popup.document.close();
  popup.print();
};

/* ══════════════════════════════════════════════════════════
   FUNCIÓN AUXILIAR: addTransaction()
   Registra una nueva transacción en el historial del usuario.
   Crea el objeto con todos los datos requeridos (fecha, referencia,
   tipo, descripción y valor), lo inserta al inicio del arreglo
   (las más recientes primero) y persiste los cambios en localStorage.

   Parámetros:
     type        (string) → "Consignación" o "Retiro"
     description (string) → Concepto del movimiento
     value       (number) → Monto de la operación en pesos COP

   Retorna: el objeto de transacción creado (para usarlo en el comprobante)
   ══════════════════════════════════════════════════════════ */
const addTransaction = (type, description, value) => {
  const transaction = {
    date:      new Date().toISOString(), // fecha ISO para formatear luego
    reference: createReference(),        // ej: "REF-483920"
    type,
    description,
    value,
  };
  // Insertar al principio del arreglo → la más reciente queda de primera
  user.transactions = [transaction, ...(user.transactions || [])];
  updateUser(user); // persiste en localStorage
  return transaction;
};

/* ══════════════════════════════════════════════════════════
   VISTA 1: renderOverview() – Resumen de cuenta
   Muestra las 4 tarjetas con los datos principales del usuario:
     - Número de cuenta
     - Saldo actual (tarjeta azul destacada con efecto glassmorphism)
     - Fecha de creación de la cuenta
     - Correo electrónico de contacto

   Usa el Web Component <acme-stat-card> definido en components.js.
   El atributo "highlight" activa el estilo de tarjeta azul del saldo.
   ══════════════════════════════════════════════════════════ */
const renderOverview = () => {
  viewContainer.innerHTML = `
    <div class="card-grid">
      <acme-stat-card
        icon="account_balance"
        label="Número de cuenta"
        value="${user.accountNumber}"
      ></acme-stat-card>

      <acme-stat-card
        icon="savings"
        label="Saldo actual"
        value="${formatCurrency(user.balance)}"
        highlight
      ></acme-stat-card>

      <acme-stat-card
        icon="calendar_today"
        label="Fecha de creación"
        value="${formatDateTime(user.createdAt)}"
      ></acme-stat-card>

      <acme-stat-card
        icon="contact_mail"
        label="Contacto"
        value="${user.email}"
      ></acme-stat-card>
    </div>
  `;
};

/* ══════════════════════════════════════════════════════════
   VISTA 2: renderTransactions() – Historial de transacciones
   Muestra las últimas 10 transacciones del usuario en una tabla.

   Columnas: Fecha | Referencia | Tipo | Descripción | Valor

   Colores semánticos en la columna TIPO:
     - Consignación → badge verde  (ingreso de dinero ✓)
     - Retiro       → badge rojo   (salida de dinero ✗)

   También incluye un botón "Imprimir" que abre una nueva ventana
   con la tabla formateada lista para enviar a la impresora.
   ══════════════════════════════════════════════════════════ */
const renderTransactions = () => {
  // Construir las filas HTML de las últimas 10 transacciones
  const rows = (user.transactions || [])
    .slice(0, 10)
    .map((t) => {
      // Determinar el estilo del badge según el tipo de transacción
      const esConsignacion = t.type.toLowerCase() === "consignación";
      const badgeClass = esConsignacion ? "badge-consignacion" : "badge-retiro";

      return `
        <tr>
          <td>${formatDateTime(t.date)}</td>
          <td>${t.reference}</td>
          <td><span class="${badgeClass}">${t.type}</span></td>
          <td>${t.description}</td>
          <td>${formatCurrency(t.value)}</td>
        </tr>`;
    })
    .join("");

  viewContainer.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <h3>Últimas 10 transacciones</h3>
        <button id="printTx">
          <span class="material-symbols-outlined" style="font-size:16px;margin-right:6px">print</span>
          Imprimir
        </button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Referencia</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5" style="text-align:center;color:#757682;padding:24px">Sin transacciones registradas.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;

  // Al hacer clic en Imprimir, se genera una copia de la tabla para impresión
  document.getElementById("printTx").addEventListener("click", () => {
    const tableHtml = viewContainer.querySelector("table").outerHTML;
    printHTML(
      "Resumen de transacciones – Acme Bank",
      `<h1>Resumen de transacciones</h1>
       <p>Titular: <strong>${user.firstName} ${user.lastName}</strong></p>
       <p>Cuenta: <strong>${user.accountNumber}</strong></p>
       <br>${tableHtml}`
    );
  });
};

/* ══════════════════════════════════════════════════════════
   VISTA 3: renderMovementForm() – Consignación o Retiro
   Esta función es reutilizable para dos operaciones distintas:
     - Consignación electrónica (view = "deposit")  → suma al saldo
     - Retiro de dinero         (view = "withdraw") → resta al saldo

   El parámetro "view" determina el comportamiento, el título,
   el ícono del botón y la lógica de actualización del saldo.

   Validación: en el caso de retiro, se verifica que el saldo
   sea suficiente antes de procesar la operación.

   Al completar la operación se abre automáticamente el comprobante
   de transacción formateado listo para imprimir.
   ══════════════════════════════════════════════════════════ */
const renderMovementForm = (view) => {
  const isDeposit = view === "deposit";
  const title     = isDeposit ? "Consignación electrónica" : "Retiro de dinero";
  const btnText   = isDeposit ? "Consignar" : "Retirar";
  const btnIcon   = isDeposit ? "savings"   : "payments";

  viewContainer.innerHTML = `
    <section class="panel">
      <h3>${title}</h3>
      <p>Cuenta: <strong>${user.accountNumber}</strong> · ${user.firstName} ${user.lastName}</p>
      <form id="movementForm">
        <label for="amount">Valor a ${isDeposit ? "consignar" : "retirar"}</label>
        <input id="amount" type="number" min="1" placeholder="Ej: 500000" required>
        <p id="movementFeedback" class="feedback"></p>
        <button type="submit">
          <span class="material-symbols-outlined" style="font-size:18px;margin-right:6px;vertical-align:middle">${btnIcon}</span>
          ${btnText}
        </button>
      </form>
    </section>
  `;

  document.getElementById("movementForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const amount   = Number(document.getElementById("amount").value);
    const feedback = document.getElementById("movementFeedback");

    if (amount <= 0) return;

    // Validar saldo suficiente antes de procesar el retiro
    if (!isDeposit && amount > user.balance) {
      feedback.textContent = "Saldo insuficiente para realizar el retiro.";
      feedback.className   = "feedback error-text";
      return;
    }

    // Actualizar el saldo: sumar si es consignación, restar si es retiro
    user.balance = isDeposit ? user.balance + amount : user.balance - amount;

    // Registrar la transacción y obtener sus datos para el comprobante
    const tx = addTransaction(
      isDeposit ? "Consignación" : "Retiro",
      isDeposit ? "Consignación por canal electrónico" : "Retiro de dinero",
      amount
    );

    feedback.textContent = "Transacción realizada con éxito.";
    feedback.className   = "feedback success-text";

    // Reflejar el nuevo saldo en el chip del sidebar
    accountMeta.textContent = `Cta. ${user.accountNumber} · ${formatCurrency(user.balance)}`;

    // Abrir comprobante de impresión automáticamente
    printHTML(
      "Comprobante de transacción – Acme Bank",
      `<h1>Comprobante de transacción</h1>
       <p><strong>Titular:</strong> ${user.firstName} ${user.lastName}</p>
       <p><strong>Cuenta:</strong> ${user.accountNumber}</p>
       <p><strong>Fecha:</strong> ${formatDateTime(tx.date)}</p>
       <p><strong>Referencia:</strong> ${tx.reference}</p>
       <p><strong>Tipo:</strong> ${tx.type}</p>
       <p><strong>Concepto:</strong> ${tx.description}</p>
       <p><strong>Valor:</strong> ${formatCurrency(tx.value)}</p>
       <p><strong>Nuevo saldo:</strong> ${formatCurrency(user.balance)}</p>`
    );
  });
};

/* ══════════════════════════════════════════════════════════
   VISTA 4: renderServices() – Pago de servicios públicos
   Muestra un formulario con tres campos:
     1. Servicio: lista desplegable (Energía, Agua, Gas, Internet)
     2. Referencia de factura: código de la factura a pagar
     3. Valor a pagar: monto que se debitará de la cuenta

   El pago se registra como un "Retiro" con la descripción
   "Pago de servicio público <nombre del servicio>".
   Valida saldo suficiente antes de procesar el débito.
   Genera comprobante de pago automáticamente al finalizar.
   ══════════════════════════════════════════════════════════ */
const renderServices = () => {
  viewContainer.innerHTML = `
    <section class="panel">
      <h3>Recarga Telefonica</h3>
      <p>Cuenta: <strong>${user.accountNumber}</strong> · ${user.firstName} ${user.lastName}</p>
      <form id="servicesForm">
        <label for="service">Compañias</label>
        <select id="service">
            <option>EMovilNet</option>
            <option>Amber Phone</option>
            <option>Dynaphone</option>
            <option>SkyPhone</option>
          </select>

        <label for="serviceRef">Referencia de telefono</label>
        <input id="serviceRef" type="text" placeholder="Ej: 3132602321" required>

        <label for="serviceAmount">Valor a pagar</label>
        <input id="serviceAmount" type="number" min="1" placeholder="Ej: 120000" required>

        <p id="serviceFeedback" class="feedback"></p>
        <button type="submit">
          <span class="material-symbols-outlined" style="font-size:18px;margin-right:6px;vertical-align:middle">bolt</span>
          Pagar telefono
        </button>
      </form>
    </section>
  `;

  document.getElementById("servicesForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const service = document.getElementById("service").value;
    const amount  = Number(document.getElementById("serviceAmount").value);
    const ref     = document.getElementById("serviceRef").value.trim();
    const fbNode  = document.getElementById("serviceFeedback");

    if (!ref || amount <= 0) return;

    // Verificar que haya saldo suficiente para cubrir el pago
    if (amount > user.balance) {
      fbNode.textContent = "Saldo insuficiente para realizar el pago.";
      fbNode.className   = "feedback error-text";
      return;
    }

    // Descontar el valor del servicio del saldo del usuario
    user.balance -= amount;
    const tx = addTransaction(
      "Retiro",
      `Pago de servicio público ${service}`,
      amount
    );

    fbNode.textContent = "Pago realizado correctamente.";
    fbNode.className   = "feedback success-text";

    // Actualizar el saldo visible en el sidebar
    accountMeta.textContent = `Cta. ${user.accountNumber} · ${formatCurrency(user.balance)}`;

  });
};

/* ══════════════════════════════════════════════════════════
  VISTA 5: renderRecargas() – Recargas Telefonicas
  permita a los usuarios realizar recargas mediante su numero de telefono.
   ══════════════════════════════════════════════════════════ */

  const renderRecargas = () => { 
    viewContainer.innerHTML = `
      <section class="pane">
        <h3>Recargas Telefonicas<h3>
        <p>Cuenta: <strong>${user.accountNumber}</strong> · ${user.firstName} ${user.lastName}</p>
        <form id="servicesrecar"
          <label for="service">Servicio</label>
          <select id="service">
            <option>EMovilNet</option>
            <option>Amber Phone</option>
            <option>Dynaphone</option>
            <option>SkyPhone</option>
          </select>
  
          <label for="serviceRecarga">Numero Telefonico</label>
          <input id="serviceRecarga" type="text" placeholder="Ej: 3132602321" required>
  
          <label for="serviceAmount">Valor de la recarga required>
          <input id="serviceAmount" type="number" min="1" placeholder="Ej: 120000" required>
  
          <p id="serviceFeedbac" class="feedbac"></p>
          <button type="submit">
            <span class="material-symbols-outlined" style="font-size:18px;margin-right:6px;vertical-align:middle">bolt</span>
            Pagar servicio
          </button>
        </form>
      </section>
    `;
  
    document.getElementById("servicesrecar").addEventListener("submit", (event) => {
      event.preventDefault();
      const service = document.getElementById("service").value;
      const amount  = Number(document.getElementById("serviceAmount").value);
      const ref     = document.getElementById("serviceRecarga").value.trim();
      const fbNode  = document.getElementById("serviceFeedbac");
  
      if (!ref || amount <= 0) return;
  
      // Verificar que haya saldo suficiente para cubrir el pago
      if (amount > user.balance) {
        fbNode.textContent = "Saldo insuficiente para realizar el pago.";
        fbNode.className   = "feedback error-text";
        return;
      }
  
      // Descontar el valor de la recaga del saldo del usuario
      user.balance -= amount;
      const tx = addTransaction(
        "Retiro",
        `Pago de servicio público ${service}`,
        amount
      );
  
      fbNode.textContent = "Pago realizado correctamente.";
      fbNode.className   = "feedback success-text";
  
      // Actualizar el saldo visible en el sidebar
      accountMeta.textContent = `Cta. ${user.accountNumber} · ${formatCurrency(user.balance)}`;
  
    });
  };

/* ══════════════════════════════════════════════════════════
   VISTA 6: renderCertificate() – Certificado bancario
   Genera un documento formal que certifica que el usuario
   tiene una cuenta activa en Acme Bank.

   Estructura del certificado:
     - Encabezado: logo, nombre del banco y badge "CERTIFICADO OFICIAL"
     - Número de certificado único generado con la cuenta + año
     - Texto legal formal en primera persona del banco
     - Cuadrícula con los datos clave del titular
     - Líneas de firma del gerente de cuenta y director de operaciones
     - Pie de página con dirección y sello de documento oficial

   El botón "Imprimir" captura todo el HTML del certificado
   y lo envía a la impresora con estilos propios.
   ══════════════════════════════════════════════════════════ */
const renderCertificate = () => {
  // Número único: combinación del número de cuenta y el año actual
  const certNumber = `CERT-${user.accountNumber}-${new Date().getFullYear()}`;
  // Fecha de expedición en formato legible en español colombiano
  const todayStr   = new Date().toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });

  viewContainer.innerHTML = `
    <div class="certificate-wrap">

      <!-- Encabezado institucional del certificado -->
      <div class="certificate-header">
        <div class="certificate-logo">
          <img src="../media/AB_sin_fondo.jpg" alt="Logo Acme Bank" style="height:52px;width:auto;object-fit:contain">
          <div class="certificate-logo-text">
            <strong>Acme Bank</strong>
            <span>NIT 900.123.456-7 | Vigilado SuperFinanciera</span>
          </div>
        </div>
        <div class="certificate-badge">CERTIFICADO<br>OFICIAL</div>
      </div>

      <!-- Cuerpo del certificado con datos formales -->
      <div class="certificate-body">

        <!-- Número de certificado y ciudad/fecha de expedición -->
        <div class="certificate-ref">
          <div>
            <div class="certificate-ref-label">Número de certificado</div>
            <div class="certificate-ref-value">${certNumber}</div>
          </div>
          <div>
            <div class="certificate-ref-label">Ciudad y fecha de expedición</div>
            <div class="certificate-ref-value">Bogotá D.C., ${todayStr}</div>
          </div>
        </div>

        <!-- Título central del documento -->
        <div class="certificate-title">Certificación de cuenta bancaria</div>

        <!-- Texto formal y legal del certificado -->
        <p class="certificate-text">
          Acme Bank, entidad financiera legalmente constituida bajo las leyes de la República
          de Colombia y debidamente vigilada por la Superintendencia Financiera de Colombia,
          <strong>CERTIFICA</strong> que el(la) señor(a) <strong>${user.firstName} ${user.lastName}</strong>,
          identificado(a) con <strong>${user.idType} número ${user.idNumber}</strong>,
          es titular de una cuenta de ahorros en esta institución desde el
          <strong>${formatDateTime(user.createdAt)}</strong>, la cual se encuentra
          <strong>activa y al día</strong> en el momento de expedir el presente documento.
        </p>

        <!-- Cuadrícula con los datos clave del titular -->
        <div class="certificate-data-grid">
          <div class="certificate-data-item">
            <div class="certificate-data-label">Titular de la cuenta</div>
            <div class="certificate-data-value">${user.firstName} ${user.lastName}</div>
          </div>
          <div class="certificate-data-item">
            <div class="certificate-data-label">Tipo de identificación</div>
            <div class="certificate-data-value">${user.idType}</div>
          </div>
          <div class="certificate-data-item">
            <div class="certificate-data-label">Número de identificación</div>
            <div class="certificate-data-value">${user.idNumber}</div>
          </div>
          <div class="certificate-data-item">
            <div class="certificate-data-label">Número de cuenta</div>
            <div class="certificate-data-value">${user.accountNumber}</div>
          </div>
          <div class="certificate-data-item">
            <div class="certificate-data-label">Tipo de cuenta</div>
            <div class="certificate-data-value">Cuenta de ahorros</div>
          </div>
          <div class="certificate-data-item">
            <div class="certificate-data-label">Estado</div>
            <div class="certificate-data-value" style="color:#15803d">Activa ✓</div>
          </div>
        </div>

        <!-- Nota de vigencia del certificado -->
        <p class="certificate-text" style="font-size:13px;margin-top:8px">
          Este certificado se expide a solicitud del interesado para los fines legales que
          considere pertinentes. Su validez es de treinta (30) días calendario a partir
          de la fecha de expedición.
        </p>

        <!-- Líneas de firma institucional -->
        <div class="certificate-signature">
          <div class="certificate-sig-block">
            <div class="certificate-sig-line"></div>
            <div class="certificate-sig-name">Gerente de Cuenta</div>
            <div class="certificate-sig-role">Acme Bank</div>
          </div>
          <div class="certificate-sig-block">
            <div class="certificate-sig-line"></div>
            <div class="certificate-sig-name">Director de Operaciones</div>
            <div class="certificate-sig-role">Acme Bank</div>
          </div>
        </div>
      </div>

      <!-- Pie de página con información de contacto del banco -->
      <div class="certificate-footer">
        <span class="certificate-footer-text">
          Acme Bank S.A. · Calle 72 # 10-07 Of. 501, Bogotá D.C. · Tel. (601) 555-0100
        </span>
        <span class="certificate-footer-seal">DOCUMENTO OFICIAL</span>
      </div>
    </div>

    <!-- Botón fuera del área del certificado para no aparecer al imprimir -->
    <button class="certificate-print-btn btn-primary" id="printCertificate">
      <span class="material-symbols-outlined" style="font-size:18px;margin-right:6px;vertical-align:middle">print</span>
      Imprimir certificado
    </button>
  `;

  // Capturar el HTML completo del certificado y enviarlo a impresión
  document.getElementById("printCertificate").addEventListener("click", () => {
    printHTML(
      "Certificado bancario – Acme Bank",
      document.querySelector(".certificate-wrap").outerHTML
    );
  });
};

/* ══════════════════════════════════════════════════════════
   CONTROLADOR DE VISTAS: setView()
   Recibe el identificador de la vista y llama al renderizador
   correspondiente. Es el punto central de navegación del dashboard.

   Parámetro:
     view (string) → "overview" | "transactions" | "deposit" |
                     "withdraw" | "services" | "certificate"
   ══════════════════════════════════════════════════════════ */
const setView = (view) => {
  if (view === "overview")     renderOverview();
  if (view === "transactions") renderTransactions();
  if (view === "deposit"    || view === "withdraw") renderMovementForm(view);
  if (view === "services")     renderServices();
  if (view === "certificate")  renderCertificate();
};

/* ══════════════════════════════════════════════════════════
   INICIALIZACIÓN DEL DASHBOARD
   Se ejecuta una sola vez al cargar la página:
     1. Muestra el nombre y datos de cuenta en el sidebar
     2. Asigna el evento de navegación a cada botón del menú
     3. Asigna el evento de cierre de sesión
     4. Carga la vista inicial (resumen de cuenta)
   ══════════════════════════════════════════════════════════ */

// Poblar el chip de usuario en el sidebar con los datos de la sesión activa
welcomeName.textContent = `Hola, ${user.firstName} ${user.lastName}`;
accountMeta.textContent = `Cta. ${user.accountNumber} · ${formatCurrency(user.balance)}`;

// Asignar evento click a cada botón de navegación del menú lateral
menuButtons.forEach((btn) =>
  btn.addEventListener("click", () => setView(btn.dataset.view))
);

// Cerrar sesión: elimina los datos de sesión y regresa al login
document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "index.html";
});

// Mostrar el resumen de cuenta como vista inicial al ingresar al dashboard
setView("overview");
