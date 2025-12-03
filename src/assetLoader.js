/**
 * Asset loader for video textures and Three.js objects
 * Handles async loading of video content and error handling
 */

// Use global THREE (loaded as script tag in index.html)
const THREE = window.THREE;

export class AssetLoader {
    constructor(config = {}) {
        this.config = config;
        this.loadedAssets = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * Load a video and create a Three.js texture
     * @param {string} url - Video URL or path
     * @param {string} name - Asset identifier
     * @param {object} videoConfig - { muted, loop, autoplay, volume }
     * @returns {Promise<{videoElement, texture}>}
     */
    async loadVideoTexture(url, name, videoConfig = {}) {
        // Return cached asset if already loaded
        if (this.loadedAssets.has(name)) {
            return this.loadedAssets.get(name);
        }

        // Return pending promise if already loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        const loadPromise = this._loadVideoTextureInternal(url, name, videoConfig);
        this.loadingPromises.set(name, loadPromise);

        try {
            const result = await loadPromise;
            this.loadedAssets.set(name, result);
            return result;
        } finally {
            this.loadingPromises.delete(name);
        }
    }

    /**
     * Internal video texture loading with error handling
     */
    async _loadVideoTextureInternal(url, name, videoConfig) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            
            // Apply video configuration
            video.muted = videoConfig.muted ?? true;
            video.loop = videoConfig.loop ?? true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            
            // Create texture
            const texture = new THREE.VideoTexture(video);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;

            // Event handlers
            const onCanPlay = () => {
                cleanup();
                if (videoConfig.autoplay) {
                    video.play().catch(err => console.warn('Video autoplay failed:', err));
                }
                resolve({ videoElement: video, texture });
            };

            const onError = (error) => {
                cleanup();
                reject(new Error(`Failed to load video "${name}" from ${url}: ${error.message || 'Unknown error'}`));
            };

            const cleanup = () => {
                video.removeEventListener('canplay', onCanPlay);
                video.removeEventListener('error', onError);
            };

            video.addEventListener('canplay', onCanPlay, { once: true });
            video.addEventListener('error', onError, { once: true });

            // Start loading
            video.src = url;
            video.load();

            // Timeout after 30s
            setTimeout(() => {
                if (!this.loadedAssets.has(name) && !video.played) {
                    cleanup();
                    reject(new Error(`Video loading timeout for "${name}"`));
                }
            }, 30000);
        });
    }

    /**
     * Create a video plane mesh with loaded texture
     * @param {VideoTexture} texture - Three.js video texture
     * @param {object} meshConfig - { geometry, position, rotation, scale }
     * @returns {THREE.Mesh}
     */
    createVideoMesh(texture, meshConfig = {}) {
        const defaultConfig = {
            geometry: { width: 1.6, height: 0.9, widthSegments: 1, heightSegments: 1 },
            position: { x: 0, y: 0.45, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
        };

        const config = { ...defaultConfig, ...meshConfig };
        const { geometry, position, rotation, scale } = config;

        const planeGeo = new THREE.PlaneGeometry(
            geometry.width,
            geometry.height,
            geometry.widthSegments,
            geometry.heightSegments
        );

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(planeGeo, material);

        mesh.position.set(position.x, position.y, position.z);
        mesh.rotation.order = 'XYZ';
        mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        mesh.scale.set(scale.x, scale.y, scale.z);

        const videoElement = texture.source?.data || texture.image;
        if (videoElement) {
            mesh.userData.videoElement = videoElement;
        }

        return mesh;
    }

    // play video on a mesh
    playVideo(mesh) {
        const video = mesh.userData.videoElement;
        if (video && video.paused) {
            video.play().catch(err => console.warn('Play failed:', err));
        }
    }

    // pause video on a mesh
    pauseVideo(mesh) {
        const video = mesh.userData.videoElement;
        if (video && !video.paused) {
            video.pause();
        }
    }

    // stop and reset video (returns to start)
    stopVideo(mesh) {
        const video = mesh.userData.videoElement;
        if (video) {
            video.pause();
            video.currentTime = 0;
        }
    }

    //video volume (0.0 to 1.0)
    setVolume(mesh, volume) {
        const video = mesh.userData.videoElement;
        if (video) {
            video.volume = Math.max(0, Math.min(1, volume));
        }
    }

    // clean up and release resources
    dispose(name) {
        const asset = this.loadedAssets.get(name);
        if (asset) {
            if (asset.videoElement) {
                asset.videoElement.pause();
                asset.videoElement.src = '';
            }
            if (asset.texture) {
                asset.texture.dispose();
            }
            this.loadedAssets.delete(name);
        }
    }

    // clean up all assets
    disposeAll() {
        for (const name of this.loadedAssets.keys()) {
            this.dispose(name);
        }
    }
}

export default AssetLoader;
