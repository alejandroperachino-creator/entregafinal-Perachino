/*
  Archivo: Seleccion/script.js
  Notas: lógica de selección y simulador de combate (HP, ataques, toasts, modal ganador).
*/
const rosterEl = document.getElementById('roster');
const fighterAEl = document.getElementById('fighterA');
const fighterBEl = document.getElementById('fighterB');
const fightBtn = document.getElementById('fightBtn');
const resetBtn = document.getElementById('resetBtn');
const logEl = document.getElementById('log');

let saints = [];
let selected = { a: null, b: null };

// Configuración centralizada para balance
/*
CONFIG — constantes de balance del combate

Campos:
  HP_BASE          - Vida base que reciben todos los personajes al cargar
  HP_GOLD_BONUS    - Bonus adicional de HP para armaduras Gold
  ATK_BASE         - Ataque base usado para calcular daño normal
  ATK_GOLD_BONUS   - Bonus de ataque para armaduras Gold
  SPECIAL_BONUS    - Daño extra aplicado cuando se usa el ataque especial
  MISS_CHANCE      - Probabilidad (0..1) de que un ataque falle
  CRIT_CHANCE      - Probabilidad (0..1) de golpe crítico
  CRIT_MULTIPLIER  - Multiplicador aplicado al daño en crítico

Ejemplo: para bajar la probabilidad de crítico al 6% cambia CRIT_CHANCE a 0.06
*/
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

/**
 * calculateAttack - Función pura que calcula el resultado de un ataque sin efectos secundarios.
 * Está ubicada en el tope del archivo para poder exportarla o testearla fácilmente.
 * @param {Object} attacker - objeto atacante (debe contener baseAtk y skills)
 * @param {Object} defender - objeto defensor (debe contener hp)
 * @param {boolean} useSpecial - si se está usando el ataque especial
 * @param {number} r - número aleatorio en [0,1) para determinar miss/crit
 * @returns {{ miss: boolean, damage?: number, isCrit?: boolean, attackName: string, newDefender: Object }}
 */
function calculateAttack(attacker, defender, useSpecial, r) {
  const attackName = useSpecial ? attacker.skills.special : attacker.skills.main;
  // varianza aleatoria entre -3 y 6 (mismo rango que rand(-3,6))
  const variance = Math.floor(Math.random() * 10) - 3;
  let damage = attacker.baseAtk + variance + (useSpecial ? CONFIG.SPECIAL_BONUS : 0);

  if (r < CONFIG.MISS_CHANCE) {
    return { miss: true, attackName, newDefender: { ...defender } };
  }

  let isCrit = false;
  if (r > 1 - CONFIG.CRIT_CHANCE) {
    isCrit = true;
    damage = Math.floor(damage * CONFIG.CRIT_MULTIPLIER);
  }

  const newDefender = { ...defender, hp: defender.hp - damage };
  return { miss: false, damage, isCrit, attackName, newDefender };
}

function loadSaints() {
  fetch('../Personajes/saints.json')
    .then(res => res.json())
    .then(data => {
      saints = data.map((s, i) => ({
        id: i,
        name: s.name,
        constellation: s.constellation,
        armor_type: s.armor_type,
        rank: s.rank,
        skills: s.skills,
  hp: CONFIG.HP_BASE + (s.armor_type === 'Gold' ? CONFIG.HP_GOLD_BONUS : 0) // escala de HP base
      }));
      renderRoster();
    })
    .catch(err => {
      log('Error cargando personajes: ' + err.message);
    });
}

/**
 * Crea una tarjeta de personaje usando DOM creation en lugar de innerHTML
 * @param {Object} saint - objeto del personaje
 * @returns {HTMLElement} elemento DOM de la tarjeta
 */
function createCharacterCard(saint) {
  const card = document.createElement('div');
  card.className = 'card';

  // Crear imagen con fallback
  const img = document.createElement('img');
  img.src = saint.skills && saint.skills.image ? saint.skills.image : '';
  img.alt = saint.name;
  img.addEventListener('error', () => {
    img.onerror = null;
    img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140"><rect width="100%" height="100%" fill="%23071e32"/><text x="50%" y="50%" fill="%23eab308" font-size="14" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" dominant-baseline="middle">No disponible</text></svg>';
  });

  // Crear título
  const title = document.createElement('h3');
  title.textContent = saint.name;

  // Crear información
  const info = document.createElement('p');
  info.textContent = `${saint.constellation} • ${saint.rank}`;

  // Ensamblar tarjeta
  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(info);

  // Agregar event listener
  card.addEventListener('click', () => onSelect(saint));

  return card;
}

function renderRoster() {
  rosterEl.innerHTML = '';
  
  // Usar DocumentFragment para mejor performance
  const fragment = document.createDocumentFragment();
  
  saints.forEach(saint => {
    const card = createCharacterCard(saint);
    fragment.appendChild(card);
  });
  
  rosterEl.appendChild(fragment);
}

function onSelect(s) {
  // si los dos ya están seleccionados, no hacer nada
  if (selected.a && selected.b) return;

  // Alternar selección antes de que ambos estén elegidos
  if (selected.a && selected.a.id === s.id) {
    // deseleccionar A si se hace clic en él de nuevo (permitido antes de que ambos estén establecidos)
    selected.a = null;
  } else if (selected.b && selected.b.id === s.id) {
    // deseleccionar B
    selected.b = null;
  } else if (!selected.a) {
    // seleccionar como A (primera selección)
    selected.a = { ...s };
    // configurar HP máximo para la vista previa
    selected.a.maxHp = selected.a.hp;
  } else if (!selected.b) {
    // seleccionar como B (segunda selección)
    if (selected.a.id === s.id) return; // no se puede seleccionar el mismo que A
    selected.b = { ...s };
    selected.b.maxHp = selected.b.hp;
  }

  updateSelectedUI();
}

function updateSelectedUI() {
  // Actualizar vista del luchador A
  updateFighterUI(selected.a, fighterAEl, 'A: (ninguno)');
  
  // Actualizar vista del luchador B
  updateFighterUI(selected.b, fighterBEl, 'B: (ninguno)');

  // Habilitar botón de pelea solo si ambos luchadores están seleccionados
  fightBtn.disabled = !(selected.a && selected.b);

  // Controlar visibilidad del roster y modo batalla
  if (selected.a && selected.b) {
    rosterEl.style.display = 'none';
    document.body.classList.add('battle-only');
  } else {
    rosterEl.style.display = 'grid';
    document.body.classList.remove('battle-only');
  }
}

function log(msg) {
  const p = document.createElement('div');
  p.textContent = msg;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

// actualizar la barra de hp  
function updatePreviewHPById(id, hp, maxHp) {
  // encontrar qué vista previa actualizar (A o B)
  const updateEl = (el) => {
    const fill = el.querySelector('.hp-fill');
    const text = el.querySelector('.hp-text');
    if (!fill || !text) return;
    const pct = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
    fill.style.width = pct + '%';
    text.textContent = `HP: ${Math.max(0, hp)} / ${maxHp}`;
  };

  // verificar A
  if (selected.a && selected.a.id === id) updateEl(fighterAEl);
  // verificar B
  if (selected.b && selected.b.id === id) updateEl(fighterBEl);
}

/**
 * Crea el HTML para la vista previa de un luchador
 * @param {Object} fighter - objeto del luchador con name, hp, maxHp, skills
 * @returns {string} HTML string para la vista previa
 */
function createFighterPreviewHTML(fighter) {
  const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84'><rect width='100%' height='100%' fill='%2307121a'/><text x='50%' y='50%' fill='%23eab308' font-size='10' font-family='Arial, Helvetica, sans-serif' text-anchor='middle' dominant-baseline='middle'>No img</text></svg>";
  
  return `
    <div class="fighter-preview">
      <div class="preview-info">
        <div class="hp-wrap">
          <div class="hp-bar"><div class="hp-fill" style="width:100%"></div></div>
          <div class="hp-text">HP: ${fighter.hp} / ${fighter.maxHp}</div>
        </div>
        <div class="fighter-name"><strong>${fighter.name}</strong></div>
      </div>
      <img src="${fighter.skills.image}" alt="${fighter.name}" onerror="this.onerror=null;this.src='${fallbackSvg}'">
    </div>`;
}

/**
 * Actualiza la UI de un luchador específico (A o B)
 * @param {Object} fighter - objeto del luchador o null
 * @param {HTMLElement} element - elemento DOM a actualizar
 * @param {string} emptyText - texto a mostrar cuando no hay luchador
 */
function updateFighterUI(fighter, element, emptyText) {
  if (fighter) {
    element.classList.remove('empty');
    element.innerHTML = createFighterPreviewHTML(fighter);
  } else {
    element.classList.add('empty');
    element.innerHTML = emptyText;
  }
}

async function fight() {
  if (!selected.a || !selected.b) return;

  // clonar los personajes para la pelea con hp mutable y stats base
  const a = { ...selected.a, hp: selected.a.hp, baseAtk: CONFIG.ATK_BASE + (selected.a.armor_type === 'Gold' ? CONFIG.ATK_GOLD_BONUS : 0) };
  const b = { ...selected.b, hp: selected.b.hp, baseAtk: CONFIG.ATK_BASE + (selected.b.armor_type === 'Gold' ? CONFIG.ATK_GOLD_BONUS : 0) };

  log(`Comienza la pelea: ${a.name} vs ${b.name}`);

  // utilidades internas
  // Funciones de utilidad para aleatoriedad
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

  function showToast(text, type) {
    // Mostrar toast con Toastify (CDN cargado en index.html)
    if (typeof Toastify !== 'function') return;
    const optsByType = {
      hit: {
        background: 'linear-gradient(90deg,#2b9cff,#1f77d1)',
        color: '#fff'
      },
      special: {
        background: 'linear-gradient(90deg,#a179ff,#7b4cff)',
        color: '#fff'
      },
      crit: {
        background: 'linear-gradient(90deg,#ffcc00,#ffb300)',
        color: '#111'
      },
      miss: {
        background: 'rgba(255,255,255,0.06)',
        color: '#eee',
        className: 'toast-miss'
      }
    };
    const style = optsByType[type] || optsByType.hit;
    Toastify({
      text,
      duration: 1600,
      gravity: 'bottom',
      position: 'right',
      close: false,
      stopOnFocus: true,
      style: { background: style.background, color: style.color, fontWeight: '800' },
      className: style.className || ''
    }).showToast();
  }

  function performAttack(attacker, defender) {
    // Ahora delegamos el cálculo puro a `calculateAttack` para separar lógica y efectos.
    const useSpecial = Math.random() < 0.2;
    const r = Math.random();
    const calc = calculateAttack(attacker, defender, useSpecial, r);

    // Si falló, mostrar efectos visuales y salir temprano
    if (calc.miss) {
      const attackName = calc.attackName;
      log(`${attacker.name} intenta ${attackName} pero falla!`);
      showToast(`${attacker.name} falla ${attackName}`, 'miss');
      const targetEl = (selected.a && selected.a.id === defender.id) ? fighterAEl : fighterBEl;
      createFloatingDamage(targetEl, 'Miss', 'miss');
      return { miss: true };
    }

    // Aplicar el resultado calculado al defensor (mutación local del objeto de pelea)
    const damage = calc.damage;
    const isCrit = calc.isCrit;
    defender.hp = calc.newDefender.hp;

    // actualizar vista y mostrar efectos
    updatePreviewHPById(defender.id, defender.hp, defender.maxHp || (defender.hp + damage));
    const targetEl = (selected.a && selected.a.id === defender.id) ? fighterAEl : fighterBEl;
    createFloatingDamage(targetEl, `-${damage}`, isCrit ? 'crit' : (useSpecial ? 'special' : 'hit'));
    log(`${attacker.name} usa ${calc.attackName} ${isCrit ? '(CRIT) ' : ''}y hace ${damage} → ${defender.name} HP ${Math.max(0, defender.hp)}`);
    showToast(`${attacker.name} usa ${calc.attackName} ${isCrit ? 'CRIT! ' : ''}-${damage}`, isCrit ? 'crit' : (useSpecial ? 'special' : 'hit'));
    return { damage, isCrit };
  }

  // crear daño flotante sobre la imagen del luchador
  function createFloatingDamage(containerEl, text, type) {
    if (!containerEl) return;
    const floatEl = document.createElement('div');
    floatEl.className = 'damage-float ' + (type || 'hit');
    floatEl.textContent = text;
    // posicionarlo relativo al contenedor: absolute dentro de .fighter-card
    // ponerlo centrado horizontalmente y un poco arriba de la imagen
    floatEl.style.left = '50%';
    floatEl.style.top = '18px';
    floatEl.style.transform = 'translate(-50%, 0)';
    containerEl.appendChild(floatEl);
    // forzar reflow para animación 
    requestAnimationFrame(() => {
      floatEl.style.transform = 'translate(-50%, -56px)';
      floatEl.style.opacity = '0';
    });
    // remover después de la animación
    setTimeout(() => { if (floatEl && floatEl.parentNode) floatEl.parentNode.removeChild(floatEl); }, 1000);
  }

  // Aleatorio para quien empieza
  let attacker = Math.random() < 0.5 ? a : b;
  let defender = attacker === a ? b : a;
  log(`${attacker.name} toma la iniciativa.`);

  // bucle de pelea hasta que uno muere o se alcanza el máximo de rondas
  let rounds = 0;
  const maxRounds = 200;
  while (a.hp > 0 && b.hp > 0 && rounds < maxRounds) {
    // realizar ataque y esperar un poco para que el usuario pueda ver el toast/log
    const result = performAttack(attacker, defender);
    // esperar un pequeño retraso independientemente; más largo cuando ocurrió daño
    await sleep(result && result.miss ? 700 : 900);
    // intercambiar
    [attacker, defender] = [defender, attacker];
    rounds++;
  }

  const winner = a.hp > 0 && b.hp <= 0 ? a : (b.hp > 0 && a.hp <= 0 ? b : (a.hp > b.hp ? a : b));
  log(`Ganador: ${winner.name}`);

  // mostrar modal con el ganador usando SweetAlert2
  if (window.Swal) {
    Swal.fire({
      position: 'center',
      width: 620,
      title: `Ganador: ${winner.name}`,
        html: `<div style="display:flex;gap:16px;align-items:center;justify-content:center"><img src="${winner.skills.image}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'><rect width=\'100%\' height=\'100%\' fill=\'%2307121a\'/><text x=\'50%\' y=\'50%\' fill=\'%23eab308\' font-size=\'14\' font-family=\'Arial, Helvetica, sans-serif\' text-anchor=\'middle\' dominant-baseline=\'middle\'>No img</text></svg>'" style="width:240px;height:240px;object-fit:contain;border-radius:10px"><div style="text-align:left"><strong>${winner.name}</strong><div style="font-size:14px;color:#ddd">${winner.constellation} • ${winner.rank}</div></div></div>`,
      showCancelButton: true,
      confirmButtonText: 'Rematch',
      cancelButtonText: 'Reiniciar',
      allowOutsideClick: false
    }).then(result => {
      if (result.isConfirmed) {
            // Rematch: reiniciar la pelea con los mismos luchadores
            logEl.innerHTML = '';
            // pequeño retraso para dejar que el modal se cierre
            setTimeout(() => fight(), 300);
      } else {
        // Reiniciar
        reset();
      }
    });
  }
}

function reset() {
  selected = { a: null, b: null };
  logEl.innerHTML = '';
  // mostrar roster de nuevo
  rosterEl.style.display = 'grid';
  document.body.classList.remove('battle-only');
  updateSelectedUI();
}

fightBtn.addEventListener('click', fight);
resetBtn.addEventListener('click', reset);

loadSaints();
