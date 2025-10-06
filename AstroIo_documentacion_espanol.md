**AstroIo – Documentación Principal**

**Un Juego Educativo Multijugador sobre la Escala Cósmica**\
**Versión:** 3.0 – Arquitectura Modular con Progresión de Escala\
**Última Actualización:** 5 de octubre de 2025

-----
**Resumen del Juego**

**Concepto**

**AstroIo** es un juego multijugador en tiempo real basado en navegador, inspirado en *Agar.io*, diseñado para **educar a los jugadores sobre las escalas del universo**. Los jugadores comienzan como diminutas partículas de polvo y crecen a través de **cinco niveles cósmicos**, llegando a convertirse en enormes cúmulos galácticos antes de ser atraídos por el **Gran Atractor**, visualizando así la auténtica magnitud de la estructura cósmica.

**Bucle Principal de Jugabilidad**

1. **Comienza Pequeño**: Empieza como una partícula de polvo (escala Ångström).
1. **Come y Crece**: Consume orbes y jugadores más pequeños para aumentar de tamaño.
1. **Evita Amenazas**: Esquiva jugadores más grandes y peligros específicos de cada nivel.
1. **Progresa por las Escalas**: Desbloquea 5 niveles cósmicos a medida que creces.
1. **Aprende**: Descubre hechos educativos sobre las escalas cósmicas mediante cartas informativas.
1. **Llega al Final**: Experimenta la atracción inevitable del Gran Atractor.

**Misión Educativa**

Cada transición entre niveles enseña a los jugadores sobre las **escalas relativas del universo**, desde los átomos hasta los supercúmulos galácticos, brindando contexto mediante **cartas informativas** que aparecen al alcanzar ciertos umbrales de puntos. Los jugadores aprenden cómo las estructuras cósmicas se relacionan con los objetos y distancias cotidianas.

-----
**Arquitectura**

**Patrón de Diseño: MVC Modular**

CLIENTE (Navegador)

│

├── main.js (Controlador)

│    ├── core/socket-client.js (Capa de red)

│    ├── core/renderer.js (Vista - PixiJS)

│    ├── core/camera.js (Lógica de cámara)

│    ├── core/ui.js (Vista - DOM)

│    ├── core/elements.js (Definición de orbes)

│    └── levels\_pack.js (Configuración de niveles)

│

↕ Comunicación con Socket.IO

│

SERVIDOR (Node.js)

│

├── server.js (Punto de entrada + bucle del juego)

│    ├── sockets/connection.js (Manejo de eventos)

│    ├── sockets/movement.js (Manejo de movimiento)

│    └── core/

│          ├── gameState.js (Modelo - Estado)

│          ├── player.js (Modelo - Entidades)

│          ├── physics.js (Lógica de física)

│          ├── collisions.js (Lógica de colisiones)

│          └── bots.js (Lógica de IA)

**Estructura de Directorios**

AstroIo/

├── server/

│   ├── core/

│   │   ├── gameState.js       # Configuración y estado del juego

│   │   ├── player.js          # Creación de jugadores/bots

│   │   ├── physics.js         # Movimiento y matemáticas de colisión

│   │   ├── collisions.js      # Detección de colisiones

│   │   └── bots.js            # Lógica de IA de bots

│   └── sockets/

│       ├── connection.js      # Eventos de conexión/desconexión

│       └── movement.js        # Manejo de entrada (ratón)

├── public/

│   ├── js/

│   │   ├── core/

│   │   │   ├── socket-client.js  # Wrapper de Socket.IO

│   │   │   ├── renderer.js       # Renderizado con PixiJS

│   │   │   ├── camera.js         # Sistema de cámara

│   │   │   ├── ui.js             # HUD y modales

│   │   │   └── elements.js       # Definiciones de orbes por nivel

│   │   ├── levels\_pack.js        # Gestor de configuración de niveles

│   │   └── main.js               # Punto de entrada del cliente

│   ├── assets/                   # Texturas (planetas, estrellas, etc.)

│   └── worlds/

│       └── [dev].html            # Entradas de desarrollo

└── server.js                     # Servidor principal + bucle de juego

-----
**Sistema de Niveles**

**Resumen de Progresión**

|**Nivel**|**Nombre**|**Rango de Tamaño**|**Escala**|**Tema**|
| :- | :- | :- | :- | :- |
|**Nivel 1 - Subnivel 1**|Atómico|2–13|Å → µm|Hidrógeno, Helio, átomos|
|**Nivel 1 - Subnivel 2**|Granos de Polvo|14–26|µm → m|Silicatos, hielo, carbono|
|**Nivel 1 - Subnivel 3**|Asteroides|27–39|m → Mm|Asteroides tipo C, S, M|
|**Nivel 1 - Subnivel 4**|Sistema Solar|40–119|Mm → Gm|Planetas, Sol (sin nuevos orbes)|
|**Nivel 2**|Galaxia|120–159|Kpc|Galaxias, cúmulos estelares|
|**Nivel 3**|Supercúmulo|160–200+|Mpc|Cúmulos galácticos, red cósmica|

-----
**Nivel 1 - Subnivel 1: Atómico (Å → µm)**

**Rango de tamaño:** 2–13\
**Visual:** Fondo estelar con gradiente púrpura-azul\
**Mecánica especial:** Túnel cuántico (teletransportación)

**Orbes (Elementos):**

- **Hidrógeno (H)** – 0.5 puntos (60%) – Esfera azul
- **Helio (He)** – 2.0 puntos (15%) – Esfera púrpura
- **Oxígeno (O)** – 3.0 puntos (10%) – Esfera verde
- **Carbono (C)** – 4.0 puntos (8.5%) – Gris carbonoso
- **Neón (Ne)** – 7.0 puntos (6.5%) – Esfera roja

**Educación:** Introduce la escala atómica y los elementos básicos que conforman la materia.

-----
**Nivel 1 - Subnivel 2: Granos de Polvo (µm → m)**

**Rango de tamaño:** 14–26\
**Visual:** Partículas de polvo espacial, paleta dorada cálida\
**Mecánica especial:** Zonas de ráfaga (alta densidad de orbes)

**Orbes (Tipos de polvo):**

- **Silicatos (Si)** – 2.0 puntos (60%) – Escala visual 2x
- **Carbonáceos (Carb)** – 3.0 puntos (20%) – Escala visual 2x
- **Mantos de Hielo (Ice)** – 4.0 puntos (12%) – Escala visual 2x
- **Óxidos Metálicos (Fe)** – 5.0 puntos (8%) – Escala visual 2x

**Educación:** Formación y composición del polvo interestelar.

-----
**Nivel 1 - Subnivel 3: Asteroides (m → Mm)**

**Rango de tamaño:** 27–39\
**Visual:** Cinturón de asteroides, tonos grises\
**Mecánica especial:** Asteroides supersónicos, agujeros negros y blancos

**Orbes (Tipos de asteroides):**

- **Tipo C** – 5.0 puntos (50%) – Escala visual 5x
- **Tipo S** – 7.0 puntos (30%) – Escala visual 5x
- **Tipo M** – 10.0 puntos (20%) – Escala visual 5x

**Peligros:**

- Agujeros negros (zonas letales)
- Agujeros blancos (puntos de teletransporte)
- Asteroides supersónicos (obstáculos móviles)

**Educación:** Formación del sistema solar y clasificación de asteroides.

-----
**Nivel 1 - Subnivel 4: Sistema Solar (Mm → Gm)**

**Rango de tamaño:** 40–119\
**Visual:** Texturas planetarias (Tierra, Sol)\
**Mecánica especial:** Disco de acreción, mecánicas orbitales (planeado)

**Texturas del jugador:**

- Tamaño 40–59: **Tierra** (LaTierra.webp)
- Tamaño 60–119: **Sol** (sol.webp)

**Educación:** Escala planetaria y evolución estelar.

-----
**Nivel 2: Galaxia (Kpc)**

**Rango de tamaño:** 120–159\
**Visual:** Galaxias espirales, textura de la Vía Láctea\
**Mecánica especial:** Chorros de AGN (planeado)

**Orbes (Objetos galácticos):**

- **Enana Irregular** – 15.0 puntos (40%) – Escala 3x
- **Nube de Gas Frío** – 20.0 puntos (20%) – Escala 3x
- **Enana Esferoidal** – 25.0 puntos (20%) – Escala 3x
- **Espiral Pequeña** – 30.0 puntos (10%) – Escala 4x
- **Cúmulo Globular** – 35.0 puntos (10%) – Escala 4x

**Educación:** Estructura galáctica y tipos de galaxias.

-----
**Nivel 3: Supercúmulo (Mpc)**

**Rango de tamaño:** 160–200+\
**Visual:** Cúmulos galácticos exóticos, red cósmica\
**Mecánica especial:** Secuencia final del Gran Atractor

**Orbes (Cúmulos galácticos):**

- **Elíptica Intermedia** – 40.0 puntos (60%) – Escala 4x
- **Elíptica Gigante** – 50.0 puntos (30%) – Escala 5x
- **BCG/cD Galaxy** – 70.0 puntos (10%) – Escala 6x

**Educación:** Estructura a gran escala del universo, red cósmica y anomalías gravitacionales.

**Mecánicas de Progresión**

**Sistema de Crecimiento**

**Consumo de Orbes:**\
Cada orbe tiene un valor en puntos según su nivel y rareza. Los valores van desde **0.5** (átomos de hidrógeno comunes) hasta **70.0** (galaxias BCG raras). El crecimiento se calcula como:

nuevoTamaño = tamañoActual + puntosDelOrbe

**Escalado Visual:**\
Los orbes tienen diferentes tamaños visuales para indicar su importancia:

- Escala 1x: Átomos básicos (Nivel 1.1)
- Escala 2x: Granos de polvo (Nivel 1.2)
- Escala 5x: Asteroides (Nivel 1.3)
- Escala 3x–4x: Objetos galácticos (Nivel 2)
- Escala 4x–6x: Cúmulos galácticos (Nivel 3)

**Jugador vs Jugador:**

- Puedes comer jugadores un **10% más pequeños** que tú.
- Crecimiento tras comer = tamañoActual + (tamañoDelObjetivo \* 0.5)
- La muerte activa una pantalla de **Game Over** con tiempo de supervivencia y estadísticas finales.
-----
**Hitos Educativos**

En umbrales de puntos específicos, aparecen **cartas educativas** con datos fascinantes sobre la escala cósmica.

**Escala Microscópica (28–110 puntos):**

- **28 pts** – Compuerta de Transistor (5 nm): Interruptores microscópicos en la electrónica.
- **46 pts** – Longitud de onda UV (60 nm): Luz energética invisible.
- **90 pts** – Grosor del Cabello Humano (100 µm): Entre 50,000 y 200,000 hebras.
- **110 pts** – Grano de Arroz / Hormiga (5 mm): Tamaños similares, vidas diferentes.

**Escala Humana (145–185 puntos):**

- **145 pts** – Altura de una Jirafa (6 m): El cuello representa casi la mitad.
- **168 pts** – Burj Khalifa (~1 km): Edificio más alto del mundo.
- **185 pts** – Estrella de Neutrones (24–35 km): Más masa que el Sol en 20 km.

**Escala Planetaria (209–325 puntos):**

- **209 pts** – Luna Ío (3.6 Mm): Más de 400 volcanes activos.
- **248 pts** – El Sol (696 Mm): Convierte 600M ton de H→He/s.
- **269 pts** – Todos los Humanos Apilados (13.2 Gm): 88x la distancia Tierra-Luna.
- **294 pts** – R Doradus (2.74 AU): Gigante roja que engulliría planetas interiores.
- **325 pts** – Distancia diaria de la luz (173.8 AU): 26 mil millones de km/día.

**Escala Estelar (364–412 puntos):**

- **364 pts** – Nebulosa del Reloj de Arena (36,765 AU): Capas eyectadas de una estrella moribunda.
- **391 pts** – Nebulosa de Orión (7.45 pc): Vivero estelar.
- **412 pts** – Omega Centauri (46 pc): 10 millones de estrellas.

**Escala Galáctica (490–595 puntos):**

- **490 pts** – Sagitario Enana (3 kpc): Devorada por la Vía Láctea.
- **513 pts** – Gran Nube de Magallanes (9.86 kpc): 20 mil millones de estrellas.
- **534 pts** – Vía Láctea (30 kpc): 200–400 mil millones de estrellas.
- **549 pts** – Andrómeda (67.45 kpc): 1 billón de estrellas, colisión futura.
- **595 pts** – Distancia a Andrómeda (778 kpc): Luz tarda 2.5 millones de años.

**Escala Cósmica (620–720 puntos):**

- **620 pts** – Cúmulo de Virgo (16.5 Mpc): 2,000+ galaxias.
- **658 pts** – Cúmulo de Coma (100 Mpc): Donde se detectó la materia oscura.
- **705 pts** – Supercúmulo de Shapley (250 Mpc): Mayor concentración cercana.
- **720 pts** – Estructura a Gran Escala (1 Gpc): Red cósmica de filamentos y vacíos.

**Visualización:** Cada carta se muestra durante 10–12 segundos con imágenes ilustrativas, brindando contexto al tamaño actual del jugador.

-----
**Interfaz de Usuario (HUD)**

El HUD muestra dinámicamente:

- Unidad de escala actual (Å, nm, µm, mm, m, km, Mm, Gm, AU, pc, kpc, Mpc, Gpc).
- Tamaño dentro del nivel (barra de progreso con gradiente).
- Nombre de la escala real (ej. "Å → nm → µm" para Nivel 1.1).
- Colores gradientes que cambian según el nivel.
- Cantidad de jugadores y posición actual.
-----
**Juego Final: El Gran Atractor**

**Condiciones de Activación**

Cuando el jugador alcanza aproximadamente **190–195 puntos** (casi el máximo del Nivel 3):

- El **Gran Atractor** aparece en una ubicación distante.
- La **fuerza gravitacional** aumenta gradualmente.
- El movimiento del jugador se restringe cada vez más.
- Efectos visuales intensifican la experiencia (sacudidas, distorsiones).

**Secuencia Final**

1. **Atracción Inicial**: El Gran Atractor aparece en el horizonte.
1. **Intensificación**: Aumenta el temblor de cámara y líneas gravitacionales.
1. **Atracción Inevitable**: El jugador es arrastrado sin poder escapar.
1. **Alejamiento Exponencial**: La cámara hace zoom out, mostrando la insignificancia del jugador.
1. **Revelación Cósmica**: El jugador se convierte en un punto entre miles.
1. **Transición Final**: Desvanecimiento hacia una imagen real de la red cósmica.
1. **Mensaje Educativo:**\
   “Has experimentado la escala completa del universo — desde los átomos hasta las mayores estructuras. El Gran Atractor es una anomalía gravitacional real que atrae a nuestro Grupo Local a 600 km/s hacia un punto desconocido en el espacio.”

**Mensaje Final:**\
El **Gran Atractor** es una anomalía gravitacional real que atrae a la Vía Láctea y a miles de galaxias. Enseña que incluso las estructuras más masivas conocidas forman parte de sistemas mayores, más allá de nuestra completa comprensión.

-----
**Diseño Visual**

**Sistema de Renderizado (PixiJS)**

**Organización por Capas (z-index):**

- 0–10: Fondos (campo estelar, nebulosas)
- 20: Entidades de jugadores
- 25: Entidades de orbes
- 30: Peligros (asteroides, agujeros)
- 40: Etiquetas y textos
- 50+: Superposiciones de interfaz y cartas

**Efectos Visuales:**

- Brillo en jugadores y orbes (según tamaño).
- Animación de parpadeo estelar mediante funciones seno.
- **Parallax scrolling:** estrellas se mueven al 20% de la velocidad de cámara.
- Transiciones de zoom suaves entre niveles.
- Efectos especiales (horizontes de eventos, agujeros blancos).

**Texturas del Jugador (automáticas según tamaño):**

- nebula.webp: Tamaños 2–26 (fase atómica/polvo)
- roca.webp: 27–39 (asteroide)
- LaTierra.webp: 40–59 (planeta)
- sol.webp: 60–119 (estrella)
- via\_lactea.webp: 120–159 (galaxia)
- exotic\_galaxy.webp: 160–200+ (supercúmulo)

**Texturas de Bots:**\
sol2.webp, sol3.webp, planeta\_anillo.webp, andromeda.webp — renderizados como estrellas de 5 puntas.

**Texturas de Orbes:** 23 únicas (definidas en elements.js)\
**Cartas Educativas:** 24 imágenes (1\_transistor\_gate.webp → 24\_cosmic\_web.webp)

**Inteligencia Artificial de Bots**

**Sistema de Comportamiento**

Los bots utilizan una **máquina de estados** con múltiples capas de decisión:

1. **Búsqueda de Orbes** (30% de probabilidad):\
   El bot apunta al orbe más cercano dentro de un radio de 300 px.
1. **Evasión de Amenazas** (automática):\
   Huye de jugadores más grandes detectados en un radio de 400 px.
1. **Vagabundeo Aleatorio** (1% de probabilidad por frame):\
   Escoge una dirección aleatoria para explorar.
1. **Respuesta al Crecimiento**:\
   Crecen usando las mismas mecánicas que los jugadores humanos.

**Propiedades de los Bots**

- **Distinción Visual:** Representados como estrellas de 5 puntas (jugadores = círculos).
- **Población:** 6 bots activos simultáneamente.
- **Reaparición:** 15 segundos tras ser devorados.
- **Variación de Texturas:** Diferentes por nivel (sol2, planeta\_anillo, andromeda, etc.).
- **Inteligencia:** Sencilla pero eficaz; pueden competir contra jugadores reales.

**Desafíos que Presentan los Bots**

Los bots aportan dinamismo y equilibrio al juego:

- Bots pequeños → oportunidades de crecimiento.
- Bots grandes → amenazas que esquivar.
- Mantienen la actividad incluso con pocos jugadores humanos.
-----
**Protocolo de Red**

**Eventos de Comunicación**

**Cliente → Servidor:**

- setName(name) – Establece el nombre del jugador al iniciar (máx. 20 caracteres, validado).
- move(target) – Actualiza las coordenadas {x, y} según la posición del ratón.

**Servidor → Cliente:**

- init(data) – Inicializa un nuevo jugador con ID único y parámetros del mundo.
- gameState(delta) – Envía un estado delta solo con los cambios.
- gameOver(data) – Notifica la eliminación con estadísticas (tiempo, tamaño final, asesino).
- gameFull(data) – Rechaza conexiones cuando se alcanza el máximo (5 jugadores humanos).
-----
**Actualizaciones Delta (Delta State Optimization)**

El servidor implementa **actualizaciones delta** para optimizar el ancho de banda:

- Solo transmite propiedades **modificadas** (posición, tamaño, nivel).
- Solo incluye **nuevos o movidos** orbes.
- Lista explícitamente **orbes y jugadores eliminados**.
- Incluye **peligros** solo cuando aplica (Nivel 1.3).

**Impacto en el rendimiento:**

- Reducción del tráfico: **60–80%** vs. actualizaciones completas.
- Frecuencia de actualización: **60 FPS** (cada 16.67 ms).
- Latencia: <10 ms en red local, <50 ms típica en internet.
-----
**Sistemas Centrales**

**Bucle Principal del Servidor (60 FPS)**

El servidor mantiene el **estado autoritativo** del juego con estas tareas:

1. Actualizar posiciones de todos los jugadores (física).
1. Actualizar comportamiento y movimiento de bots.
1. Verificar colisiones entre orbes y jugadores.
1. Gestionar colisiones jugador vs jugador (mecánica de "comer").
1. Evaluar colisiones con peligros (solo Nivel 1.3).
1. Aplicar atracción gravitacional del **Gran Atractor** (fase final).
1. Calcular **estado delta** (solo datos modificados).
1. Emitir actualizaciones a todos los clientes conectados.
1. Eliminar jugadores desconectados y bots inactivos.
1. Programar el siguiente tick (cada 16.67 ms exactos).
-----
**Bucle de Renderizado del Cliente**

El cliente responde a las actualizaciones del servidor:

1. Recibe estado delta vía **Socket.IO**.
1. Integra el delta en su estado local.
1. Actualiza la posición de cámara y nivel de zoom.
1. Renderiza entidades visibles (jugadores, orbes, peligros) con **PixiJS**.
1. Actualiza HUD (tamaño, posición, escala, número de jugadores).
1. Refresca el **marcador** con los 5 mejores jugadores.
1. Muestra **cartas educativas** al alcanzar los puntos clave.
1. Gestiona **transiciones de nivel** y animaciones de zoom.
-----
**Gestión de Configuración**

El archivo **levels\_pack.js** actúa como gestor central de configuración:

- Define funciones de **mapeo de escala** (lineal o logarítmico) por nivel.
- Administra transiciones de nivel (**onEnter/onExit**).
- Cambia conjuntos de elementos (ELEMENTS, ELEMENTS\_L1, ELEMENTS\_L2).
- Configura reglas de visualización del HUD (unidades, rangos, colores).
- Controla la visibilidad de peligros (Nivel 1.3).
- Mantiene **variables globales** para cálculos de escala.

**Variables Globales:**

- overrideSizeToNanometers – Función personalizada de mapeo de escala.
- currentLevelSizeBounds – Rango de tamaño actual {min, max}.
- currentLevelNmBounds – Rango en nanómetros {min, max}.
- ELEMENTS – Conjunto activo de orbes.
-----
**Optimización de Rendimiento**

**Optimizaciones Implementadas**

1. **Actualizaciones Delta** – Solo se envían cambios (reduce ancho de banda 60–80%).
1. **PIXI ParticleContainer** – Renderizado GPU para 300+ estrellas de fondo.
1. **Reutilización de Objetos (Pooling)** – Reutiliza instancias de PIXI.Graphics.
1. **Pre-filtros Espaciales** – Filtrado por distancia antes de cálculos costosos.
1. **Eventos con Debounce** – Redimensionamiento limitado a 100 ms.
1. **Renderizado por Nivel** – Solo el nivel activo se dibuja.
1. **Culling de Peligros** – Peligros del Nivel 1.3 ocultos fuera del rango 27–119.
-----
**Metas de Rendimiento**

**Servidor:**

- Objetivo: **60 FPS** (16.67 ms por tick).
- CPU: ~7% (5 jugadores + 6 bots).
- Memoria: ~69 MB estable.
- Red: ~10 KB/s por cliente conectado.

**Cliente:**

- Objetivo: **60 FPS**.
- Aceleración por hardware con **PixiJS WebGL**.
- Interpolación suave de cámara.
- Sin fugas de memoria (test en sesiones prolongadas).
-----
**Filosofía de Desarrollo**

**Principios Fundamentales**

- 🧠 **Educación Primero:**\
  Todas las mecánicas sirven al objetivo educativo de **comprender la escala cósmica**.\
  Los umbrales están calibrados para generar momentos de aprendizaje significativos.
- 🔒 **Autoridad del Servidor:**\
  Toda la física, detección de colisiones y lógica se ejecuta **en el servidor**, garantizando equidad y evitando trampas cliente-side.
- ⚙️ **Mejora Progresiva:**\
  El núcleo del juego funciona desde el inicio; los efectos visuales se añaden encima.\
  El juego sigue siendo funcional incluso si fallan características avanzadas.
- 🧩 **Diseño Modular:**\
  Separación clara entre lógica del servidor, renderizado del cliente y configuración.\
  Esto permite desarrollo independiente y pruebas unitarias por módulo.
- ⚡ **Enfoque en el Rendimiento:**\
  Optimizaciones como actualizaciones delta, pooling y culling garantizan fluidez incluso en hardware modesto.
-----
**Estado del Proyecto**

- **Estado Actual:** *Alpha* – Mecánicas principales completas, niveles 1.1–3 implementados.
- **Próximo Objetivo:** Contenido visual de Niveles 1.4 y 2, y pulido de la secuencia del Gran Atractor.
- **Audiencia Objetivo:** Mayores de 12 años interesados en espacio, ciencia y juegos educativos.
- **Tecnologías:** Node.js, Socket.IO, PixiJS, HTML5 Canvas.
-----
*Documentación mantenida por: **ginkgo***\
*Última actualización: 5 de octubre de 2025*

