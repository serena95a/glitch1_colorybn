let miShader;
let webcam;
let archivoCargado = null;
let esVideo = false;
let fileInput;

// Banderas para efectos
let glitchActivo = false;
let deformActiva = false;
let negativoActivo = false;

// UI y Sliders
let sliderGlitch, sliderDeform, sliderColor;
let panelUI;
let uiVisible = true;

// Variables para Drag & Drop del panel
let isDragging = false;
let offsetX = 0, offsetY = 0;

function preload() {
  miShader = loadShader('shader.vert', 'shader.frag');
}

function setup() {
  let mainCanvas = createCanvas(windowWidth, windowHeight, WEBGL);
  mainCanvas.style('position', 'absolute');
  mainCanvas.style('top', '0');
  mainCanvas.style('left', '0');
  mainCanvas.style('z-index', '1');
  noStroke();

  // Webcam por defecto
  webcam = createCapture(VIDEO);
  webcam.size(width, height);
  webcam.hide();

  // Input oculto para archivos
  fileInput = createFileInput(handleFile);
  fileInput.hide();

  // Armar el panel de interfaz
  crearPanelEdicion();

  // Escuchador global para la barra espaciadora (evita bloqueos del browser)
  window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.keyCode === 32) {
      e.preventDefault();
      toggleUI();
    }
  });
}

function draw() {
  background(0);

  let fuenteActual = archivoCargado ? archivoCargado : webcam;

  if (fuenteActual && (archivoCargado || (webcam.loadedmetadata && webcam.width > 0))) {
    shader(miShader);

    miShader.setUniform('u_tex', fuenteActual);
    miShader.setUniform('u_time', millis() / 1000.0);
    miShader.setUniform('u_resolution', [width, height]);
    miShader.setUniform('u_mouse', [mouseX / width, mouseY / height]);
    
    // Estados de switches
    miShader.setUniform('u_glitchActive', glitchActivo ? 1.0 : 0.0);
    miShader.setUniform('u_deformActive', deformActiva ? 1.0 : 0.0);
    miShader.setUniform('u_negativoActive', negativoActivo ? 1.0 : 0.0);

    // Mapeo normalizado (0 a 100 -> 0.0 a 1.0)
    let valColor  = float(sliderColor.value()) / 100.0;
    let valGlitch = float(sliderGlitch.value()) / 100.0;
    let valDeform = float(sliderDeform.value()) / 100.0;

    miShader.setUniform('u_colorAmount', valColor);
    miShader.setUniform('u_glitchAmount', valGlitch);
    miShader.setUniform('u_deformAmount', valDeform);

    rect(-width / 2, -height / 2, width, height);
  }
}

function toggleUI() {
  uiVisible = !uiVisible;
  if (uiVisible) {
    panelUI.removeClass('oculto');
    cursor();
  } else {
    panelUI.addClass('oculto');
    noCursor();
  }
}

function crearPanelEdicion() {
  panelUI = createDiv();
  panelUI.id('panel-edicion');

  let header = createDiv();
  header.id('panel-header');
  header.html('<span>FX PROPERTIES</span>');
  panelUI.child(header);

  let body = createDiv();
  body.id('panel-body');

  // 1. SLIDER COLOR SHIFT (Primero)
  let groupColor = createDiv();
  groupColor.addClass('control-group');
  groupColor.child(createSpan('COLOR SHIFT'));
  sliderColor = createSlider(0, 100, 50, 1);
  groupColor.child(sliderColor);

  // 2. SLIDER GLITCH VHS (Segundo)
  let groupGlitch = createDiv();
  groupGlitch.addClass('control-group');
  groupGlitch.child(createSpan('GLITCH VHS'));
  sliderGlitch = createSlider(0, 100, 10, 1);
  groupGlitch.child(sliderGlitch);

  // 3. SLIDER LIQUID DISTORTION (Tercero)
  let groupDeform = createDiv();
  groupDeform.addClass('control-group');
  groupDeform.child(createSpan('LIQUID DISTORTION'));
  sliderDeform = createSlider(0, 100, 10, 1);
  groupDeform.child(sliderDeform);

  body.child(groupColor);
  body.child(groupGlitch);
  body.child(groupDeform);
  
  panelUI.child(body);

  // Desenfocar sliders al soltar el click para no bloquear la tecla espacio
  sliderColor.elt.addEventListener('mouseup', () => sliderColor.elt.blur());
  sliderGlitch.elt.addEventListener('mouseup', () => sliderGlitch.elt.blur());
  sliderDeform.elt.addEventListener('mouseup', () => sliderDeform.elt.blur());

  // Lógica de Drag & Drop para mover la ventana
  let headerElt = header.elt;
  let panelElt = panelUI.elt;

  headerElt.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - panelElt.offsetLeft;
    offsetY = e.clientY - panelElt.offsetTop;
    e.stopPropagation();
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      panelElt.style.left = (e.clientX - offsetX) + 'px';
      panelElt.style.top = (e.clientY - offsetY) + 'px';
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  panelElt.addEventListener('mousedown', (e) => e.stopPropagation());
  panelElt.addEventListener('mousemove', (e) => e.stopPropagation());
}

function handleFile(file) {
  limpiarArchivoCargado();
  if (file.type === 'image') {
    archivoCargado = loadImage(file.data);
    esVideo = false;
  } else if (file.type === 'video') {
    archivoCargado = createVideo(file.data, () => {
      archivoCargado.loop();
      archivoCargado.volume(0);
      archivoCargado.hide();
    });
    esVideo = true;
  }
}

function limpiarArchivoCargado() {
  if (archivoCargado) {
    if (esVideo) {
      archivoCargado.stop();
      archivoCargado.remove();
    }
    archivoCargado = null;
    esVideo = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (webcam) webcam.size(width, height);
}

function keyPressed() {
  if (keyCode === ENTER) fileInput.elt.click();
  if (keyCode === DELETE || keyCode === BACKSPACE) limpiarArchivoCargado();

  if (key === '1' || keyCode === 49) glitchActivo = !glitchActivo;
  if (key === '2' || keyCode === 50) deformActiva = !deformActiva;
  if (key === '3' || keyCode === 51) negativoActivo = !negativoActivo;
  if (key === 'f' || key === 'F') fullscreen(!fullscreen());
}