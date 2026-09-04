# Miloha Café — Demo comercial

Demo navegable de Miloha Café: el sitio público y una demostración del panel
de operación interno. Es **material comercial**, no un sistema productivo.

- `/` → sitio público de Miloha Café.
- `/interno/` → demo del panel de operación (mesas, pedidos, cocina, carta QR, equipo, avisos).

## Qué es y qué no es

**Sí:** todas las pantallas y las interacciones funcionan (login visual, mapa de
mesas, armado de pedido, envío a cocina, cambio de estados, carta por QR simulada,
perfiles del equipo, avisos). Todo corre en el navegador y se reinicia al recargar.

**No:** no hay base de datos, ni usuarios reales, ni pagos, ni QR operativos, ni
integraciones externas. El login entra con cualquier clic. El panel interno lleva
el rótulo visible **“Demo comercial · Miloha Café”**.

## Estructura

```
miloha-demo/
├── index.html              Sitio público
├── interno/
│   └── index.html          Panel interno (demo)
├── assets/
│   ├── site.css            Estilos del sitio público
│   ├── interno.css         Estilos del panel interno
│   ├── interno.js          Lógica del panel (estado en memoria)
│   └── logo-miloha.jpg     Logo
├── vercel.json             Configuración de despliegue
└── README.md
```

Es un sitio **100 % estático**: HTML, CSS y JavaScript sin dependencias ni proceso
de build. Lo único que se carga desde afuera son las tipografías de Google Fonts
(Playfair Display y Jost), con alternativas del sistema si no cargan.

## Desplegar en Vercel

### Opción A — desde la web (la más rápida)

1. Entrá a [vercel.com/new](https://vercel.com/new) e iniciá sesión.
2. Elegí **“Deploy”** sin framework y arrastrá la carpeta `miloha-demo` completa
   (o subí el proyecto a GitHub e importalo desde ahí).
3. En la configuración dejá todo por defecto:
   - **Framework Preset:** `Other`
   - **Build Command:** vacío
   - **Output Directory:** vacío (la raíz del proyecto)
4. Clic en **Deploy**. En menos de un minuto tenés la URL pública.

### Opción B — desde la terminal

```bash
npm i -g vercel
cd miloha-demo
vercel
```

Y para publicar en producción:

```bash
vercel --prod
```

Cuando pregunte por el directorio del proyecto, aceptá el actual (`./`), y dejá
vacíos los comandos de build y el directorio de salida.

## Probarlo antes en tu computadora

```bash
cd miloha-demo
python -m http.server 4321
```

Abrí `http://localhost:4321/` y `http://localhost:4321/interno/`.

Conviene abrirlo con un servidor local y no con doble clic sobre el archivo:
así los enlaces entre `/` y `/interno/` funcionan igual que en Vercel.

## Recorrido sugerido para mostrarlo

1. Sitio público → botón **“Ver demo interna”** (arriba a la derecha o en la
   sección oscura del medio).
2. **Entrar al turno** en el login.
3. **Mesas** → tocar una mesa libre.
4. **Armar pedido** → sumar ítems y **Enviar a cocina**.
5. **Cocina** → avanzar estados: Nuevo → Cocinando → Listo → Entregado.
6. **Carta por QR** → elegir otra mesa desde la grilla de QR.
7. **Equipo** y **Avisos**.
8. Volver con **“Ir al sitio público”** en la barra lateral.

## Notas técnicas

- El panel se adapta a celular, tablet y computadora. En pantallas chicas la barra
  lateral se abre con el botón ☰.
- `vercel.json` activa `cleanUrls` y `trailingSlash`, cachea `/assets/` y marca
  `/interno/` como `noindex` para que la demo no aparezca en buscadores.
- Los espacios reservados `[foto]` son intencionales: quedan listos para reemplazar
  por fotos reales del local cuando estén disponibles.
<!-- deploy -->
