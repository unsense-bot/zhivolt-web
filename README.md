# ZhiVolt Web

Plataforma web corporativa B2B para **ZhiVolt Importaciones S.A.C.** — importadora de vehículos de micromovilidad eléctrica en el Perú.

## Descripción del proyecto

Sitio web institucional y de captación de leads B2B, diseñado para presentar el catálogo de vehículos eléctricos de ZhiVolt y automatizar el proceso de solicitud de cotizaciones por parte de distribuidores y tiendas minoristas.

Proyecto académico para el curso **Introducción a las TIC** — Universidad Tecnológica del Perú, 2026.

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| HTML5 + CSS3 | Estructura y estilos |
| JavaScript ES6+ | Interactividad y lógica |
| Bootstrap 5 (CDN) | Sistema de grid y componentes |
| Font Awesome 6 (CDN) | Iconografía |
| AOS Library (CDN) | Animaciones al hacer scroll |
| Formspree | Manejo de formularios (sin backend) |
| Git + GitHub | Control de versiones |
| Netlify | Hosting y despliegue continuo |

## Equipo de desarrollo

| Integrante | Rol |
|---|---|
| Bryan Retamozo | Product Owner + Developer |
| Jorge Rios | Scrum Master + Developer |
| Bryan Torres | Developer |
| Jair López | Developer |

## Cómo correr el proyecto localmente

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/zhivolt-web.git
   cd zhivolt-web
   ```

2. Abrir la carpeta en Visual Studio Code:
   ```bash
   code .
   ```

3. Hacer clic derecho sobre `index.html` en el explorador → **"Open with Live Server"**

El sitio abre en `http://127.0.0.1:5500`

## Estructura del proyecto

```
zhivolt-web/
├── index.html          → Página de inicio
├── catalogo.html       → Catálogo de productos
├── producto.html       → Detalle de producto (dinámico via ?id=)
├── nosotros.html       → Historia, misión, visión y equipo
├── contacto.html       → Contacto y cotización general
│
└── assets/
    ├── css/
    │   └── style.css           → Estilos globales y variables CSS
    ├── js/
    │   ├── main.js             → Funciones compartidas (navbar, carrito badge)
    │   ├── catalog.js          → Lógica del catálogo y filtros
    │   ├── product.js          → Carga dinámica del detalle de producto
    │   └── quote-cart.js       → Sistema de carrito de cotización
    ├── data/
    │   └── products.json       → Fuente de datos del catálogo
    └── img/
        ├── brand/              → Logo y favicon
        └── products/           → Imágenes de vehículos por categoría
            ├── scooters/
            ├── ebikes/
            ├── motos/
            └── minicars/
```

## Metodología

Scrum simplificado — 4 sprints de 11 días cada uno.
Gestión de tareas: Jira (proyecto ZHIV).
Rama principal de producción: `main`. Rama de integración: `develop`.
