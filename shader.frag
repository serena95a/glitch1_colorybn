precision mediump float;

uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

// Controles On/Off
uniform float u_glitchActive;
uniform float u_deformActive;
uniform float u_negativoActive;

// Intensidades de Sliders (0.0 a 1.0)
uniform float u_glitchAmount;
uniform float u_deformAmount;
uniform float u_colorAmount;

varying vec2 vTexCoord;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

  // --- 1. DEFORMACIÓN LÍQUIDA EXTREMA (TECLA 2) ---
  if (u_deformActive > 0.5) {
    vec2 mouseUV = vec2(u_mouse.x, 1.0 - u_mouse.y);
    vec2 distVec = uv - mouseUV;
    float dist = length(distVec);

    if (dist > 0.0001) {
      float fuerza = pow(u_deformAmount, 1.5) * 1.2;
      float frecuencia = 10.0 + u_deformAmount * 40.0;
      float onda = sin(dist * frecuencia - u_time * (3.0 + u_deformAmount * 8.0)) * fuerza;
      
      uv += (distVec / dist) * onda;
    }
  }

  // --- 2. GLITCH Y SCANLINES (TECLA 1) ---
  if (u_glitchActive > 0.5) {
    float factorGlitch = pow(u_glitchAmount, 1.5);
    float bloque = floor(uv.y * (20.0 + factorGlitch * 60.0));
    float n = random(vec2(bloque, floor(u_time * 25.0)));
    
    if (n > (0.9 - factorGlitch * 0.7)) { 
      float shift = (random(vec2(bloque, u_time)) - 0.5) * (1.2 * factorGlitch);
      uv.x += shift;
    }
    
    float scanline = sin(uv.y * u_resolution.y * 2.0) * (0.15 * factorGlitch);
    uv.x += scanline;
  }

  // --- 3. LECTURA DE TEXTURA BASE ---
  vec4 colorBase = texture2D(u_tex, uv);
  vec3 col = colorBase.rgb;

  // --- 4. CÁLCULO PSICODÉLICO CON COLOR SHIFT ---
  // El u_colorAmount modula el desfasaje angular y la velocidad de los senos/cosenos
  float shiftFase = u_colorAmount * 12.56; // 0 a 4*PI de rotación
  float multFreq = 1.0 + u_colorAmount * 8.0;

  float r = sin(col.r * multFreq + u_mouse.x * 10.0 + u_time + shiftFase) * 0.5 + 0.5;
  float g = cos(col.g * multFreq + u_mouse.y * 10.0 + shiftFase) * 0.5 + 0.5;
  float b = sin(col.b * (multFreq * 0.5) + u_mouse.x * 5.0 + u_mouse.y * 5.0 + shiftFase) * 0.5 + 0.5;

  vec3 colorProcesado = vec3(r, g, b);
  colorProcesado = abs(sin(colorProcesado * (2.0 + u_colorAmount * 4.0) + u_time * 0.5));

  // --- 5. BLANCO Y NEGRO NEGATIVO (TECLA 3) ---
  if (u_negativoActive > 0.5) {
    // Luminancia basada en la intensidad cromática procesada
    float gray = (colorProcesado.r + colorProcesado.g + colorProcesado.b) / 3.0;
    float inv = 1.0 - gray;
    
    // COLOR SHIFT en B&N: Afecta la curva gamma / contraste del negativo
    float curvaGamma = 0.2 + u_colorAmount * 2.5;
    inv = pow(clamp(inv, 0.0, 1.0), curvaGamma);
    
    colorProcesado = vec3(inv);
  }

  gl_FragColor = vec4(colorProcesado, 1.0);
}