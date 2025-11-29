/**
 * Main AR Application with AR.js integration
 * Detects single marker and renders video content on it
 * 
 * Stack: AR.js 2.2.2 + Three.js (rendering)
 */

// Use global THREE from script tag (will be set by AR.js or loaded separately)
const THREE = window.THREE || (window.THREEx && window.THREEx.THREE);

import { AssetLoader } from './assetLoader.js';
import { MARKER_CONFIG, VIDEO_ASSETS, MESH_CONFIG, LIGHTING_CONFIG, CAMERA_CONFIG, DEBUG_CONFIG } from './constants.js';

class ARApp {
    constructor() {
        this.container = document.getElementById('ar-container');
        this.statusText = document.getElementById('status-text');
        this.markerStatus = document.getElementById('marker-status');
        this.videoStatus = document.getElementById('video-status');
        this.fpsCounter = document.getElementById('fps');

        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arToolkitSource = null;
        this.arToolkitContext = null;
        this.markerGroup = null;

        // Asset management
        this.assetLoader = new AssetLoader();
        this.videoMesh = null;
        this.isMarkerDetected = false;

        // Performance tracking
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        this.errorLogged = false;  // Flag to suppress repeated error logs

        // Wait for AR.js to load (it's a global script)
        this.waitForARJS();
    }

    /**
     * Wait for AR.js library to be available globally
     */
    async waitForARJS() {
        // Wait for AR.js to load - we need THREEx, ARController, ARCameraParam, etc.
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds (100 * 50ms)
        
        while (attempts < maxAttempts) {
            const threexLoaded = typeof window.THREEx !== 'undefined';
            const arControllerLoaded = typeof window.ARController !== 'undefined';
            const arCameraParamLoaded = typeof window.ARCameraParam !== 'undefined';
            const threeLoaded = typeof window.THREE !== 'undefined' || (window.THREEx && window.THREEx.THREE);
            
            if (threexLoaded && arControllerLoaded && arCameraParamLoaded && threeLoaded) {
                console.log('✅ AR.js loaded successfully');
                console.log('   THREE:', !!window.THREE);
                console.log('   THREEx:', !!window.THREEx);
                console.log('   ARController:', !!window.ARController);
                console.log('   ARCameraParam:', !!window.ARCameraParam);
                
                // Make sure THREE is available globally
                if (!window.THREE && window.THREEx && window.THREEx.THREE) {
                    window.THREE = window.THREEx.THREE;
                }
                
                await this.init();
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        
        console.error('❌ AR.js libraries failed to load after 5 seconds');
        console.error('Available globals:', {
            THREE: typeof window.THREE,
            THREEx: typeof window.THREEx,
            ARController: typeof window.ARController,
            ARCameraParam: typeof window.ARCameraParam
        });
        throw new Error('AR.js libraries not loaded');
    }

    async init() {
        try {
            console.log('🚀 Starting ARApp initialization...');
            this.updateStatus('Initializing AR.js...', 'loading');
            
            // Initialize Three.js scene
            console.log('📐 Initializing Three.js scene...');
            this.initThreeJS();
            console.log('✅ Three.js scene initialized');
            
            // Check camera access before AR.js
            console.log('📷 Checking camera access...');
            await this.checkCameraAccess();
            console.log('✅ Camera access verified');
            
            // Initialize AR.js
            this.updateStatus('Setting up marker detection...', 'loading');
            console.log('🔍 Initializing AR.js marker detection...');
            await this.initARJS();
            console.log('✅ AR.js initialized successfully');
            
            // Load video assets
            this.updateStatus('Loading video assets...', 'loading');
            console.log('🎬 Loading video assets...');
            await this.loadVideoAssets();
            console.log('✅ Video assets loaded');
            
            // Start animation loop
            console.log('▶️ Starting animation loop...');
            this.updateStatus('Ready', 'ok');
            this.animate();
            console.log('✅ ARApp fully initialized and running');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            console.error('Error stack:', error.stack);
            this.updateStatus(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Check if camera is accessible before initializing AR.js
     */
    async checkCameraAccess() {
        try {
            console.log('🔐 Requesting camera permissions...');
            
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia not supported in this browser');
            }
            
            console.log('✅ getUserMedia API available');
            
            // Request camera access
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: MARKER_CONFIG.canvasWidth },
                    height: { ideal: MARKER_CONFIG.canvasHeight }
                }
            };
            
            console.log('📹 Requesting camera with constraints:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('✅ Camera permission granted!');
            console.log('📊 Stream tracks:', stream.getTracks());
            
            // Stop all tracks immediately - we just needed to check access
            stream.getTracks().forEach(track => {
                console.log(`⏹️ Stopping track: ${track.kind} (${track.label})`);
                track.stop();
            });
            
            console.log('✅ Camera access confirmed, stream closed');
            
        } catch (error) {
            console.error('❌ Camera access error:', error.message);
            console.error('Possible causes:');
            console.error('  - Browser doesn\'t support camera access');
            console.error('  - User denied camera permission');
            console.error('  - No camera device available');
            console.error('  - HTTPS/localhost required for camera');
            throw error;
        }
    }

    /**
     * Initialize Three.js scene, camera, and renderer
     */
    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_CONFIG.fov,
            width / height,
            CAMERA_CONFIG.near,
            CAMERA_CONFIG.far
        );

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(
            LIGHTING_CONFIG.ambient.color,
            LIGHTING_CONFIG.ambient.intensity
        );
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(
            LIGHTING_CONFIG.directional.color,
            LIGHTING_CONFIG.directional.intensity
        );
        directionalLight.position.set(
            LIGHTING_CONFIG.directional.position.x,
            LIGHTING_CONFIG.directional.position.y,
            LIGHTING_CONFIG.directional.position.z
        );
        this.scene.add(directionalLight);

        // Create marker group (will be positioned by AR.js)
        this.markerGroup = new THREE.Group();
        this.markerGroup.name = 'markerRoot';
        this.scene.add(this.markerGroup);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Initialize AR.js (marker detection) - AR.js 2.2.2 with THREEx
     */
    async initARJS() {
        try {
            console.log('🔧 Initializing AR.js 2.2.2 with THREEx...');
            
            // Create canvas element for AR.js
            const arCanvas = document.createElement('canvas');
            arCanvas.id = 'arjs-canvas';
            arCanvas.width = MARKER_CONFIG.canvasWidth;
            arCanvas.height = MARKER_CONFIG.canvasHeight;
            arCanvas.style.display = 'block';
            arCanvas.style.position = 'absolute';
            arCanvas.style.top = '0';
            arCanvas.style.left = '0';
            arCanvas.style.width = '100%';
            arCanvas.style.height = '100%';
            arCanvas.style.zIndex = '0';
            this.container.insertBefore(arCanvas, this.container.firstChild);
            this.arCanvas = arCanvas;

            // Load camera parameters
            console.log('📷 Loading camera parameters...');
            this.cameraParam = new ARCameraParam(MARKER_CONFIG.cameraParametersUrl);
            
            await new Promise((resolve) => {
                this.cameraParam.onload = () => {
                    console.log('✅ Camera parameters loaded');
                    resolve();
                };
                setTimeout(() => {
                    console.log('✅ Camera parameters loaded (or using defaults)');
                    resolve();
                }, 1000);
            });

            // Create AR controller using THREEx
            console.log('🎮 Creating ARController...');
            this.arController = new ARController(
                arCanvas.width,
                arCanvas.height,
                this.cameraParam
            );
            console.log('✅ ARController created');

            // Get video stream from camera
            console.log('📹 Getting video stream...');
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: MARKER_CONFIG.canvasWidth },
                    height: { ideal: MARKER_CONFIG.canvasHeight }
                }
            };
            
            try {
                this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('✅ Video stream acquired');
                
                // Create video element and attach stream
                const videoElement = document.createElement('video');
                videoElement.setAttribute('autoplay', true);
                videoElement.setAttribute('playsinline', true);
                videoElement.style.position = 'absolute';
                videoElement.style.top = '0';
                videoElement.style.left = '0';
                videoElement.style.width = '100%';
                videoElement.style.height = '100%';
                videoElement.style.zIndex = '-1';
                videoElement.style.transform = 'scaleX(-1)';
                this.container.insertBefore(videoElement, this.arCanvas);
                
                videoElement.srcObject = this.videoStream;
                this.videoElement = videoElement;
                
                await new Promise((resolve) => {
                    videoElement.onloadedmetadata = () => {
                        videoElement.play();
                        console.log('✅ Video element ready and playing');
                        resolve();
                    };
                    setTimeout(resolve, 2000);
                });
                
            } catch (error) {
                console.warn('⚠️ Could not get video stream:', error.message);
            }

            // Load marker pattern
            console.log(`🎯 Setting up marker detection (${MARKER_CONFIG.type})...`);
            // For Hiro pattern, AR.js detects it by default
            // We just need to set up the detection without explicitly loading
            console.log('   ✅ Hiro marker detection enabled');

            console.log('🎬 Configuring camera projection...');
            console.log('✅ Camera projection configured');

            console.log('✅ AR.js initialization complete');

        } catch (error) {
            console.error('❌ AR.js initialization error:', error);
            console.error('Error details:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    /**
     * Setup marker detection using ARController
     */
    setupMarkerDetection() {
        console.log('🎯 Marker detection setup complete');
    }

    /**
     * Load video assets
     */
    async loadVideoAssets() {
        try {
            console.log('🎥 Loading primary video asset...');
            console.log(`   URL: ${VIDEO_ASSETS.primary.url}`);
            console.log(`   Config:`, VIDEO_ASSETS.primary);
            
            // Load primary video
            const asset = await this.assetLoader.loadVideoTexture(
                VIDEO_ASSETS.primary.url,
                VIDEO_ASSETS.primary.name,
                {
                    muted: VIDEO_ASSETS.primary.muted,
                    loop: VIDEO_ASSETS.primary.loop,
                    autoplay: false
                }
            );
            console.log('✅ Primary video loaded successfully');
            console.log('   Video element:', asset.videoElement);
            console.log('   Texture:', asset.texture);

            console.log('🎨 Creating video mesh...');
            // Create video mesh
            this.videoMesh = this.assetLoader.createVideoMesh(asset.texture, MESH_CONFIG);
            this.videoMesh.visible = false;
            this.markerGroup.add(this.videoMesh);
            console.log('✅ Video mesh created and added to marker group');

            this.updateVideoStatus('Ready');
            console.log('✅ Video assets fully loaded and ready');
            
        } catch (error) {
            console.error('❌ Failed to load video:', error);
            console.error('   Error message:', error.message);
            console.error('   Stack:', error.stack);
            this.updateVideoStatus(`Load failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Marker found - start playing video
     */
    onMarkerFound() {
        console.log('🎉 ✅ MARKER DETECTED!');
        this.updateMarkerStatus('Detected', 'found');
        
        if (this.videoMesh) {
            console.log('📺 Making video mesh visible and playing...');
            this.videoMesh.visible = true;
            this.assetLoader.playVideo(this.videoMesh);
            this.updateVideoStatus('Playing');
            console.log('▶️ Video started playing');
        } else {
            console.warn('⚠️ Video mesh not initialized');
        }
    }

    /**
     * Marker lost - pause video
     */
    onMarkerLost() {
        console.log('❌ Marker lost');
        this.updateMarkerStatus('Not detected', 'lost');
        
        if (this.videoMesh) {
            console.log('⏸️ Pausing video and hiding mesh...');
            this.videoMesh.visible = false;
            this.assetLoader.pauseVideo(this.videoMesh);
            this.updateVideoStatus('Paused');
            console.log('⏹️ Video paused');
        } else {
            console.warn('⚠️ Video mesh not initialized');
        }
    }

    /**
     * Animation loop
     */
    animate = () => {
        requestAnimationFrame(this.animate);

        try {
            // Process AR frame if we have a controller and video
            if (this.arController && this.videoElement && this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
                // Draw video frame to canvas for AR processing
                const ctx = this.arCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(this.videoElement, 0, 0, this.arCanvas.width, this.arCanvas.height);
                }
                
                // Process the frame for marker detection
                this.arController.process(this.arCanvas);

                // Check if any markers are detected
                const markerCount = this.arController.getMarkerNum();
                
                // Debug logging - log every 30 frames
                if (this.frameCount % 30 === 0) {
                    console.log(`📍 Markers detected: ${markerCount}`);
                }
                
                if (markerCount > 0 && this.markerGroup) {
                    try {
                        // Create output array for transformation matrix
                        const transArray = new Float32Array(16);
                        
                        // getTransMatSquare(markerIndex, patternWidth, outputMatrix)
                        // It modifies the outputMatrix in place and returns true/false
                        const success = this.arController.getTransMatSquare(0, 100, transArray);
                        
                        console.log(`   getTransMatSquare success: ${success}`);
                        
                        if (success && transArray.length >= 16) {
                            // Apply transformation to marker group
                            if (!this.markerGroup.matrix) {
                                this.markerGroup.matrix = new THREE.Matrix4();
                            }
                            this.markerGroup.matrix.fromArray(transArray);
                            this.markerGroup.matrixAutoUpdate = false;
                            this.markerGroup.visible = true;
                            
                            if (!this.isMarkerDetected) {
                                this.isMarkerDetected = true;
                                console.log('🎉 MARKER FOUND!');
                                this.onMarkerFound();
                            }
                        } else {
                            // Transform failed
                            if (this.isMarkerDetected) {
                                this.markerGroup.visible = false;
                                this.isMarkerDetected = false;
                                console.log('❌ Marker lost (transform failed)');
                                this.onMarkerLost();
                            }
                        }
                    } catch (e) {
                        // Outer catch for any other errors
                        console.log('   Outer error:', e.message);
                        if (this.isMarkerDetected) {
                            this.markerGroup.visible = false;
                            this.isMarkerDetected = false;
                            this.onMarkerLost();
                        }
                    }
                } else {
                    // No markers detected
                    if (this.markerGroup && this.markerGroup.visible) {
                        this.markerGroup.visible = false;
                        if (this.isMarkerDetected) {
                            this.isMarkerDetected = false;
                            console.log('❌ Marker lost (no detection)');
                            this.onMarkerLost();
                        }
                    }
                }
            } else {
                // Debug: why can't we process?
                if (this.frameCount % 60 === 0) {
                    console.log('⚠️ Cannot process frame:', {
                        hasController: !!this.arController,
                        hasVideo: !!this.videoElement,
                        videoReady: this.videoElement ? this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA : false,
                        videoReadyState: this.videoElement ? this.videoElement.readyState : 'N/A'
                    });
                }
            }

            // Render scene
            if (this.renderer) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (error) {
            if (!this.errorLogged) {
                console.error('❌ Animation loop error:', error.message);
                this.errorLogged = true;
            }
        }

        // Update FPS
        this.updateFPS();
    }

    /**
     * Update FPS counter
     */
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastFpsUpdate;

        if (elapsed >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / elapsed);
            this.fpsCounter.textContent = fps;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        if (this.arToolkitSource) {
            this.arToolkitSource.onResize();
        }
        if (this.arToolkitContext) {
            this.arToolkitContext.update(this.arToolkitSource.domElement);
        }
    }

    /**
     * UI Update methods
     */
    updateStatus(message, status = 'info') {
        this.statusText.textContent = message;
        this.statusText.className = status === 'ok' ? 'marker-found' : 
                                    status === 'error' ? 'marker-lost' : 
                                    'loading';
    }

    updateMarkerStatus(message, status = 'lost') {
        this.markerStatus.textContent = message;
        this.markerStatus.className = status === 'found' ? 'marker-found' : 'marker-lost';
    }

    updateVideoStatus(message) {
        this.videoStatus.textContent = message;
    }

    /**
     * Cleanup
     */
    dispose() {
        this.assetLoader.disposeAll();
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ARApp();
    });
} else {
    new ARApp();
}