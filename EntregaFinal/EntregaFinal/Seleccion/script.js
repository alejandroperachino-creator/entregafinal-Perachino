const roster = document.getElementById('roster');
const fighterSlots = {
  a: document.getElementById('fighterA'),
  b: document.getElementById('fighterB')
};
const controls = {
  fight: document.getElementById('fightBtn'),
  reset: document.getElementById('resetBtn')
};
const combatLog = document.getElementById('log');

let characters = [];
let selectedFighters = { a: null, b: null };

const GAME_CONFIG = {
  BASE_HP: 200,
  GOLD_HP_BONUS: 20,
  BASE_ATK: 12,
  GOLD_ATK_BONUS: 6,
  SPECIAL_DAMAGE_BONUS: 6,
  MISS_RATE: 0.08,
  CRIT_RATE: 0.12,
  CRIT_MULTIPLIER: 1.7,
  SPECIAL_ATTACK_CHANCE: 0.2,
  MAX_COMBAT_ROUNDS: 200
};

function calculateAttackResult(attacker, defender, isSpecialAttack, randomValue) {
  const attackName = isSpecialAttack ? attacker.skills.special : attacker.skills.main;
  const damageVariance = Math.floor(Math.random() * 10) - 3;
  const specialBonus = isSpecialAttack ? GAME_CONFIG.SPECIAL_DAMAGE_BONUS : 0;
  let totalDamage = attacker.baseAtk + damageVariance + specialBonus;

  if (randomValue < GAME_CONFIG.MISS_RATE) {
    return { miss: true, attackName, newDefender: { ...defender } };
  }

  const isCritical = randomValue > 1 - GAME_CONFIG.CRIT_RATE;
  if (isCritical) {
    totalDamage = Math.floor(totalDamage * GAME_CONFIG.CRIT_MULTIPLIER);
  }

  return {
    miss: false,
    damage: totalDamage,
    isCritical,
    attackName,
    newDefender: { ...defender, hp: defender.hp - totalDamage }
  };
}

function loadCharacters() {
  fetch('../Personajes/saints.json')
    .then(response => response.json())
    .then(data => {
      characters = data.map((character, index) => {
        const isGold = character.armor_type === 'Gold';
        return {
          id: index,
          name: character.name,
          constellation: character.constellation,
          armorType: character.armor_type,
          rank: character.rank,
          skills: character.skills,
          hp: GAME_CONFIG.BASE_HP + (isGold ? GAME_CONFIG.GOLD_HP_BONUS : 0)
        };
      });
      renderCharacterRoster();
    })
    .catch(error => addLogEntry('Error cargando personajes: ' + error.message));
}

const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140"><rect width="100%" height="100%" fill="%23071e32"/><text x="50%" y="50%" fill="%23eab308" font-size="14" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" dominant-baseline="middle">No disponible</text></svg>';

function buildCharacterCard(character) {
  const card = document.createElement('div');
  card.className = 'card';

  const image = document.createElement('img');
  image.src = character.skills?.image || '';
  image.alt = character.name;
  image.onerror = () => {
    image.onerror = null;
    image.src = FALLBACK_IMAGE;
  };

  const title = document.createElement('h3');
  title.textContent = character.name;

  const details = document.createElement('p');
  details.textContent = `${character.constellation} • ${character.rank}`;

  card.append(image, title, details);
  card.addEventListener('click', () => handleCharacterSelection(character));

  return card;
}

function renderCharacterRoster() {
  roster.innerHTML = '';
  const fragment = document.createDocumentFragment();
  
  characters.forEach(character => {
    fragment.appendChild(buildCharacterCard(character));
  });
  
  roster.appendChild(fragment);
}

function handleCharacterSelection(character) {
  if (selectedFighters.a && selectedFighters.b) return;

  if (selectedFighters.a?.id === character.id) {
    selectedFighters.a = null;
  } else if (selectedFighters.b?.id === character.id) {
    selectedFighters.b = null;
  } else if (!selectedFighters.a) {
    selectedFighters.a = { ...character, maxHp: character.hp };
  } else if (!selectedFighters.b && selectedFighters.a.id !== character.id) {
    selectedFighters.b = { ...character, maxHp: character.hp };
  }

  updateFighterDisplay();
}

function updateFighterDisplay() {
  renderFighterSlot(selectedFighters.a, fighterSlots.a, 'A: (ninguno)');
  renderFighterSlot(selectedFighters.b, fighterSlots.b, 'B: (ninguno)');

  const bothSelected = selectedFighters.a && selectedFighters.b;
  controls.fight.disabled = !bothSelected;
  roster.style.display = bothSelected ? 'none' : 'grid';
  document.body.classList.toggle('battle-only', bothSelected);
}

function addLogEntry(message) {
  const entry = document.createElement('div');
  entry.textContent = message;
  combatLog.appendChild(entry);
  combatLog.scrollTop = combatLog.scrollHeight;
}

function updateHPDisplay(fighterId, currentHp, maxHp) {
  const updateSlot = (slot) => {
    const hpBar = slot.querySelector('.hp-fill');
    const hpText = slot.querySelector('.hp-text');
    if (!hpBar || !hpText) return;
    
    const percentage = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
    hpBar.style.width = `${percentage}%`;
    hpText.textContent = `HP: ${Math.max(0, currentHp)} / ${maxHp}`;
  };

  if (selectedFighters.a?.id === fighterId) updateSlot(fighterSlots.a);
  if (selectedFighters.b?.id === fighterId) updateSlot(fighterSlots.b);
}

const FIGHTER_FALLBACK = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84'><rect width='100%' height='100%' fill='%2307121a'/><text x='50%' y='50%' fill='%23eab308' font-size='10' font-family='Arial, Helvetica, sans-serif' text-anchor='middle' dominant-baseline='middle'>No img</text></svg>";

function buildFighterHTML(fighter) {
  return `
    <div class="fighter-preview">
      <div class="preview-info">
        <div class="hp-wrap">
          <div class="hp-bar"><div class="hp-fill" style="width:100%"></div></div>
          <div class="hp-text">HP: ${fighter.hp} / ${fighter.maxHp}</div>
        </div>
        <div class="fighter-name"><strong>${fighter.name}</strong></div>
      </div>
      <img src="${fighter.skills.image}" alt="${fighter.name}" onerror="this.onerror=null;this.src='${FIGHTER_FALLBACK}'">
    </div>`;
}

function renderFighterSlot(fighter, slot, emptyText) {
  if (fighter) {
    slot.classList.remove('empty');
    slot.innerHTML = buildFighterHTML(fighter);
  } else {
    slot.classList.add('empty');
    slot.innerHTML = emptyText;
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function createFloatingDamageElement(container, text, type) {
  if (!container) return;
  
  const element = document.createElement('div');
  element.className = `damage-float ${type || 'hit'}`;
  element.textContent = text;
  element.style.cssText = 'left:50%;top:18px;transform:translate(-50%,0)';
  
  container.appendChild(element);
  
  requestAnimationFrame(() => {
    element.style.transform = 'translate(-50%, -56px)';
    element.style.opacity = '0';
  });
  
  setTimeout(() => element.remove(), 1000);
}

async function startCombat() {
  if (!selectedFighters.a || !selectedFighters.b) return;

  const fighters = {
    a: {
      ...selectedFighters.a,
      hp: selectedFighters.a.hp,
      baseAtk: GAME_CONFIG.BASE_ATK + (selectedFighters.a.armorType === 'Gold' ? GAME_CONFIG.GOLD_ATK_BONUS : 0)
    },
    b: {
      ...selectedFighters.b,
      hp: selectedFighters.b.hp,
      baseAtk: GAME_CONFIG.BASE_ATK + (selectedFighters.b.armorType === 'Gold' ? GAME_CONFIG.GOLD_ATK_BONUS : 0)
    }
  };

  addLogEntry(`Comienza la pelea: ${fighters.a.name} vs ${fighters.b.name}`);

  let attacker = Math.random() < 0.5 ? fighters.a : fighters.b;
  let defender = attacker === fighters.a ? fighters.b : fighters.a;
  addLogEntry(`${attacker.name} toma la iniciativa.`);

  let roundCount = 0;
  while (fighters.a.hp > 0 && fighters.b.hp > 0 && roundCount < GAME_CONFIG.MAX_COMBAT_ROUNDS) {
    const attackResult = executeAttack(attacker, defender);
    await delay(attackResult.miss ? 700 : 900);
    [attacker, defender] = [defender, attacker];
    roundCount++;
  }

  const winner = determineWinner(fighters.a, fighters.b);
  addLogEntry(`Ganador: ${winner.name}`);
  showVictoryModal(winner);
}

function executeAttack(attacker, defender) {
  const isSpecial = Math.random() < GAME_CONFIG.SPECIAL_ATTACK_CHANCE;
  const random = Math.random();
  const result = calculateAttackResult(attacker, defender, isSpecial, random);

  const targetSlot = (selectedFighters.a?.id === defender.id) ? fighterSlots.a : fighterSlots.b;

  if (result.miss) {
    addLogEntry(`${attacker.name} intenta ${result.attackName} pero falla!`);
    createFloatingDamageElement(targetSlot, 'Miss', 'miss');
    return { miss: true };
  }

  defender.hp = result.newDefender.hp;
  updateHPDisplay(defender.id, defender.hp, defender.maxHp);
  
  const damageType = result.isCritical ? 'crit' : (isSpecial ? 'special' : 'hit');
  createFloatingDamageElement(targetSlot, `-${result.damage}`, damageType);
  
  const critText = result.isCritical ? '(CRIT) ' : '';
  addLogEntry(`${attacker.name} usa ${result.attackName} ${critText}y hace ${result.damage} → ${defender.name} HP ${Math.max(0, defender.hp)}`);
  
  return { damage: result.damage, isCritical: result.isCritical };
}

function determineWinner(fighterA, fighterB) {
  if (fighterA.hp > 0 && fighterB.hp <= 0) return fighterA;
  if (fighterB.hp > 0 && fighterA.hp <= 0) return fighterB;
  return fighterA.hp > fighterB.hp ? fighterA : fighterB;
}

function showVictoryModal(winner) {
  if (!window.Swal) return;

  Swal.fire({
    position: 'center',
    width: 620,
    title: `Ganador: ${winner.name}`,
    html: `<div style="display:flex;gap:16px;align-items:center;justify-content:center">
      <img src="${winner.skills.image}" alt="${winner.name}" 
           onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'240\\' height=\\'240\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%2307121a\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%23eab308\\' font-size=\\'14\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>No img</text></svg>'" 
           style="width:240px;height:240px;object-fit:contain;border-radius:10px">
      <div style="text-align:left">
        <strong>${winner.name}</strong>
        <div style="font-size:14px;color:#ddd">${winner.constellation} • ${winner.rank}</div>
      </div>
    </div>`,
    showCancelButton: true,
    confirmButtonText: 'Rematch',
    cancelButtonText: 'Reiniciar',
    allowOutsideClick: false
  }).then(result => {
    if (result.isConfirmed) {
      combatLog.innerHTML = '';
      setTimeout(() => startCombat(), 300);
    } else {
      resetGame();
    }
  });
}

function resetGame() {
  selectedFighters = { a: null, b: null };
  combatLog.innerHTML = '';
  roster.style.display = 'grid';
  document.body.classList.remove('battle-only');
  updateFighterDisplay();
}

controls.fight.addEventListener('click', startCombat);
controls.reset.addEventListener('click', resetGame);

loadCharacters();
