const FALLBACK_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='%231a1a2e'/><text x='50%' y='50%' fill='%23e5b22b' font-size='14' font-family='Arial, Helvetica, sans-serif' text-anchor='middle' dominant-baseline='middle'>Imagen no disponible</text></svg>";

function createCharacterCard(character) {
  const card = document.createElement('div');
  card.classList.add('character-card', character.armor_type.toLowerCase().replace(' ', '-'));

  card.innerHTML = `
    <img src="${character.skills.image}" alt="${character.name}" class="character-image">
    <div class="card-content">
      <h2 class="character-name">${character.name}</h2>
      <p class="character-rank">${character.rank}</p>
      <p class="character-constellation">Constellation: ${character.constellation}</p>
      <p class="character-armor">Armor: ${character.armor_type}</p>
      <button class="details-button">Details</button>
    </div>
  `;

  const image = card.querySelector('.character-image');
  if (image) {
    image.addEventListener('error', () => { image.onerror = null; });
  }

  const detailsButton = card.querySelector('.details-button');
  detailsButton.addEventListener('click', () => showCharacterDetails(character));

  return card;
}

function showCharacterDetails(character) {
  Swal.fire({
    title: `**${character.name}**`,
    html: `
      <div class="swal-details-container">
        <img src="${character.skills.image}" alt="${character.name}" class="swal-image" 
             onerror="this.onerror=null;this.src='${FALLBACK_SVG}'">
        <div class="swal-text-content">
          <p><strong>Rank:</strong> ${character.rank}</p>
          <p><strong>Constellation:</strong> ${character.constellation}</p>
          <p><strong>Armor:</strong> ${character.armor_type}</p>
          <p><strong>Main Skill:</strong> ${character.skills.main}</p>
          <p><strong>Special Skill:</strong> ${character.skills.special}</p>
        </div>
      </div>
    `,
    showCloseButton: true,
    confirmButtonText: 'Genial',
    width: 600,
    background: '#1a1a2e',
    color: '#fff',
    customClass: {
      container: 'swal-custom-container',
      title: 'swal-title-custom',
      confirmButton: 'swal-confirm-button'
    }
  });
}

async function loadCharacters() {
  try {
    const response = await fetch('saints.json');
    const characters = await response.json();
    const container = document.getElementById('character-container');
    
    characters.forEach(character => {
      container.appendChild(createCharacterCard(character));
    });
  } catch (error) {
    console.error('Error loading characters:', error);
  }
}

loadCharacters();
