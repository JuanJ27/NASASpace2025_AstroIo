/**
 * Ginkgo's Custom Functions - Floating Information Cards System
 */

class FloatingCardsManager {
  constructor() {
    this.cards = [];
    this.shownCardIds = new Set();
    this.currentCard = null;
    this.isAnimating = false;
    this.cardContainer = null;
    
    this.initializeCardContainer();
    this.loadCards();
  }

  /**
   * Inicializar contenedor de tarjetas
   */
  initializeCardContainer() {
    // Crear contenedor si no existe
    if (!document.getElementById('floatingCardContainer')) {
      const container = document.createElement('div');
      container.id = 'floatingCardContainer';
      document.body.appendChild(container);
    }
    this.cardContainer = document.getElementById('floatingCardContainer');
  }

  /**
   * Cargar tarjetas desde JSON
   */
  loadCards() {
    // Definir tarjetas (pueden cargarse desde archivo JSON externo)
    this.cards = [
      {
        "id": 1,
        "points_threshold": 28,
        "scale": "5 nm (Nanometers)",
        "title": "Transistor Gate",
        "description": "Tiny transistor gates power smartphones, laptops and appliances — microscopic switches that control electronic signals.",
        "image": "1_transistor_gate.webp",
        "timeOut": 12
      },
      {
        "id": 2,
        "points_threshold": 46,
        "scale": "60 nm (Nanometers)",
        "title": "Ultraviolet Wavelength",
        "description": "60 nm ultraviolet is invisible but energetic — it can break molecules; ozone blocks it so only space probes detect it.",
        "image": "2_ultraviolet_wave.webp",
        "timeOut": 12
      },
      {
        "id": 3,
        "points_threshold": 90,
        "scale": "100 µm (Micrometers)",
        "title": "Human Hair Width",
        "description": "Human hair varies: straight is cylindrical, curly is flattened to curl. You likely have 50,000-200,000 strands.",
        "image": "3_human_hair.webp",
        "timeOut": 12
      },
      {
        "id": 4,
        "points_threshold": 110,
        "scale" : "5 mm (millimeters)",
        "title": "Rice Grain & Ant",
        "description": "Ants and rice grains (~4-5 mm) are similar in size. You'd eat ~300M grains in a lifetime; ants outnumber people 1M:1.",
        "image": "4_rice_ant.webp",
        "timeOut": 12
      },
      {
        "id": 5,
        "points_threshold": 145,
        "scale" : "6 m (Meters)",
        "title": "Giraffe Height",
        "description": "Giraffes reach ~6 m tall; their necks are nearly half their height. Predators must topple them to kill them.",
        "image": "5_giraffe.webp",
        "timeOut": 12
      },
      {
        "id": 6,
        "points_threshold": 168,
        "scale" : "~ 1 Km (Kilometers)",
        "title": "Burj Khalifa",
        "description": "Burj Khalifa is the world's tallest building at 828 m; it even has a swimming pool on the 76th floor.",
        "image": "6_burj_khalifa.webp",
        "timeOut": 12
      },
      {
        "id": 7,
        "points_threshold": 185,
        "scale" : "~ 24-35 Km (Kilometers)",
        "title": "Neutron Star",
        "description": "Neutron stars are super-dense stellar remnants: more mass than the Sun packed into ~20 km across.",
        "image": "7_neutron_star.webp",
        "timeOut": 12
      },
        {
        "id": 8,
        "points_threshold": 209,
        "title": "Io - Jupiter's Volcanic Moon",
        "scale": "~3.6 Mm (Megameters)",
        "description": "Jupiter's pizza-looking moon with over 400 active volcanoes! The most volcanically active place in the solar system.",
        "image": "8_io_moon.webp",
        "timeOut": 12
      },
      {
        "id": 9,
        "points_threshold": 248,
        "title": "The Sun - Our Stellar Furnace",
        "scale": "~696 Mm (Megameters)",
        "description": "A giant ball of plasma converting 600 million tons of hydrogen into helium every second. You could fit 1.3 million Earths inside!",
        "image": "9_sun.webp",
        "timeOut": 12
      },
      {
        "id": 10,
        "points_threshold": 269,
        "title": "All Humans Stacked Up",
        "scale": "~13.2 Gm (Gigameters)",
        "description": "If all 8 billion people stood on each other's shoulders, we'd reach 88 times the distance from Earth to the Moon!",
        "image": "10_human_tower.webp",
        "timeOut": 12
      },
      {
        "id": 11,
        "points_threshold": 294,
        "title": "R Doradus - The Giant Red Star",
        "scale": "~2.74 AU (Astronomical Units)",
        "description": "A red giant so huge it would swallow Mercury, Venus, Earth, Mars, and part of the asteroid belt if it replaced our Sun!",
        "image": "11_r_doradus.webp",
        "timeOut": 12
      },
      {
        "id": 12,
        "points_threshold": 325,
        "title": "Light's Daily Commute",
        "scale": "~173.8 AU (Astronomical Units)",
        "description": "Light travels 26 billion km in one day—that's 173.8 times Earth-Sun distance. At highway speed, it'd take 30,000 years!",
        "image": "12_light_travel.webp",
        "timeOut": 12
      },
      {
        "id": 13,
        "points_threshold": 364,
        "title": "Hourglass Nebula - Cosmic Hourglass",
        "scale": "~36,765 AU (Astronomical Units)",
        "description": "A dying star ejected its outer layers creating this stunning hourglass shape. Time's up for that star, but its glow lives on!",
        "image": "13_hourglass_nebula.webp",
        "timeOut": 12
      },
      {
        "id": 14,
        "points_threshold": 391,
        "title": "Orion Nebula - Stellar Nursery",
        "scale": "~7.45 pc (Parsecs)",
        "description": "The universe's maternity ward where baby stars are born! One of the brightest nebulae visible to the naked eye from Earth.",
        "image": "14_orion_nebula.webp",
        "timeOut": 12
      },
      {
        "id": 15,
        "points_threshold": 412,
        "title": "Omega Centauri Globular Cluster",
        "scale": "~46 pc (Parsecs) / ~150 light-years",
        "description": "The biggest and brightest globular cluster in the Milky Way, home to 10 million stars packed into a cosmic ball!",
        "image": "15_omega_centauri.webp",
        "timeOut": 10
      },
      {
        "id": 16,
        "points_threshold": 490,
        "title": "Sagittarius Dwarf Galaxy",
        "scale": "~3 kpc (Kiloparsecs) / ~10,000 light-years",
        "description": "A small galaxy being slowly eaten by the Milky Way! It's passing through our galactic disk right now.",
        "image": "16_sagittarius_dwarf.webp",
        "timeOut": 10
      },
      {
        "id": 17,
        "points_threshold": 513,
        "title": "Large Magellanic Cloud (LMC)",
        "scale": "~9.86 kpc (Kiloparsecs) / ~32,200 light-years",
        "description": "Our galaxy's satellite neighbor with 20 billion stars! Visible to the naked eye from the Southern Hemisphere.",
        "image": "17_large_magellanic_cloud.webp",
        "timeOut": 10
      },
      {
        "id": 18,
        "points_threshold": 534,
        "title": "The Milky Way Galaxy",
        "scale": "~30 kpc (Kiloparsecs) / ~100,000 light-years",
        "description": "Our home galaxy! A massive spiral with 200-400 billion stars, including our Sun. We live in one of its spiral arms.",
        "image": "18_milky_way.webp",
        "timeOut": 10
      },
      {
        "id": 19,
        "points_threshold": 549,
        "title": "Andromeda Galaxy (M31)",
        "scale": "~67.45 kpc (Kiloparsecs) / ~220,000 light-years",
        "description": "The largest galaxy in our Local Group with over 1 trillion stars! It's on a collision course with the Milky Way.",
        "image": "19_andromeda_galaxy.webp",
        "timeOut": 10
      },
      {
        "id": 20,
        "points_threshold": 595,
        "title": "Distance to Andromeda",
        "scale": "~778 kpc (Kiloparsecs) / ~2.54 million light-years",
        "description": "The gap between us and Andromeda! Light takes 2.5 million years to travel this distance. That's the nearest major galaxy!",
        "image": "20_andromeda_distance.webp",
        "timeOut": 10
      },
      {
        "id": 21,
        "points_threshold": 620,
        "title": "Virgo Cluster",
        "scale": "~16.5 Mpc (Megaparsecs) / ~54 million light-years",
        "description": "The nearest large galaxy cluster with over 2,000 galaxies! The heart of our Local Supercluster.",
        "image": "21_virgo_cluster.webp",
        "timeOut": 10
      },
      {
        "id": 22,
        "points_threshold": 658,
        "title": "Coma Cluster",
        "scale": "~100 Mpc (Megaparsecs) / ~336 million light-years",
        "description": "A massive cluster with over 1,000 galaxies! One of the first places where dark matter was detected.",
        "image": "22_coma_cluster.webp",
        "timeOut": 10
      },
      {
        "id": 23,
        "points_threshold": 705,
        "title": "Shapley Supercluster",
        "scale": "~250 Mpc (Megaparsecs) / ~650 million light-years",
        "description": "The biggest concentration of galaxies in our cosmic neighborhood! Contains thousands of galaxies and 25 clusters.",
        "image": "23_shapley_supercluster.webp",
        "timeOut": 10
      },
      {
        "id": 24,
        "points_threshold": 720,
        "title": "Large-Scale Structure",
        "scale": "~1 Gpc (Gigaparsec) / ~3.26 billion light-years",
        "description": "At this scale, galaxies form cosmic webs! Long filaments and giant voids create the universe's foam-like structure.",
        "image": "24_cosmic_web.webp",
        "timeOut": 10
      }
    ];

    // Ordenar por threshold
    this.cards.sort((a, b) => a.points_threshold - b.points_threshold);
    console.log(`✅ Loaded ${this.cards.length} curiosity cards`);
  }

  /**
   * Verificar si debe mostrar una tarjeta basada en puntos
   */
  checkAndShowCard(playerPoints) {
    if (this.isAnimating || this.currentCard) {
      return; // Ya hay una tarjeta mostrándose
    }

    // Buscar la tarjeta apropiada
    for (const card of this.cards) {
      if (playerPoints >= card.points_threshold && !this.shownCardIds.has(card.id)) {
        this.showCard(card);
        this.shownCardIds.add(card.id);
        break; // Solo mostrar una a la vez
      }
    }
  }

  /**
   * Mostrar tarjeta con animación
   */
  async showCard(card) {
    if (this.currentCard) return;

    this.isAnimating = true;
    this.currentCard = card;

    // Crear elemento de tarjeta
    const cardElement = this.createCardElement(card);
    this.cardContainer.appendChild(cardElement);

    // Esperar un frame para que el DOM se actualice
    await this.sleep(10);

    // Trigger appear animation
    cardElement.classList.add('show');

    // Iniciar typewriter effect
    this.typeWriterEffect(cardElement.querySelector('.card-description'), card.description);

    // Auto-hide después del timeout
    setTimeout(() => {
      this.hideCard(cardElement);
    }, card.timeOut * 1000);

    console.log(`📋 Showing card: ${card.title}`);
  }

  /**
   * Crear elemento HTML de la tarjeta
   */
  createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'floating-card';
    cardEl.innerHTML = `
      <div class="card-title">${card.title}</div>
      <div class="card-image-container">
        <img src="/assets/cards/${card.image}" alt="${card.title}" class="card-image">
      </div>
      <div class="card-sub">${card.scale}</div>
      <div class="card-description" data-full-text="${card.description}"></div>
    `;
    return cardEl;
  }

  /**
   * Efecto de máquina de escribir para descripción
   */
  typeWriterEffect(element, text, speed = 30) {
    let index = 0;
    element.textContent = '';

    const type = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      }
    };

    type();
  }

  /**
   * Ocultar tarjeta con animación
   */
  async hideCard(cardElement) {
    cardElement.classList.remove('show');
    cardElement.classList.add('hide');

    // Esperar a que termine la animación
    await this.sleep(600);

    // Remover del DOM
    if (cardElement.parentNode) {
      cardElement.parentNode.removeChild(cardElement);
    }

    this.currentCard = null;
    this.isAnimating = false;
  }

  /**
   * Helper para sleep/delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset (para testing o respawn)
   */
  reset() {
    this.shownCardIds.clear();
    this.currentCard = null;
    this.isAnimating = false;
    if (this.cardContainer) {
      this.cardContainer.innerHTML = '';
    }
  }
}

// Exportar globalmente
window.FloatingCardsManager = FloatingCardsManager;
console.log('✅ Floating Cards Manager loaded');