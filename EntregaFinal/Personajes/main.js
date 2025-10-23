/*
  Archivo: Personajes/main.js
  Notas: render del roster, manejo de fallback de imagen y modal de detalles con SweetAlert.
*/
// Fetch de los santos de saints.json file
fetch('saints.json')
    .then(response => response.json())
    .then(saints => {
        const container = document.getElementById('character-container');
        
        // Loop entre el array de santos en JSON
        saints.forEach(saint => {
            // Crear el elemento principal de la tarjeta
            const card = document.createElement('div');
            card.classList.add('character-card');
            card.classList.add(saint.armor_type.toLowerCase().replace(' ', '-'));

            // Crear el contenido HTML interno para la tarjeta
            card.innerHTML = `
                <img src="${saint.skills.image}" alt="${saint.name}" class="character-image">
                <div class="card-content">
                    <h2 class="character-name">${saint.name}</h2>
                    <p class="character-rank">${saint.rank}</p>
                    <p class="character-constellation">Constellation: ${saint.constellation}</p>
                    <p class="character-armor">Armor: ${saint.armor_type}</p>
                    <button class="details-button">Details</button>
                </div>
            `;

            // Append en el nuevo card al container
            container.appendChild(card);

            // agregar una robusta imagen de respaldo en caso de que la imagen remota no se cargue
            const imgEl = card.querySelector('.character-image');
            if (imgEl) {
                imgEl.addEventListener('error', () => {
                    imgEl.onerror = null;
                });
            }

            // agregar un listener de evento click al botón "Details"
            const detailsButton = card.querySelector('.details-button');
            detailsButton.addEventListener('click', () => {
                // usar SweetAlert para mostrar los detalles del personaje
                Swal.fire({
                    title: `**${saint.name}**`,
                    html: `
                    <div class="swal-details-container">
                        <img src="${saint.skills.image}" alt="${saint.name}" class="swal-image" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\'><rect width=\'100%\' height=\'100%\' fill=\'%231a1a2e\'/><text x=\'50%\' y=\'50%\' fill=\'%23e5b22b\' font-size=\'14\' font-family=\'Arial, Helvetica, sans-serif\' text-anchor=\'middle\' dominant-baseline=\'middle\'>Imagen no disponible</text></svg>'">
                        <div class="swal-text-content">
                            <p><strong>Rank:</strong> ${saint.rank}</p>
                            <p><strong>Constellation:</strong> ${saint.constellation}</p>
                            <p><strong>Armor:</strong> ${saint.armor_type}</p>
                            <p><strong>Main Skill:</strong> ${saint.skills.main}</p>
                            <p><strong>Special Skill:</strong> ${saint.skills.special}</p>
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
            });
        });
    })
    .catch(error => console.error('Error fetching saints:', error));
