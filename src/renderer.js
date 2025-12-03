import * as THREE from 'three';

export function createVideoPlane() {
    // Создание видеоэлемента для YouTube рикролла
    const video = document.createElement('video');
    video.src = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    
    // Создание плоскости для видео
    const geometry = new THREE.PlaneGeometry(1.6, 0.9);
    const material = new THREE.MeshBasicMaterial({ 
        map: videoTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    const videoPlane = new THREE.Mesh(geometry, material);
    videoPlane.visible = false;
    
    // Сохраняем ссылку на видео для управления воспроизведением
    videoPlane.userData.videoElement = video;
    
    return videoPlane;
}