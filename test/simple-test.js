import * as THREE from 'three';

class SimpleARTest {
    constructor() {
        this.videoElement = document.getElementById('camera-video');
        this.canvas = document.getElementById('ar-canvas');
        this.debugInfo = document.getElementById('debug-info');
        
        this.init();
    }
    
    async init() {
        try {
            // 1. Тест камеры
            await this.startCamera();
            this.debugInfo.innerHTML = "🎥 Камера работает!<br>Вы должны видеть видео с камеры";
            
            // 2. Тест Three.js цветной куб
            await this.initThreeJS();
            this.debugInfo.innerHTML += "<br>🟦 Three.js работает! Должен появиться вращающийся куб";
            
            // 3. Тест видео 
            await this.testVideo();
            this.debugInfo.innerHTML += "<br>🎬 Видео загружено! Должен играть рикролл";
            
        } catch (error) {
            console.error('Ошибка:', error);
            this.debugInfo.innerHTML = `❌ Ошибка: ${error.message}`;
        }
    }
    
    async startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        this.videoElement.srcObject = stream;
        
        return new Promise((resolve) => {
            this.videoElement.onloadedmetadata = () => {
                this.videoElement.play();
                resolve();
            };
        });
    }
    
    async initThreeJS() {
        // Сцена
        this.scene = new THREE.Scene();
        
        // Камера
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;
        
        // Рендерер
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Тестовый куб - вы должны его увидеть!
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            wireframe: false 
        });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
        
        // Анимация куба
        this.animate();
    }
    
    async testVideo() {
        // Создаем видео элемент с рикроллом
        const video = document.createElement('video');
        video.src = 'https://assets.codepen.io/507137/rickroll.mp4'; // Тестовое видео
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        
        // Ждем загрузки видео
        await new Promise((resolve) => {
            video.oncanplay = () => {
                video.play();
                resolve();
            };
        });
        
        // Создаем текстуру из видео
        const videoTexture = new THREE.VideoTexture(video);
        const videoGeometry = new THREE.PlaneGeometry(4, 3);
        const videoMaterial = new THREE.MeshBasicMaterial({ 
            map: videoTexture,
            side: THREE.DoubleSide
        });
        
        const videoPlane = new THREE.Mesh(videoGeometry, videoMaterial);
        videoPlane.position.y = 2; // Размещаем над кубом
        this.scene.add(videoPlane);
        
        this.debugInfo.innerHTML += `<br>📺 Видео размер: ${video.videoWidth}x${video.videoHeight}`;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Вращаем куб 
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Запускаем тест
new SimpleARTest();

function toggleVideo() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    });
}

function toggleCube() {
    if (window.testApp && window.testApp.cube) {
        window.testApp.cube.visible = !window.testApp.cube.visible;
    }
}

// Сохраняем ссылку для глобального доступа
window.testApp = new SimpleARTest();