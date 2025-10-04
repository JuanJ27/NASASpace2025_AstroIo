#!/bin/bash

# Script de Verificación - Fondo Estrellado AstroIo
# Fecha: 4 de octubre de 2025

echo "=================================================="
echo "   VERIFICACIÓN DE IMPLEMENTACIÓN - ASTROIO      "
echo "=================================================="
echo ""

# Verificar servidor
echo "1. Verificando servidor..."
if pgrep -f "node server.js" > /dev/null; then
    PID=$(pgrep -f "node server.js")
    echo "   ✅ Servidor corriendo (PID: $PID)"
else
    echo "   ❌ Servidor no está corriendo"
    echo "   Iniciando servidor..."
    cd /home/juan/NASASpace2025_AstroIo
    node server.js > server.log 2>&1 &
    sleep 2
    echo "   ✅ Servidor iniciado"
fi
echo ""

# Verificar assets
echo "2. Verificando assets de estrellas..."
if [ -f "/home/juan/NASASpace2025_AstroIo/public/assets/star1.webp" ]; then
    SIZE1=$(stat -f%z "/home/juan/NASASpace2025_AstroIo/public/assets/star1.webp" 2>/dev/null || stat -c%s "/home/juan/NASASpace2025_AstroIo/public/assets/star1.webp")
    echo "   ✅ star1.webp encontrado (${SIZE1} bytes)"
else
    echo "   ❌ star1.webp NO encontrado"
fi

if [ -f "/home/juan/NASASpace2025_AstroIo/public/assets/star2.webp" ]; then
    SIZE2=$(stat -f%z "/home/juan/NASASpace2025_AstroIo/public/assets/star2.webp" 2>/dev/null || stat -c%s "/home/juan/NASASpace2025_AstroIo/public/assets/star2.webp")
    echo "   ✅ star2.webp encontrado (${SIZE2} bytes)"
else
    echo "   ❌ star2.webp NO encontrado"
fi
echo ""

# Verificar archivos principales
echo "3. Verificando archivos del proyecto..."
FILES=("public/index.html" "server.js" "README.md" "SESSION_SUMMARY.txt" "STARFIELD_IMPLEMENTATION.md")
for file in "${FILES[@]}"; do
    if [ -f "/home/juan/NASASpace2025_AstroIo/$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file NO encontrado"
    fi
done
echo ""

# Verificar funciones en index.html
echo "4. Verificando funciones del fondo estrellado en index.html..."
if grep -q "createStarryBackground" "/home/juan/NASASpace2025_AstroIo/public/index.html"; then
    echo "   ✅ createStarryBackground() implementada"
else
    echo "   ❌ createStarryBackground() NO encontrada"
fi

if grep -q "updateStarParallax" "/home/juan/NASASpace2025_AstroIo/public/index.html"; then
    echo "   ✅ updateStarParallax() implementada"
else
    echo "   ❌ updateStarParallax() NO encontrada"
fi

if grep -q "starContainer" "/home/juan/NASASpace2025_AstroIo/public/index.html"; then
    echo "   ✅ starContainer declarado"
else
    echo "   ❌ starContainer NO encontrado"
fi

if grep -q "ParticleContainer" "/home/juan/NASASpace2025_AstroIo/public/index.html"; then
    echo "   ✅ ParticleContainer utilizado"
else
    echo "   ❌ ParticleContainer NO encontrado"
fi
echo ""

# Verificar puerto
echo "5. Verificando puerto 3000..."
if lsof -i:3000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":3000 "; then
    echo "   ✅ Puerto 3000 en uso (servidor activo)"
else
    echo "   ⚠️  Puerto 3000 no está en uso"
fi
echo ""

# Resumen
echo "=================================================="
echo "   RESUMEN DE VERIFICACIÓN                        "
echo "=================================================="
echo ""
echo "URL del juego: http://localhost:3000"
echo ""
echo "Para probar manualmente:"
echo "  1. Abre http://localhost:3000 en tu navegador"
echo "  2. Ingresa un nombre y presiona LAUNCH"
echo "  3. Verifica que veas estrellas parpadeando"
echo "  4. Mueve el mouse y confirma efecto parallax"
echo ""
echo "Para ejecutar tests automatizados:"
echo "  cd /home/juan/NASASpace2025_AstroIo"
echo "  node test-client.js"
echo "  node test-combat.js"
echo ""
echo "=================================================="
