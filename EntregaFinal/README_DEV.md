# README_DEV — Guía para desarrolladores

Este README pequeño y directo está pensado para que cualquier desarrollador que abra este proyecto entienda rápidamente la estructura, las piezas clave y cómo realizar cambios habituales (p. ej. ajustar probabilidades de crítico). Está en español y contiene punteros a los archivos más relevantes y ejemplos prácticos.

---
## Resumen rápido
- Tecnologías: HTML, CSS y JavaScript . No hay build system.
- Páginas principales:
  - `Personajes/` — listado de poersonajes y datos JSON.
  - `Seleccion/` — selector de dos luchadores y simulador de pelea.
- Librerías externas (CDN): SweetAlert2 (modales) y Toastify (estilos, aunque el sistema de toasts en la pelea está implementado en DOM).

---
## Autor y contribución (para entrega)

Qué implementé :
- Implementé la interfaz de selección y las tarjetas de personaje en `Seleccion/index.html` y `Personajes/index.html`.
- Implementé la lógica de combate en `Seleccion/script.js` (turnos, cálculo de daño, fallos, críticos y especiales).
- Integré la barra de HP que se actualiza en tiempo real, números flotantes de daño y toasts inline para feedback visual.
- Ajusté los estilos en `Seleccion/style.css` y `Personajes/style.css` para que las cartas y la caja de combate se vean correctamente en pantalla.

Nota para el profesor:  desarrollé y probé los cambios manualmente en el navegador. Este README explica las decisiones de diseño y los puntos donde se pueden ajustar parámetros de balance.

---
## Estructura de archivos (puntos de interés)
- `Personajes/index.html` — página del roster. Contiene el contenedor `#character-container` donde `main.js` inyecta las tarjetas.
- `Personajes/main.js` — carga `saints.json`, genera las tarjetas de personaje y muestra el modal de detalles (SweetAlert).
- `Personajes/style.css` — estilos del roster y del modal de detalles.
- `Personajes/saints.json` — datos de los personajes (nombre, constelación, tipo de armadura, rango y `skills` con `main`, `special` e `image`).

- `Seleccion/index.html` — interfaz de selección y batalla. Contiene la grilla con `#fighterA`, `#damage-box` y `#fighterB`.
- `Seleccion/script.js` — lógica principal: carga los `saints`, render del roster en esta página, selección de A/B, simulación de combate, toasts inline, números flotantes y modal de ganador.
- `Seleccion/style.css` — estilos para la grilla de batalla, tarjetas laterales, caja de daño central, barra de HP, animaciones de números flotantes y responsive.

---
## Flujo funcional (cómo interactúan los archivos)
1. El roster se muestra (ya sea desde `Personajes/` o desde `Seleccion/` que también carga el JSON).
2. En `Seleccion/` el usuario selecciona dos personajes (primero A, luego B). Los previews se muestran con `HP` y `nombre`.
3. Al pulsar `Pelear`, `Seleccion/script.js` ejecuta `fight()` que corre un bucle asíncrono de turnos:
   - decide atacante/defensor
   - calcula daño (incluye `miss`, `crit`, `special`)
   - actualiza la barra de HP y muestra toasts/números flotantes
4. Al terminar, muestra un modal con el ganador (SweetAlert). Opciones: `Rematch` o `Reiniciar`.

---
## Puntos clave del código y dónde hacer cambios comunes
A continuación se listan los lugares más habituales donde trabajarás y qué buscar:

### 1 Cambiar valores de combate (hp base, daño base, chances)
Archivo: `Seleccion/script.js`
- HP base al cargar personajes (en `loadSaints()`):
  ```js
  hp: 200 + (s.armor_type === 'Gold' ? 20 : 0)
  ```
  Cambia `200` o el bonus `20` si quieres otro balance inicial.

- Daño base / estadística de ataque en `fight()` al clonar los luchadores:
  ```js
  const a = { ...selected.a, hp: selected.a.hp, baseAtk: 12 + (selected.a.armor_type === 'Gold' ? 6 : 0) };
  ```
  Cambia `12` o el bonus `6` para ajustar el poder base.

- Probabilidades y multiplicadores (en `performAttack()`):
  - Probabilidad de fallo: `8%` (if r < 0.08)
  - Probabilidad de crítico: `12%` (if r > 0.88)
  - Multiplicador de crítico: `1.7` (damage = Math.floor(damage * 1.7))

  Ejemplo: para reducir la probabilidad de crítico al `6%`, edita la condición `if (r > 0.88)` a `if (r > 0.94)` — o mejor, convierte estos valores a constantes (ver ejemplo práctico abajo).

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
- `showToast(text, type)` crea spans `.inline-toast` en `#inline-toasts` dentro de la `damage-box`.
- `.damage-float` (CSS) controla la animación visual. Cambia las duraciones en CSS (`transition`) y en JS (`setTimeout`) para ajustar sincronización.

---
## Ejemplo práctico: reducir la probabilidad de crítico (mejorar mantenibilidad)
Recomendación: extraer constantes al principio de `Seleccion/script.js` en lugar de tocar números repartidos por el código.

1) En la parte superior de `Seleccion/script.js` (después de las referencias DOM), añade un bloque `CONFIG` como este:
```js
// Configuración de combate (ajusta aquí para balancear)
const CONFIG = {
  HP_BASE: 200,
  HP_GOLD_BONUS: 20,
  ATK_BASE: 12,
  ATK_GOLD_BONUS: 6,
  SPECIAL_BONUS: 6,
  MISS_CHANCE: 0.08,
  CRIT_CHANCE: 0.12,
  CRIT_MULTIPLIER: 1.7
};
```

2) Reemplaza los literales en el código por referencias a `CONFIG`. Ejemplos:
- HP al cargar:
```js
hp: CONFIG.HP_BASE + (s.armor_type === 'Gold' ? CONFIG.HP_GOLD_BONUS : 0)
```
- baseAtk:
```js
const a = { ...selected.a, hp: selected.a.hp, baseAtk: CONFIG.ATK_BASE + (selected.a.armor_type === 'Gold' ? CONFIG.ATK_GOLD_BONUS : 0) };
```
- comprobaciones de fallo/crítico dentro de `performAttack()`:
```js
if (r < CONFIG.MISS_CHANCE) { /* miss */ }
if (r > 1 - CONFIG.CRIT_CHANCE) { /* crit */ }
```
- multiplicador:
```js
if (isCrit) damage = Math.floor(damage * CONFIG.CRIT_MULTIPLIER);
```

3) Para reducir la probabilidad de crítico al 6% simplemente cambia `CRIT_CHANCE: 0.06` en el `CONFIG`.

Este patrón centraliza las reglas de balance y facilita experimentación.

---
## Consejos para testing rápido
- Local: abre `Seleccion/index.html` en el navegador con ruta de archivos (no necesita servidor). Si `fetch('../Personajes/saints.json')`

- Probar edge cases:
  - JSON con datos incompletos (el fallback de imagen debe activarse).
  - Ejecutar `Pelear` repetidamente y confirmar que `Rematch` no duplica listeners ni genera fugas de memoria.
  - Probar tamaños de pantalla para verificar media queries y que no haya scroll horizontal.

---
## Posibles mejoras futuras (ideas)
- Extraer constantes en `Seleccion/script.js` (ya mostrado) y en `Seleccion/style.css` usar variables CSS (`--side-w`, `--gap`) para facilitar ajustes.
- Reemplazar `innerHTML` en `updateSelectedUI()` por DOM creation para evitar problemas de escape/seguridad.
- Añadir pruebas unitarias para la función de cálculo de daño (ej. exportarla y probar con mocha/jest).
- Añadir `prefers-reduced-motion` para respetar a usuarios que deseen menos animación.

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
