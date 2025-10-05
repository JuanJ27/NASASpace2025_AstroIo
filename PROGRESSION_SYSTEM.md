# 🌌 Sistema de Progresión por Niveles - AstroIo

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de progresión basado en el tamaño del jugador, con 3 niveles principales y múltiples subniveles.

---

## 🎯 Estructura de Niveles

### **NIVEL 1: Sistema Solar (Size 2-119)**

#### **Subnivel 1: Átomos (2-13)**
- **Escala:** Ångströms → Micrómetros (Å → µm)
- **Textura Jugador:** `nebula.webp`
- **Textura Bots:** `sol2.webp`

**Elementos Comestibles:**
| Elemento | Textura | Puntos | Abundancia | Escala Visual |
|----------|---------|--------|------------|---------------|
| Hidrógeno (H) | `bola_azul.webp` | 0.5 | 60% | 1.0x |
| Helio (He) | `bola_morada.webp` | 2.0 | 15% | 1.0x |
| Oxígeno (O) | `bola_verde.webp` | 3.0 | 10% | 1.0x |
| Carbono (C) | `carbonaceo.webp` | 4.0 | 8.5% | 1.0x |
| Neón (Ne) | `bola_roja.webp` | 7.0 | 6.5% | 1.0x |

---

#### **Subnivel 2: Granos de Polvo (14-26)**
- **Escala:** Micrómetros → Metros (µm → m)
- **Textura Jugador:** `nebula.webp`
- **Textura Bots:** `sol2.webp`

**Elementos Comestibles:**
| Elemento | Textura | Puntos | Abundancia | Escala Visual |
|----------|---------|--------|------------|---------------|
| Silicatos (Si) | `silicatos.webp` | 2.0 | 60% | 2.0x |
| Carbonáceos (Carb) | `carbonaceo.webp` | 3.0 | 20% | 2.0x |
| Hielo (Ice) | `bola_hielo.webp` | 4.0 | 12% | 2.0x |
| Óxidos (Fe) | `oxidos.webp` | 5.0 | 8% | 2.0x |

---

#### **Subnivel 3: Asteroides (27-39)**
- **Escala:** Metros → Megametros (m → Mm)
- **Textura Jugador:** `roca.webp` ⭐ **¡CAMBIO DE TEXTURA!**
- **Textura Bots:** `planeta_anillo.webp`

**Elementos Comestibles:**
| Elemento | Textura | Puntos | Abundancia | Escala Visual |
|----------|---------|--------|------------|---------------|
| Asteroide C | `asteroide_C.webp` | 5.0 | 50% | 5.0x |
| Asteroide S | `asteroide_S.webp` | 7.0 | 30% | 5.0x |
| Asteroide M | `asteroides_M.webp` | 10.0 | 20% | 5.0x |

---

#### **Subnivel 4: Sistema Solar (40-119)**
- **Escala:** Megametros → Gigametros (Mm → Gm)
- **Textura Jugador (40-59):** `LaTierra.webp` ⭐ **¡CAMBIO DE TEXTURA!**
- **Textura Jugador (60-119):** `sol.webp` ⭐ **¡CAMBIO DE TEXTURA!**
- **Textura Bots:** `sol3.webp`
- **Elementos:** Sin elementos nuevos (transición)

---

### **NIVEL 2: Galaxias (Size 120-159)**

#### **Subnivel 1: Cúmulos Galácticos (120-159)**
- **Escala:** Kiloparsecs (Kpc)
- **Textura Jugador:** `via_lactea.webp` ⭐ **¡ZOOM OUT GALÁCTICO!**
- **Textura Bots:** `andromeda.webp`

**Elementos Comestibles:**
| Elemento | Textura | Puntos | Abundancia | Escala Visual |
|----------|---------|--------|------------|---------------|
| Enana Irregular | `enana_irregular.webp` | 15.0 | 40% | 3.0x |
| Nube de Gas | `nube_gas_frio.webp` | 20.0 | 20% | 3.0x |
| Enana Esferoidal | `enana_esferica.webp` | 25.0 | 20% | 3.0x |
| Pequeña Espiral | `pequeña_espiral.webp` | 30.0 | 10% | 4.0x |
| Cúmulo Globular | `cumulo_glubular.webp` | 35.0 | 10% | 4.0x |

---

### **NIVEL 3: Supercúmulo (Size 160-200)**

#### **Subnivel 1: Supercúmulos (160-200)**
- **Escala:** Megaparsecs (Mpc)
- **Textura Jugador:** `exotic_galaxy.webp` ⭐ **¡ZOOM OUT UNIVERSAL!**
- **Textura Bots:** `exotic_galaxy.webp`

**Elementos Comestibles:**
| Elemento | Textura | Puntos | Abundancia | Escala Visual |
|----------|---------|--------|------------|---------------|
| Elíptica Intermedia | `galaxia_01.webp` | 40.0 | 60% | 4.0x |
| Elíptica Gigante | `galaxia_02.webp` | 50.0 | 30% | 5.0x |
| BCG/cD Galaxy | `galaxia_03.webp` | 70.0 | 10% | 6.0x |

---

## 🔄 Mecánicas de Transición

### **Cambios de Textura Automáticos**
El jugador cambia de apariencia según su tamaño:
```
Size 2-26:   nebula.webp (átomo/grano de polvo)
Size 27-39:  roca.webp (asteroide)
Size 40-59:  LaTierra.webp (planeta)
Size 60-119: sol.webp (estrella)
Size 120-159: via_lactea.webp (galaxia)
Size 160-200: exotic_galaxy.webp (supercúmulo)
```

### **Zoom Out Cinematográfico**
- **Nivel 1 → 2 (size 120):** Zoom out desde estrella → galaxia
- **Nivel 2 → 3 (size 160):** Zoom out desde galaxia → supercúmulo

---

## 📁 Archivos Modificados

### **1. `/public/js/core/elements.js`**
- ✅ Sistema de elementos organizado por niveles y subniveles
- ✅ 23 elementos totales (5 átomos + 4 granos + 3 asteroides + 5 galaxias + 3 supercúmulos)
- ✅ Función `getAvailableElements(playerSize)` - Filtra elementos por tamaño
- ✅ Función `elementForOrb(orbId, playerSize)` - Selección determinista
- ✅ Función `getLevelInfoBySize(size)` - Info de nivel/subnivel

### **2. `/public/js/core/renderer.js`**
- ✅ Función `_getPlayerTextureKey(player)` - Selección de textura por tamaño
- ✅ Cambio dinámico de texturas durante el juego
- ✅ Sistema `visualScale` para tamaños diferenciados de orbes
- ✅ Método `renderOrb(orb, maxPlayerSize)` - Renderizado adaptativo

### **3. `/public/js/main.js`**
- ✅ Carga de texturas de jugador para todos los niveles
- ✅ Función `getLevelInfo(size)` actualizada con 6 niveles
- ✅ Función `getBoundsForLevel(level)` con rangos correctos
- ✅ Sistema `nmBands` con escalas apropiadas
- ✅ Paso de `maxPlayerSize` a `renderOrb()`

### **4. `/shared/levelsConfig.js`**
- ✅ Configuración de 6 niveles con subniveles
- ✅ Metadata: level, sublevel, description

---

## 🎮 Funcionalidades Implementadas

### ✅ **Completado:**
1. **Sistema de progresión por tamaño** (2-200)
2. **3 niveles principales con subniveles**
3. **23 elementos diferenciados por nivel**
4. **Cambio automático de texturas de jugador**
5. **Escalas visuales diferenciadas** (1x → 6x)
6. **Sistema de abundancia ponderado**
7. **Transiciones de nivel con banners**
8. **Configuración de escalas en UI**

### 🔨 **Por Implementar (Funcionalidades Extra):**
- **Quantum Tunnel** (Subnivel 1): Teletransporte aleatorio
- **Burst Zones** (Subnivel 2): Zonas de alta concentración
- **Asteroides Supersónicos** (Subnivel 3): Enemigos rápidos
- **Agujeros Negros** (Subnivel 4): Trampas estáticas
- **Agujeros de Gusano** (Subnivel 4): Teletransporte destructible
- **Disco de Acreción** (Subnivel 4): Planetas orbitando
- **AGN Jets** (Nivel 2): Galaxias con jets rotatorios
- **Materia Oscura** (Nivel 3): Visualización de estructura
- **Gran Atractor** (Final): Cinemática final inevitable

---

## 🧪 Testing

### **Verificar Progresión:**
1. Iniciar juego como `sdfgh`
2. Comer orbes hasta size 14 → Verificar cambio a granos de polvo
3. Crecer hasta size 27 → Verificar cambio de textura a `roca.webp`
4. Crecer hasta size 40 → Verificar cambio a `LaTierra.webp`
5. Crecer hasta size 60 → Verificar cambio a `sol.webp`
6. Crecer hasta size 120 → Verificar zoom out a `via_lactea.webp`
7. Crecer hasta size 160 → Verificar zoom out a `exotic_galaxy.webp`

### **Verificar Elementos:**
```javascript
// En consola del navegador:
window.getAvailableElements(10)  // → 5 átomos
window.getAvailableElements(20)  // → 4 granos
window.getAvailableElements(30)  // → 3 asteroides
window.getAvailableElements(130) // → 5 galaxias
window.getAvailableElements(170) // → 3 supercúmulos
```

---

## 📊 Estadísticas del Sistema

- **Total Elementos:** 23
- **Total Texturas Jugador:** 7 (nebula, roca, LaTierra, sol, via_lactea, exotic_galaxy)
- **Total Texturas Bots:** 5 (sol2, planeta_anillo, sol3, andromeda, exotic_galaxy)
- **Niveles Principales:** 3
- **Subniveles Totales:** 6
- **Rango de Tamaños:** 2-200
- **Escalas Visuales:** 1.0x - 6.0x

---

## 🚀 Próximos Pasos Recomendados

1. **Implementar Quantum Tunnel** (teletransporte aleatorio en subnivel 1)
2. **Crear Burst Zones** (zonas de alta densidad de orbes)
3. **Agregar Asteroides Supersónicos** (enemigos móviles)
4. **Implementar Agujeros Negros** (trampas estáticas)
5. **Sistema de Agujeros de Gusano** (portales destructibles)
6. **Disco de Acreción** (planetas orbitando al jugador-estrella)
7. **AGN Jets** (galaxias enemigas con jets rotatorios)
8. **Visualización de Materia Oscura** (efectos visuales)
9. **Cinemática del Gran Atractor** (final del juego)

---

## 📝 Notas Técnicas

### **Colores Ignorados:**
Los colores mencionados en la especificación original fueron ignorados porque las texturas `.webp` ya tienen los colores incorporados en el pixel art.

### **Subniveles del Nivel 2 y 3:**
Según la especificación, el nivel 2 y 3 no tienen subniveles, solo el nivel 1 tiene 3 subniveles.

### **Zoom Out:**
El mecanismo de zoom out ya está implementado en el sistema. Se activa automáticamente en las transiciones de nivel 1→2 y 2→3.

---

**Última Actualización:** 5 de octubre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Sistema Base Implementado
