import * as THREE from 'three';
import { initCamera } from './camera.js';
import { initARDetector } from './detector.js';
import { createVideoPlane } from './renderer.js';

class ARApp {
    constructor() {
        this.videoElement = document.getElementById('camera-video');
        this.canvas = document.getElementById('ar-canvas');
        this.debugInfo = document.getElementById('debug-info');
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        this.arVideo = null;
        this.isTracking = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Инициализация камеры
            await initCamera(this.videoElement);
            
            // Инициализация детектора маркеров
            this.detector = await initARDetector(this.videoElement);
            
            // Создание AR-видео
            this.arVideo = createVideoPlane();
            this.scene.add(this.arVideo);
            
            // Настройка освещения
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            this.scene.add(directionalLight);
            
            this.animate();
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.detector && this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
            this.detectMarker();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    detectMarker() {
        const result = this.detector.detect();
        
        if (result && result.found) {
            if (!this.isTracking) {
                this.onMarkerFound();
            }
            this.updateCameraPose(result);
            this.debugInfo.textContent = 'Маркер обнаружен!';
        } else {
            if (this.isTracking) {
                this.onMarkerLost();
            }
            this.debugInfo.textContent = 'Маркер не найден';
        }
    }
    
    onMarkerFound() {
        this.isTracking = true;
        if (this.arVideo.userData.videoElement) {
            this.arVideo.userData.videoElement.play().catch(console.error);
        }
    }
    
    onMarkerLost() {
        this.isTracking = false;
        if (this.arVideo.userData.videoElement) {
            this.arVideo.userData.videoElement.pause();
        }
    }
    
    updateCameraPose(detectionResult) {
        // Преобразование позы из детектора в матрицу Three.js
        const { rvec, tvec } = detectionResult;
        
        // Здесь преобразование координат OpenCV → Three.js
        const modelViewMatrix = this.calculateModelViewMatrix(rvec, tvec);
        this.camera.matrixWorldInverse.fromArray(modelViewMatrix);
        this.camera.matrixWorld.getInverse(this.camera.matrixWorldInverse);
        this.camera.updateMatrixWorld(true);
        
        // Позиционирование видео на маркере
        this.arVideo.visible = true;
        this.arVideo.matrix.copy(this.camera.matrixWorld);
    }
    
    calculateModelViewMatrix(rvec, tvec) {
        // Упрощённое преобразование - в реальности нужно solvePnP
        const matrix = new THREE.Matrix4();
        
        // Примерные преобразования (заменить на реальные из solvePnP)
        matrix.makeRotationFromEuler(new THREE.Euler(
            -rvec[0], -rvec[1], rvec[2], 'XYZ'
        ));
        
        matrix.setPosition(
            tvec[0] * 0.01,  // Масштабирование
            -tvec[1] * 0.01, 
            -tvec[2] * 0.01
        );
        
        return matrix.elements;
    }
}

// Запуск приложения
new ARApp();