# README_DEV — Guía rápida del proyecto 

Este README es corto y al toque. La idea es que abras el proyecto, te ubiques rápido y puedas meter mano en lo básico (balance de pelea, estilos y datos). Todo está en vanilla HTML/CSS/JS.

---
## Resumen rápido
- **Tecnologías**: HTML, CSS y JavaScript. No hay build system.
- **Páginas principales**:
  - `Personajes/` — listado de personajes y datos JSON.
  - `Seleccion/` — selector de dos luchadores y simulador de pelea.
- **Librerías externas** (CDN): SweetAlert2 (modales) y Toastify (toasts de combate).
- **Navegadores compatibles**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

---

**Qué hice:**
- Hice la pantalla de selección y el listado de personajes (`Seleccion/index.html` y `Personajes/index.html`).
- Programé la pelea en `Seleccion/script.js` (turnos, daño, fallos, críticos y especiales).
- Agregué la barra de HP en vivo, números de daño y toasts con Toastify para el feedback.
- Ajusté estilos en `Seleccion/style.css` y `Personajes/style.css` para que todo se vea decente.
- Armé un `CONFIG` al inicio del script para poder balancear más fácil.
- Mejoré un poco el rendimiento usando creación de nodos y `DocumentFragment`.

**Nota para el profe:** Desarrollé y probé los cambios a mano en el navegador. Acá explico las decisiones de diseño y dónde ajustar parámetros de balance.

---
## Estructura de archivos (puntos de interés)
- `Personajes/index.html` — página del roster. Contiene el contenedor `#character-container` donde `main.js` inyecta las tarjetas.
- `Personajes/main.js` — carga `saints.json`, genera las tarjetas de personaje y muestra el modal de detalles (SweetAlert).
- `Personajes/style.css` — estilos del roster y del modal de detalles.
- `Personajes/saints.json` — datos de los personajes (nombre, constelación, tipo de armadura, rango y `skills` con `main`, `special` e `image`).

- `Seleccion/index.html` — interfaz de selección y batalla. Contiene la grilla con `#fighterA`, `#damage-box` y `#fighterB`.
- `Seleccion/script.js` — lógica principal: carga los `saints`, render del roster, selección A/B, pelea, toasts (Toastify), números flotantes y modal del ganador.
- `Seleccion/style.css` — estilos para la grilla de batalla, tarjetas laterales, caja de daño central, barra de HP, animaciones de números flotantes y responsive.

---
## Cómo probar rápido
1. Abrí `Personajes/index.html` o `Seleccion/index.html` en el navegador.
2. Si el JSON no carga por CORS en `file://`, levantá un server estático (por ejemplo: `npx http-server`) o usá Live Server.
3. Elegí dos personajes y tocá “Pelear”. Fijate en los toasts (Toastify) y en la barra de HP.

---
## Flujo rápido
- Se carga el roster desde `saints.json`.
- Seleccionás A y B, se muestran previews con HP y nombre.
- `Pelear` corre turnos con fallos, críticos y especiales, mostrando toasts.
- Al final, aparece un modal (SweetAlert) con el ganador y opciones.

---
## Puntos clave del código y dónde hacer cambios comunes
A continuación se listan los lugares más habituales donde trabajarás y qué buscar:

### 1. Cambiar valores de combate (hp base, daño base, chances)
**Archivo**: `Seleccion/script.js`

**⚡ MÉTODO RECOMENDADO - Usar CONFIG (ya implementado):**
El sistema de configuración centralizada está ubicado al inicio del archivo:

```js
const CONFIG = {
  HP_BASE: 200,          // Vida base
  HP_GOLD_BONUS: 20,     // Bonus HP para armaduras Gold  
  ATK_BASE: 12,          // Ataque base
  ATK_GOLD_BONUS: 6,     // Bonus ataque para armaduras Gold
  SPECIAL_BONUS: 6,      // Daño extra del ataque especial
  MISS_CHANCE: 0.08,     // 8% probabilidad de fallo
  CRIT_CHANCE: 0.12,     // 12% probabilidad de crítico
  CRIT_MULTIPLIER: 1.7   // Multiplicador de daño crítico
};
```

**Ejemplos de cambios comunes:**
- Para reducir críticos al 6%: `CRIT_CHANCE: 0.06`
- Para aumentar HP base: `HP_BASE: 250`
- Para cambiar multiplicador de crítico: `CRIT_MULTIPLIER: 2.0`

### 2) Cambiar la apariencia de las cartas y el tamaño de las imágenes
Archivo: `Seleccion/style.css` y `Personajes/style.css`
- En `Personajes/style.css`, cambia `.character-image { height: 120px; }` para agrandar la caja de imagen del roster. Mantén `object-fit: contain` para evitar recortes.
- En `Seleccion/style.css`, modifica `.fighter-card` y `#fighterA .fighter-preview img` / `#fighterB .fighter-preview img` para ajustar el tamaño de las cajas laterales.

### 3) Ajustar la posición de la barra de HP y nombres
Archivo: `Seleccion/style.css`
- `.fighter-card .hp-wrap{ top:6px }` posiciona la barra relativa a la carta. Cambia `top` o el `padding-top` de `.fighter-card` para mantener la separación.
- El nombre está en `.fighter-name` y se renderiza entre la barra y la imagen desde `updateSelectedUI()` en `script.js`.

### 4) Mejorar/ajustar toasts o números flotantes
Archivo: `Seleccion/script.js` y `Seleccion/style.css`
- `showToast(text, type)` ahora usa Toastify (CDN). Tipos soportados: `hit`, `special`, `crit`, `miss` con estilos de color.
- `.damage-float` (CSS) controla la animación visual. Cambia las duraciones en CSS (`transition`) y en JS (`setTimeout`) para ajustar sincronización.

---
## Ejemplo práctico: cambiar probabilidad de crítico
**Nota**: El sistema CONFIG ya está implementado, por lo que este ejemplo refleja el estado actual del código.

**Pasos para modificar la probabilidad de crítico:**

1. Abrir `Seleccion/script.js`
2. Localizar el bloque CONFIG (líneas 15-25 aproximadamente):

```js
const CONFIG = {
  HP_BASE: 200,
  HP_GOLD_BONUS: 20,
  ATK_BASE: 12,
  ATK_GOLD_BONUS: 6,
  SPECIAL_BONUS: 6,
  MISS_CHANCE: 0.08,
  CRIT_CHANCE: 0.12, // <-- cambiar este valor
  CRIT_MULTIPLIER: 1.7
};
```

3. Modificar la línea `CRIT_CHANCE: 0.12` a `CRIT_CHANCE: 0.06` (para 6% de críticos)
4. Guardar el archivo
5. Refrescar `Seleccion/index.html` en el navegador y probar una pelea para verificar el cambio

**Otros ejemplos de modificaciones rápidas:**
- HP más alto: `HP_BASE: 300`
- Sin críticos: `CRIT_CHANCE: 0`
- Críticos devastadores: `CRIT_MULTIPLIER: 3.0`

---
## Consejos para testing rápido
- **Local**: Abre `Seleccion/index.html` en el navegador con ruta de archivos (no necesita servidor). Si `fetch('../Personajes/saints.json')` falla por CORS/file:// en algunos navegadores, abre con un servidor estático (ej. `npx http-server` o usar Live Server en VSCode).

- **Probar edge cases**:
  - JSON con datos incompletos (el fallback de imagen debe activarse).
  - Ejecutar `Pelear` repetidamente y confirmar que `Rematch` no duplica listeners ni genera fugas de memoria.
  - Probar tamaños de pantalla para verificar media queries y que no haya scroll horizontal.

- **Debugging común**:
  - Si las imágenes no cargan: verificar rutas en `saints.json` y que las imágenes existan en `../asetts/`
  - Si el combate no inicia: verificar que ambos luchadores estén seleccionados
- Si los toasts no aparecen: verificar que Toastify cargó correctamente (revisa la consola y los enlaces CDN en `Seleccion/index.html`).

---
## Posibles mejoras futuras (ideas)
- **Pendientes**:
  - Usar variables CSS (`--side-w`, `--gap`) en `Seleccion/style.css` para facilitar ajustes
  - Añadir pruebas unitarias para la función `calculateAttack()` (ej. exportarla y probar con mocha/jest)
  - Añadir `prefers-reduced-motion` para respetar a usuarios que deseen menos animación
  - Implementar un sistema de guardado de configuración personalizada
  - Añadir efectos de sonido para ataques y críticos

---
## Contacto rápido dentro del repo
- Si algo no funciona al cambiar valores, lo más probable es que la referencia a `hp` o `maxHp` falte. Asegúrate de que `selected.a.maxHp` y `selected.b.maxHp` estén definidos cuando renderices las vistas.

---
## Snippet exacto (ubicación y ejemplo rápido)
Si buscas el bloque `CONFIG` directamente en el código, está en:

`Seleccion/script.js` — justo después de las referencias DOM (las primeras líneas del archivo). Busca `const CONFIG = {`.

Ejemplo rápido para cambiar la probabilidad de crítico al 6%:

1. Abrir `Seleccion/script.js`.
2. Localizar el bloque:

```js
const CONFIG = {
  HP_BASE: 200,
  HP_GOLD_BONUS: 20,
  ATK_BASE: 12,
  ATK_GOLD_BONUS: 6,
  SPECIAL_BONUS: 6,
  MISS_CHANCE: 0.08,
  CRIT_CHANCE: 0.12, // <-- cambiar este valor
  CRIT_MULTIPLIER: 1.7
};
```

3. Modificar la línea `CRIT_CHANCE: 0.12` a `CRIT_CHANCE: 0.06` y guardar.

4. Refrescar `Seleccion/index.html` en el navegador y probar una pelea para comprobar el cambio.

---
## Troubleshooting (Solución de problemas comunes)

### Error: "Cannot read property 'image' of undefined"
- **Causa**: Datos faltantes en `saints.json` 
- **Solución**: Verificar que todos los personajes tengan la estructura completa: `skills: { main, special, image }`

### Las imágenes no cargan
- **Causa**: Rutas incorrectas o archivos faltantes
- **Solución**: 
  1. Verificar que las imágenes existan en la carpeta `asetts/`
  2. Comprobar que las rutas en `saints.json` sean correctas (relativas: `../asetts/`)
  3. Si usas servidor local, verificar que sirva archivos estáticos

### El combate se queda congelado
- **Causa**: Bucle infinito en combat loop
- **Solución**: Verificar que `maxRounds` esté definido (valor por defecto: 200)

### Los toasts no aparecen
- **Causa**: Toastify no cargó o el CDN falló
- **Solución**: Verificá los enlaces CDN de Toastify en `Seleccion/index.html` y revisá la consola por errores

### SweetAlert no muestra el modal del ganador
- **Causa**: Librería no cargada
- **Solución**: Verificar que el CDN de SweetAlert2 esté incluido en el HTML

---
## Información del proyecto

- **Última actualización**: Octubre 2025
- **Versión**: 1.2 (con optimizaciones de rendimiento y CONFIG centralizado)
- **Compatibilidad**: Navegadores modernos con soporte ES6+
- **Tamaño del proyecto**: ~15KB (sin imágenes)
