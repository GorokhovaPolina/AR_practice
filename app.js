let scene, camera, renderer;
let arToolkitSource, arToolkitContext;
let markerRoot, videoPlane, videoTexture;
let video;
let fullscreenOverlay;

// инициализация приложения
function init() {
  // создаем сцену
  scene = new THREE.Scene();
  camera = new THREE.Camera();
  scene.add(camera);

  // создаем рендерер
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Полностью прозрачный фон
  document.body.appendChild(renderer.domElement);

  // настройка камеры
  arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam',
    sourceWidth: 1280,
    sourceHeight: 720,
    displayWidth: window.innerWidth,
    displayHeight: window.innerHeight
  });

  arToolkitSource.init(function onReady() {
    setTimeout(() => {
      const arElements = document.querySelectorAll('[style*="right: 10px"]');
      arElements.forEach(el => el.style.display = 'none');
    }, 1000);

    onResize();
  });

  // настройка AR контекста
  arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/camera_para.dat',
    detectionMode: 'mono',
    maxDetectionRate: 60,
    canvasWidth: window.innerWidth,
    canvasHeight: window.innerHeight
  });

  // рнициализируем AR контекст
  arToolkitContext.init(() => {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
  });

  // создаем корневую группу для маркера
  markerRoot = new THREE.Group();
  scene.add(markerRoot);

  // добавляем контролы для маркера
  new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/patt.hiro',
    changeMatrixMode: 'cameraTransformMatrix'
  });

  initVideo();
  createVideoPlane();
  initOverlay();
  setupEventListeners();
  animate();
}

// видео!
function initVideo() {
  video = document.createElement('video');
  video.src = './public/videos/rickroll.mp4';
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.style.display = 'none';
  document.body.appendChild(video);
  
  // ждем загрузки метаданных видео
  video.addEventListener('loadedmetadata', function() {
    video.play().catch(e => console.log('Автовоспроизведение заблокировано:', e));
  });
}

// создание видео плоскости
function createVideoPlane() {
  // создаем текстуру из видео
  videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;

  // создаем геометрию и материал
  const planeGeometry = new THREE.PlaneGeometry(1, 1);
  const planeMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  });

  // создаем меш
  videoPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  videoPlane.rotation.x = THREE.MathUtils.degToRad(-90);
  
  // добавляем к маркеру
  markerRoot.add(videoPlane);
}

// инициализация оверлея
function initOverlay() {
  fullscreenOverlay = document.getElementById('fullscreen-overlay');
  
  document.getElementById('enter-fullscreen').addEventListener('click', function() {
    // запускаем полноэкранный режим
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    }
    
    // запускаем видео
    video.play().then(() => {
      // скрываем оверлей с анимацией
      fullscreenOverlay.classList.add('transparent');
      setTimeout(() => {
        fullscreenOverlay.classList.add('hidden');
      }, 500);
    }).catch(e => {
      console.log('Ошибка воспроизведения:', e);
      alert('Для работы приложения необходимо разрешить автовоспроизведение видео');
    });
  });
}

// обработчики событий
function setupEventListeners() {
  window.addEventListener('resize', onResize);
  
  // обработчик выхода из полноэкранного режима
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
}

// обработка изменения полноэкранного режима
function handleFullscreenChange() {
  const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
  
  if (!isFullscreen) {
    // показываем оверлей при выходе из полноэкранного режима
    fullscreenOverlay.classList.remove('hidden', 'transparent');
    video.pause();
  }
}

// обработка изменения размера окна
function onResize() {
  if (arToolkitSource && arToolkitSource.domElement) {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    
    if (arToolkitContext && arToolkitContext.arController) {
      arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
  }
  
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  if (camera && arToolkitContext) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
}

// Анимация
function animate() {
  requestAnimationFrame(animate);

  if (arToolkitSource && arToolkitSource.ready) {
    arToolkitContext.update(arToolkitSource.domElement);
  }

  if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// запуск приложения при загрузке страницы
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('contextmenu', e => e.preventDefault());