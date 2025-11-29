/**
 * Configuration for AR marker detection and video assets
 */

// AR.js marker configuration
export const MARKER_CONFIG = {
    // Use Hiro marker for testing (standard AR.js marker)
    type: 'hiro',  // 'pattern', 'hiro', 'kanji'
    patternUrl: 'https://cdn.rawgit.com/jeromeetienne/AR.js/master/data/data/patt.hiro',
    // patternUrl: '/pattern-marker.patt',  // Custom pattern file (uncomment when custom marker works)
    
    // Camera calibration parameters (default for most mobile devices)
    cameraParametersUrl: 'https://cdn.rawgit.com/jeromeetienne/AR.js/master/data/data/camera_para.dat',
    
    // Detection settings
    detectionMode: 'mono',  // 'mono' or 'mono_and_matrix'
    matrixCodeType: '3x3',  // For matrix codes
    canvasWidth: 1280,
    canvasHeight: 720
};

// Video asset configuration
export const VIDEO_ASSETS = {
    // Primary video to display on marker
    primary: {
        name: 'rickroll',
        url: '/videos/rickroll.mp4',  // Local file in public/videos/
        loop: true,
        muted: true,
        autoplay: false,  // Manual control via marker detection
        volume: 0.5
    },
    
    // Fallback video if primary fails
    fallback: {
        name: 'placeholder',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        loop: true,
        muted: true,
        autoplay: false
    }
};

// Three.js mesh configuration for video display
export const MESH_CONFIG = {
    // Plane geometry for video texture
    geometry: {
        width: 1.6,      // 16:9 aspect ratio
        height: 0.9,
        widthSegments: 1,
        heightSegments: 1
    },
    
    // Position on marker
    position: {
        x: 0,
        y: 0.45,         // Offset up from marker center
        z: 0
    },
    
    // Rotation (facing camera)
    rotation: {
        x: 0,
        y: 0,
        z: 0
    },
    
    // Scale
    scale: {
        x: 1,
        y: 1,
        z: 1
    }
};

// Lighting configuration
export const LIGHTING_CONFIG = {
    ambient: {
        color: 0xffffff,
        intensity: 0.8
    },
    directional: {
        color: 0xffffff,
        intensity: 0.5,
        position: { x: 5, y: 5, z: 5 }
    }
};

// Camera configuration
export const CAMERA_CONFIG = {
    fov: 60,
    near: 0.1,
    far: 1000,
    aspectRatio: 'auto'  // Will be set to window dimensions
};

// Debug settings
export const DEBUG_CONFIG = {
    showMarkerBounds: false,
    showCameraFrustum: false,
    logDetectionFrames: false,
    updateFrequency: 30  // ms between debug updates
};

export default {
    MARKER_CONFIG,
    VIDEO_ASSETS,
    MESH_CONFIG,
    LIGHTING_CONFIG,
    CAMERA_CONFIG,
    DEBUG_CONFIG
};
