# 🏦 Acme Bank – Portal Transaccional

> Plataforma web de autogestión bancaria desarrollada con **HTML5, CSS3 y JavaScript**. La cual permite a los usuarios crear una cuenta bancaria, iniciar sesión y gestionar sus finanzas desde un dashboard completo con diseño responsivo.

---

## 📋 Tabla de contenido

1. [Descripción del proyecto](#descripción-del-proyecto)
2. [Tecnologías utilizadas](#tecnologías-utilizadas)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Explicación de cada archivo](#explicación-de-cada-archivo)
5. [Instrucciones para ejecutar](#instrucciones-para-ejecutar)
6. [Funcionalidades completadas](#funcionalidades-completadas)
7. [Diseño y sistema visual](#diseño-y-sistema-visual)

---

## 📌 Descripción del proyecto

Acme Bank es un portal transaccional que funciona completamente en el navegador web, **sin necesidad de un servidor ni base de datos externa**. Toda la información de los usuarios y sus transacciones se almacena de forma persistente en el `localStorage` del navegador usando el formato **JSON**.

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
|---|---|
| **HTML5** | Estructura semántica de las 4 páginas |
| **CSS3** | Diseño visual dividido en 6 archivos modulares |
| **JavaScript** | Lógica de negocio, validaciones y persistencia |
| **Web Components** | Componentes `<acme-stat-card>` y `<acme-alert>` |
| **Web Crypto API** | Hash SHA-256 de contraseñas (sin librerías externas) |
| **localStorage** | Persistencia de datos en el navegador (formato JSON) |
| **CSS Grid & Flexbox** | Layout responsivo del dashboard y formularios |
| **Google Fonts** | Tipografías Manrope (títulos) e Inter (cuerpo) |
| **Material Symbols** | Íconos vectoriales del sistema de navegación |

---

## 📁 Estructura del proyecto

```
ProyectoAcmeBank/
│
├── index.html              ← Página de inicio de sesión
├── registro.html           ← Formulario de creación de cuenta
├── recuperar.html          ← Formulario de recuperación de contraseña
├── dashboard.html          ← Panel principal del usuario
│
├── Styles/                 ← Estilos CSS separados por responsabilidad
│   ├── variables.css       ← Tokens de diseño: colores, fuentes y radios
│   ├── base.css            ← Reset, estilos globales y clases de utilidad
│   ├── auth.css            ← Estilos de las páginas de autenticación
│   ├── dashboard.css       ← Layout del dashboard y menú lateral
│   ├── components.css      ← Tarjetas, paneles, tabla y certificado
│   └── responsive.css      ← Media queries para tablet, móvil e impresión
│
├── JS/                     ← Lógica JavaScript separada por módulo
│   ├── storage.js          ← Capa de persistencia (localStorage + JSON)
│   ├── components.js       ← Web Components personalizados
│   ├── main.js             ← Lógica del inicio de sesión
│   ├── registro.js         ← Lógica del formulario de registro
│   ├── recuperar.js        ← Lógica de recuperación de contraseña
│   └── dashboard.js        ← Lógica completa del panel principal
│
├── media/                  ← Recursos multimedia
│   ├── AB_sin_fondo.jpg    ← Logo oficial de Acme Bank
│   └── *.svg               ← Íconos adicionales
│
└── README.md               ← Este archivo de documentación
```

## 🚀 Instrucciones para ejecutar

El proyecto **no requiere instalación ni dependencias**. Solo necesitas un navegador web moderno.

### Opción 1 – Abrir directamente (más sencillo)
1. Descarga o clona el repositorio
2. Abre la carpeta del proyecto
3. Haz doble clic en `index.html`
4. El proyecto se abrirá directamente en tu navegador

### Opción 2 – Con extensión Live Server (recomendado para desarrollo)
1. Instala [Visual Studio Code](https://code.visualstudio.com/)
2. Instala la extensión **Live Server** (de Ritwick Dey)
3. Abre la carpeta del proyecto en VS Code
4. Clic derecho sobre `index.html` → **"Open with Live Server"**
5. El proyecto abrirá en `http://127.0.0.1:5500`

---

## ✅ Funcionalidades completadas

### Autenticación
-  Inicio de sesión con validación de credenciales
- Registro de nuevos usuarios con validación en tiempo real (10 campos)
- Recuperación de contraseña en dos pasos (verificación de identidad + nueva clave)
- Protección de rutas: el dashboard redirige al login si no hay sesión activa
- Hash SHA-256 de contraseñas (nunca se guardan en texto plano)
- Cierre de sesión que limpia los datos de sesión

### Dashboard
- Resumen de cuenta con 4 tarjetas (número de cuenta, saldo, fecha, contacto)
- Historial de las 10 últimas transacciones con badges de color por tipo
- Consignación electrónica (suma al saldo + genera comprobante)
- Retiro de dinero (valida saldo suficiente + genera comprobante)
- Pago de servicios públicos (Energía, Agua, Gas, Internet)
- Certificado bancario formal con diseño profesional
- Botón de imprimir en historial, comprobantes y certificado

### Tecnología y buenas prácticas
- Persistencia de datos con localStorage en formato JSON
- Web Components personalizados (`<acme-stat-card>`, `<acme-alert>`)
- CSS modular separado en 6 archivos por responsabilidad
- JavaScript modular con ES6 imports/exports
- Diseño responsivo para desktop, tablet y móvil
- Comentarios detallados en español en todos los archivos
- Separación de responsabilidades (cada archivo tiene un propósito claro)

---

## 🎨 Diseño y sistema visual

El diseño sigue el sistema **"Digital Private Vault"** desarrollado con la herramienta **Google Stitch**, que define:

- **Paleta de colores:** Azul corporativo profundo `#00236f` como color primario, azul medio `#0058be` como secundario, y una jerarquía de superficies desde blanco puro hasta gris claro
- **Tipografía dual:** Manrope para títulos (look editorial y moderno) e Inter para cuerpo de texto (máxima legibilidad)
- **Regla "No-Line":** Las secciones se separan por diferencias de color de fondo, nunca con bordes de 1px
- **Glassmorphism:** La tarjeta de saldo usa un gradiente con efecto de brillo radial
- **Radios progresivos:** Desde `0.5rem` en detalles hasta `3rem` en botones y el sidebar
- **Sombras con tono azul:** Nunca negro puro; siempre con tinte del color primario

---

*Proyecto desarrollado por Sebastian Acelas — Campuslands 2026*