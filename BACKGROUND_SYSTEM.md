# 🌌 Sistema de Fondos Dinámicos por Nivel

## 📋 Resumen de Implementación

Se ha implementado un sistema de fondos que cambia dinámicamente según el nivel del jugador, con transiciones suaves y opacidad máxima de 0.8 para los niveles 1 y 2.

---

## 🎨 Fondos por Nivel

### **NIVEL 1: Espacio Estelar (Size 2-119)**

**Elementos del Fondo:**
- ⭐ **Estrellas (4 tipos):** 380 estrellas distribuidas en 4 capas
  - `star1.webp` - 180 estrellas pequeñas (opacidad máx 0.8)
  - `star2.webp` - 180 estrellas pequeñas (opacidad máx 0.8)
  - `star_3.webp` - 10 estrellas grandes (opacidad máx 0.8)
  - `star_4.webp` - 10 estrellas grandes (opacidad máx 0.8)

- ☄️ **Meteoros (3 tipos):** 8 meteoros dispersos
  - `meteoro1.webp` - Meteoros pequeños y medianos
  - `meteoro2.webp` - Meteoros pequeños y medianos
  - `meteoro_azul.webp` - Meteoros pequeños y medianos
  - **Opacidad:** Máximo 0.8, más tenues que las estrellas

**Características:**
- Parallax factor: 0.4 (movimiento relativo con la cámara)
- Animación de parpadeo en estrellas
- Opacidad máxima: 0.8

---

### **NIVEL 2: Espacio Intergaláctico (Size 120-159)**

**Elementos del Fondo:**
- 🌌 **Galaxias (5 tipos):** 12 galaxias de fondo
  - `galaxia_04.webp` - Galaxias no usadas como elementos comestibles
  - `galaxia_05.webp` - Galaxias no usadas como elementos comestibles
  - `galaxia_06.webp` - Galaxias no usadas como elementos comestibles
  - `galaxia_agujero.webp` - Galaxias con agujeros negros centrales
  - `brazos_azules.webp` - Galaxias con brazos espirales azules
  - **Opacidad:** Máximo 0.8

- ⚫ **Agujeros Negros (3 tipos):** 6 agujeros negros dispersos
  - `agujero_negro1.webp` - Agujeros negros sin disco
  - `agujero_negro2.webp` - Agujeros negros con disco
  - `agujero_negro3.webp` - Agujeros negros con jets
  - **Opacidad:** Máximo 0.8

**Características:**
- Parallax factor: 0.3 (más lento que nivel 1)
- Transición suave desde nivel 1 (2 segundos)
- Se sobrepone al fondo estelar

---

### **NIVEL 3: Universo Observable (Size 160-200)**

**Elementos del Fondo:**
- 🌠 **Imagen Final:** `final.webp`
  - Representa el universo a gran escala
  - Aparece sutilmente al inicio (opacidad 0.3)
  - Se escala para cubrir todo el campo visual
  - Aumenta gradualmente su opacidad

**Características:**
- Parallax factor: 0.2 (muy lento, efecto de profundidad)
- Transición suave desde nivel 2 (2 segundos)
- Al llegar a size >= 200: **Pantalla Final**
  - La imagen `final.webp` ocupa toda la pantalla (opacidad 1.0)
  - Todo lo demás desaparece gradualmente (3 segundos)
  - Efecto de "Gran Atractor" inmersivo

---

## 🔄 Sistema de Transiciones

### **Transiciones Entre Fondos**

```javascript
// Duración: 2 segundos
// Easing: Cubic In/Out (suave y natural)
// Comportamiento:
//   - Fade out del fondo anterior
//   - Fade in del nuevo fondo
//   - Los objetos aparecen gradualmente
```

### **Sincronización con Elementos Comestibles**

**Coincidencias entre fondo y orbes:**

| Nivel | Fondo | → | Elementos Comestibles |
|-------|-------|---|-----------------------|
| 1 → 2 | Meteoros pequeños | → | Asteroides tipos C, S, M |
| 2 → 3 | Galaxias pequeñas | → | Galaxias enanas, cúmulos |

**Lógica:**
- Cuando el jugador crece de tamaño 27-39, los meteoros del fondo sirven de "previsualización" de los asteroides que comerá.
- Cuando el jugador alcanza tamaño 120-159, las galaxias del fondo nivel 1 "se convierten" en galaxias comestibles del nivel 2.

---

## 🎯 Funcionalidades Implementadas

### ✅ **Sistema de Contenedores de Fondo**
```javascript
// Tres contenedores separados, uno por nivel
this.backgroundLevel1 = new PIXI.Container(); // Estrellas + Meteoros
this.backgroundLevel2 = new PIXI.Container(); // Galaxias + Agujeros Negros
this.backgroundLevel3 = new PIXI.Container(); // Imagen final
```

### ✅ **Opacidad Máxima 0.8**
```javascript
// Nivel 1 y 2: Máximo 0.8
star.alpha = Math.min(0.8, 0.5 + Math.random() * 0.3);
galaxy.baseAlpha = Math.min(0.8, 0.4 + Math.random() * 0.3);
```

### ✅ **Parallax Diferenciado**
```javascript
// Nivel 1: Factor 0.4 (más rápido)
// Nivel 2: Factor 0.3 (medio)
// Nivel 3: Factor 0.2 (más lento, sensación de profundidad)
```

### ✅ **Transición Suave con Easing**
```javascript
_easeInOutCubic(t) {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

### ✅ **Pantalla Final Inmersiva**
```javascript
// Al llegar a size >= 200:
// - final.webp pasa de 0.3 → 1.0 (opacidad completa)
// - Todos los demás elementos se desvanecen
// - Duración: 3 segundos
```

---

## 📁 Archivos Modificados

### **1. `/public/js/core/renderer.js`**
```javascript
✅ constructor() - Añadidos contenedores de fondo
✅ initialize() - Configuración de 3 contenedores de nivel
✅ createStarryBackground() - Orquestador de fondos
✅ createLevel1Background() - Estrellas + Meteoros
✅ createLevel2Background() - Galaxias + Agujeros Negros
✅ createLevel3Background() - Imagen final
✅ updateStarParallax() - Parallax diferenciado
✅ transitionToLevel() - Transiciones suaves
✅ showFinalScreen() - Pantalla final inmersiva
✅ _easeInOutCubic() - Función de easing
```

### **2. `/public/js/main.js`**
```javascript
✅ startGame() - Carga de texturas de fondo
  - Meteoros (meteoro1, meteoro2, meteoro_azul)
  - Galaxias (galaxia_04, galaxia_05, galaxia_06, galaxia_agujero, brazos_azules)
  - Agujeros negros (agujero_negro1, agujero_negro2, agujero_negro3)
  - Imagen final (final)

✅ maybeRunLevelTransition() - Integración de transiciones
  - Determina backgroundLevel según mainLevel
  - Llama a renderer.transitionToLevel()
  - Activa showFinalScreen() al llegar a size >= 200
```

---

## 🎬 Flujo de Experiencia Visual

### **Inicio del Juego (Size 2)**
```
Fondo: Nivel 1 (Estrellas + Meteoros)
├─ 380 estrellas parpadeantes (opacidad máx 0.8)
├─ 8 meteoros dispersos (opacidad máx 0.8)
└─ Parallax: Factor 0.4
```

### **Transición a Nivel 2 (Size 120)**
```
Animación (2 segundos):
├─ Estrellas se desvanecen gradualmente
├─ Galaxias aparecen suavemente (opacidad máx 0.8)
├─ Agujeros negros emergen (opacidad máx 0.8)
└─ Banner: "Nivel 2: Galaxias"

Nuevo Fondo:
├─ 12 galaxias de varios tipos
├─ 6 agujeros negros con diferentes características
└─ Parallax: Factor 0.3 (más lento)
```

### **Transición a Nivel 3 (Size 160)**
```
Animación (2 segundos):
├─ Galaxias se desvanecen
├─ Imagen final aparece sutilmente (opacidad 0.3)
└─ Banner: "Nivel 3: Supercúmulo"

Nuevo Fondo:
├─ final.webp visible pero sutil
├─ Estructuras cósmicas a gran escala
└─ Parallax: Factor 0.2 (muy lento)
```

### **Final del Juego (Size >= 200)**
```
Animación Final (3 segundos):
├─ final.webp aumenta de 0.3 → 1.0
├─ Jugadores y orbes se desvanecen
├─ Solo queda el universo observable
└─ Mensaje: "El Gran Atractor"
```

---

## 🧪 Testing

### **Verificar Fondos:**

1. **Nivel 1 (Size 2-119):**
   ```javascript
   // En consola del navegador:
   game.renderer.backgroundLevel1.alpha // → 1.0
   game.renderer.backgroundLevel2.alpha // → 0.0
   game.renderer.backgroundLevel3.alpha // → 0.0
   ```

2. **Nivel 2 (Size 120-159):**
   ```javascript
   // Después de llegar a size 120:
   game.renderer.backgroundLevel1.alpha // → 0.0
   game.renderer.backgroundLevel2.alpha // → 1.0
   game.renderer.backgroundLevel3.alpha // → 0.0
   ```

3. **Nivel 3 (Size 160-200):**
   ```javascript
   // Después de llegar a size 160:
   game.renderer.backgroundLevel1.alpha // → 0.0
   game.renderer.backgroundLevel2.alpha // → 0.0
   game.renderer.backgroundLevel3.alpha // → 1.0
   ```

4. **Pantalla Final (Size >= 200):**
   ```javascript
   // Esperar 3 segundos después de llegar a size 200:
   game.renderer.finalBackgroundSprite.alpha // → 1.0
   game.renderer.worldContainer.alpha // → 0.0
   ```

### **Verificar Opacidad Máxima:**
```javascript
// Todas las estrellas y objetos del nivel 1 y 2:
game.renderer.stars.forEach(s => console.log(s.baseAlpha)); // ≤ 0.8
game.renderer.backgroundObjects
  .filter(o => o.level <= 2)
  .forEach(o => console.log(o.baseAlpha)); // ≤ 0.8
```

---

## 📊 Estadísticas

- **Total Objetos de Fondo:** 406
  - Nivel 1: 388 (380 estrellas + 8 meteoros)
  - Nivel 2: 18 (12 galaxias + 6 agujeros negros)
  - Nivel 3: 1 (imagen final)

- **Texturas Cargadas:** 15
  - 4 estrellas
  - 3 meteoros
  - 5 galaxias
  - 3 agujeros negros
  - 1 imagen final

- **Parallax Factors:**
  - Nivel 1: 0.4
  - Nivel 2: 0.3
  - Nivel 3: 0.2

- **Duración Transiciones:**
  - Entre niveles: 2 segundos
  - Pantalla final: 3 segundos

---

## 🎯 Coincidencias Visuales

### **Meteoros → Asteroides**
Cuando el jugador está en tamaño 20-26 (viendo meteoros en el fondo), al crecer verá asteroides como elementos comestibles que tienen apariencia similar.

### **Galaxias de Fondo → Galaxias Comestibles**
Las galaxias que estaban en el fondo del nivel 1 y 2 "se vuelven" parte del juego como elementos comestibles en el nivel 2.

### **Agujeros Negros**
Aparecen primero en el fondo del nivel 2, luego podrían implementarse como trampas o elementos especiales.

---

## 🚀 Próximos Pasos Recomendados

1. **Animaciones de Rotación:** Hacer que las galaxias y agujeros negros roten lentamente
2. **Efectos de Partículas:** Añadir partículas de polvo cósmico en nivel 2
3. **Distorsión Espacial:** Efecto de lente gravitacional cerca de agujeros negros
4. **Música Adaptativa:** Cambiar la música según el nivel
5. **Cinemática Final:** Añadir texto explicativo sobre "El Gran Atractor"

---

**Última Actualización:** 5 de octubre de 2025  
**Versión:** 2.0.0  
**Estado:** ✅ Sistema de Fondos Dinámicos Implementado
