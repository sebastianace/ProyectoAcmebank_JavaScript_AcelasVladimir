/**
 * Componentes definidos en este archivo:
 *
 *   <acme-alert type="success|error|info" message="...">
 *     Muestra un mensaje de retroalimentación con ícono de color
 *     según el tipo. Reemplaza los <p class="feedback"> simples.
 *
 *   <acme-stat-card icon="..." label="..." value="..." highlight?>
 *     Tarjeta de estadística para el resumen de cuenta del dashboard.
 *     El atributo booleano "highlight" activa el estilo azul de la
 *     tarjeta de saldo principal (Wealth Card con efecto glassmorphism).
 */

class AcmeAlert extends HTMLElement {
  /* Declarar qué atributos deben vigilarse para re-renderizar */
  static get observedAttributes() {
    return ['type', 'message'];
  }

  constructor() {
    super();
    /* Crear Shadow DOM encapsulado: los estilos de este componente
       no afectan el resto de la página ni son afectados por el CSS global */
    this._shadow = this.attachShadow({ mode: 'open' });
  }

  /* Se ejecuta cuando el elemento se inserta en el árbol DOM */
  connectedCallback() {
    this._render();
  }

  /* Se ejecuta cuando cambia cualquier atributo de observedAttributes */
  attributeChangedCallback() {
    this._render();
  }

  /* Construye el HTML y CSS del componente según los atributos actuales */
  _render() {
    const type    = this.getAttribute('type') || 'info';
    const message = this.getAttribute('message') || '';

    /* Mapa de configuración visual según el tipo de alerta */
    const colores = {
      success: { bg: '#dcfce7', color: '#15803d', icono: 'check_circle' },
      error:   { bg: '#ffdad6', color: '#ba1a1a', icono: 'error'        },
      info:    { bg: '#eff6ff', color: '#0058be', icono: 'info'          },
    };

    const { bg, color, icono } = colores[type] || colores.info;

    /* Inyectar el HTML completo dentro del Shadow DOM */
    this._shadow.innerHTML = `
      <style>
        :host { display: block; }
        .alerta {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 1rem;
          background: ${bg};
          color: ${color};
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          animation: aparecer .25s ease;
        }
        .alerta:empty { display: none; }
        .icono {
          font-family: 'Material Symbols Outlined';
          font-size: 20px;
          font-weight: 400;
          font-style: normal;
          line-height: 1;
          flex-shrink: 0;
        }
        @keyframes aparecer {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      </style>
      ${message ? `
        <div class="alerta">
          <span class="icono">${icono}</span>
          <span>${message}</span>
        </div>` : ''}
    `;
  }
}

/* ══════════════════════════════════════════════════════════
   WEB COMPONENT 2: <acme-stat-card>

   Tarjeta de estadística para el resumen de cuenta del dashboard.
   Muestra un ícono, una etiqueta descriptiva y un valor principal.

   Atributos:
     label     (string)   → etiqueta superior en mayúsculas pequeñas
     value     (string)   → valor principal (número de cuenta, saldo, etc.)
     icon      (string)   → nombre del ícono de Material Symbols
     highlight (booleano) → si está presente, aplica el fondo azul (saldo)

   Ejemplo de uso en dashboard.js:
     <acme-stat-card
       icon="savings"
       label="Saldo actual"
       value="$ 1.500.000"
       highlight
     ></acme-stat-card>

   El atributo "highlight" no tiene valor (es booleano),
   su sola presencia activa el estilo de tarjeta azul.
   ══════════════════════════════════════════════════════════ */
class AcmeStatCard extends HTMLElement {
  /* Atributos que disparan re-renderizado cuando cambian */
  static get observedAttributes() {
    return ['label', 'value', 'highlight', 'icon'];
  }

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback()        { this._render(); }
  attributeChangedCallback() { this._render(); }

  /* Construye la tarjeta con los colores correctos según si tiene
     el atributo "highlight" (tarjeta de saldo azul) o no (tarjeta normal) */
  _render() {
    const etiqueta  = this.getAttribute('label')  || '';
    const valor     = this.getAttribute('value')  || '';
    const icono     = this.getAttribute('icon')   || 'info';
    const destacada = this.hasAttribute('highlight'); // ¿tiene el atributo?

    /* Definir paleta de colores según si la tarjeta está destacada o no */
    const fondo       = destacada
      ? 'linear-gradient(135deg, #00236f 0%, #0058be 100%)' // azul degradado
      : '#ffffff'; // blanco estándar
    const colorEtiq   = destacada ? 'rgba(255,255,255,.7)' : '#444651';
    const colorValor  = destacada ? '#ffffff'               : '#00236f';
    const colorIcono  = destacada ? 'rgba(255,255,255,.6)'  : '#0058be';

    /* Inyectar la tarjeta completa con estilos en el Shadow DOM */
    this._shadow.innerHTML = `
      <style>
        :host { display: block; }
        .tarjeta {
          background: ${fondo};
          border-radius: 2rem;
          padding: 22px;
          /* Sombra con tono azul corporativo, nunca negro puro */
          box-shadow: 0 4px 6px -1px rgba(0,35,111,.04), 0 20px 25px -5px rgba(0,35,111,.08);
          transition: transform .2s;
          position: relative;
          overflow: hidden;
        }
        .tarjeta:hover { transform: translateY(-2px); } /* microinteracción */
        /* Efecto de brillo radial decorativo sobre la tarjeta azul */
        .tarjeta::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(144,168,255,.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .etiqueta {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: ${colorEtiq};
          text-transform: uppercase;
          letter-spacing: .08em;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .icono {
          font-family: 'Material Symbols Outlined';
          font-size: 16px;
          font-weight: 300;
          font-style: normal;
          line-height: 1;
          color: ${colorIcono};
        }
        .valor {
          font-family: 'Manrope', sans-serif;
          font-size: ${destacada ? '24px' : '17px'};
          font-weight: 700;
          color: ${colorValor};
          line-height: 1.35;
          letter-spacing: -.02em;
          word-break: break-word;    /* evita desbordamiento con textos largos */
          overflow-wrap: break-word;
        }
      </style>
      <div class="tarjeta">
        <div class="etiqueta">
          <span class="icono">${icono}</span>
          ${etiqueta}
        </div>
        <div class="valor">${valor}</div>
      </div>
    `;
  }
}

/* ══════════════════════════════════════════════════════════
   REGISTRO DE LOS COMPONENTES EN EL NAVEGADOR

   customElements.define() le indica al navegador que cuando
   encuentre la etiqueta <acme-alert> o <acme-stat-card> en el
   HTML, debe instanciar la clase correspondiente para manejarla.

   Este registro ocurre una sola vez al importar este archivo.
   ══════════════════════════════════════════════════════════ */
customElements.define('acme-alert',     AcmeAlert);
customElements.define('acme-stat-card', AcmeStatCard);
