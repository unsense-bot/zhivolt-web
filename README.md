# ZhiVolt Web

Sitio web institucional B2B de **ZhiVolt Importaciones S.A.C.**, empresa ficticia (con fines académicos) que importa y distribuye al por mayor vehículos de micromovilidad eléctrica en el Perú. El sitio reemplaza el proceso manual de captación de clientes por redes sociales y catálogos en PDF: un comprador B2B puede conocer la empresa, explorar el catálogo y solicitar una cotización formal sin intervención manual del equipo de ventas.

🔗 **Sitio en producción:** [zhivolt.netlify.app](https://zhivolt.netlify.app/)

> Proyecto académico del curso **DCI_TI50** — Introducción a las TIC, Universidad Tecnológica del Perú (UTP). ZhiVolt Importaciones S.A.C. es una empresa ficticia; el contenido comercial (precios, productos, datos de contacto) tiene fines exclusivamente educativos.

---

## Equipo

| Integrante | Rol Scrum |
|---|---|
| Bryan Retamozo | Product Owner |
| Jorge Rios | Scrum Master |
| Bryan Conozco | Developer |
| Jair Ferré | Developer |

Metodología: Scrum simplificado, 4 sprints de 11 días cada uno, tablero Kanban en Jira (To Do / In Progress / Testing / Done).

---

## Funcionalidades principales

- **Catálogo mayorista filtrable** por categoría (scooters, bicicletas eléctricas, motos/trimotos, miniautomóviles), con ficha técnica dinámica por producto.
- **Clasificación regulatoria real:** cada vehículo indica si requiere licencia de conducir según su velocidad máxima, con base en el D.S. N.º 023-2021-MTC (clasificación VMP para vehículos ≤ 25 km/h).
- **Sistema de cotización B2B:** carrito de productos en `localStorage`, formulario de datos corporativos, y envío automatizado de dos correos por cada solicitud (uno a la empresa con el detalle completo, otro de confirmación al cliente).
- **Formulario de contacto general**, independiente del flujo de cotización.
- Sitio completamente responsive (375 / 768 / 1280 px), con accesibilidad WCAG AA (contraste, navegación por teclado, `aria-*`, skip link) y animaciones respetuosas de `prefers-reduced-motion`.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Estructura | HTML5 (5 páginas estáticas) |
| Estilos | CSS3 + [Bootstrap 5.3.8](https://getbootstrap.com/) (CDN) |
| Interactividad | JavaScript ES6+ vanilla (sin frameworks) |
| Iconografía | [Font Awesome 6.7.2](https://fontawesome.com/) (CDN) |
| Animaciones | [AOS 2.3.4](https://michalsnik.github.io/aos/) (Animate on Scroll) |
| Envío de correos | [Resend](https://resend.com/) API, vía función serverless de Netlify |
| Backend mínimo | [Netlify Functions](https://docs.netlify.com/functions/overview/) (Node.js) |
| Hosting / CI-CD | [Netlify](https://www.netlify.com/) — deploy automático desde `main` |
| Control de versiones | Git + GitHub |
| Gestión de proyecto | Jira (tablero Kanban) |

---

## Estructura del proyecto

```
zhivolt-web/
├── index.html              Página de inicio
├── catalogo.html            Catálogo de productos
├── producto.html             Detalle de producto (?id=)
├── nosotros.html             Historia, misión, visión, valores
├── contacto.html              Contacto y formulario general
├── netlify.toml               Configuración de Netlify (ruta de las Functions)
│
├── netlify/
│   └── functions/
│       └── send-email.js      Función serverless: envía los correos vía Resend
│
└── assets/
    ├── css/
    │   └── style.css           Estilos globales (variables CSS, componentes, responsive)
    ├── js/
    │   ├── main.js              Utilidades y constantes compartidas, nav activo, AOS.init()
    │   ├── catalog.js            Catálogo: fetch, render, filtros
    │   ├── product.js             Ficha de producto: galería, specs dinámicas
    │   ├── index.js               Sección "Vehículos Destacados" del home
    │   └── quote-cart.js           Carrito de cotización (CRUD, sidebar, formulario)
    ├── data/
    │   └── products.json          Fuente de datos del catálogo (14 productos)
    └── img/
        ├── brand/                  Logo y favicon
        └── products/                Fotos por categoría (scooters/ebikes/motos/minicars)
```

---

## Ejecutar el proyecto en local

Al ser un sitio 100% estático (sin build step), basta con servir la carpeta con cualquier servidor HTTP simple:

```bash
git clone https://github.com/<usuario>/zhivolt-web.git
cd zhivolt-web
npx serve .
```

**Importante:** la función serverless (`netlify/functions/send-email.js`) solo se ejecuta corriendo el sitio con la [Netlify CLI](https://docs.netlify.com/cli/get-started/), no con un servidor estático genérico:

```bash
npm install -g netlify-cli
netlify dev
```

---

## Variables de entorno

| Variable | Dónde se configura | Descripción |
|---|---|---|
| `RESEND_API_KEY` | Netlify → Site settings → Environment variables | Clave de la API de Resend usada por `send-email.js`. **Nunca** se escribe en el código fuente ni se sube al repositorio. |

---

## Envío de correos (Resend)

El sitio no usa un servicio de formularios externo: los dos formularios (cotización y contacto) llaman a `netlify/functions/send-email.js`, que envía los correos usando la API de Resend.

**Limitación conocida (documentada, no es un bug):** la cuenta de Resend usada en este proyecto no tiene un dominio verificado (el proyecto no cuenta con presupuesto para comprar uno, al ser un desarrollo académico). Por diseño de la API de Resend, esto significa que **solo se puede entregar correo a la dirección con la que se creó la cuenta** (`zhivolt.ventas@gmail.com`):

- El correo de notificación **a la empresa** siempre llega correctamente, porque su destinatario está fijo en el código.
- El correo de confirmación **al cliente** solo se entrega si el email ingresado en el formulario coincide con esa misma dirección. Con cualquier otro correo, Resend lo rechaza de forma silenciosa (no rompe el flujo del usuario, que igual ve la confirmación de envío en pantalla).

Para producción real, esto se resuelve verificando un dominio propio en Resend.

---

## Regulación de referencia

La clasificación de "requiere licencia / no requiere licencia" de cada vehículo se basa en el **Decreto Supremo N.º 023-2021-MTC**, que clasifica como Vehículo Menor de Propulsión Humana y/o Eléctrica (VMP) a los vehículos de una vía con velocidad máxima de hasta 25 km/h, exceptuándolos de licencia de conducir, placa y SOAT.

---

## Licencia

Proyecto académico sin fines comerciales. Todo el contenido relativo a "ZhiVolt Importaciones S.A.C." (empresa, productos, precios) es ficticio y fue creado exclusivamente para el curso DCI_TI50 de la UTP.
