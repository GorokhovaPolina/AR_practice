/**
 * Configuration for AR marker detection and video assets
 */

// AR.js marker configuration
export const MARKER_CONFIG = {
    type: 'hiro', 
    patternUrl: 'https://cdn.rawgit.com/jeromeetienne/AR.js/master/data/data/patt.hiro',
    
    // camera calibration params
    cameraParametersUrl: 'https://cdn.rawgit.com/jeromeetienne/AR.js/master/data/data/camera_para.dat',
    
    // detection settings
    detectionMode: 'mono',
    matrixCodeType: '3x3',
    canvasWidth: 1280,
    canvasHeight: 720
};

// video asset configuration
export const VIDEO_ASSETS = {
    // primary video to display on marker
    primary: {
        name: 'rickroll',
        url: '/videos/rickroll.mp4',
        loop: true,
        muted: true,
        autoplay: false,
        volume: 0.5
    },
    
    // fallback video if primary fails
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
    // plane geometry for video texture
    geometry: {
        width: 1.6,
        height: 0.9,
        widthSegments: 1,
        heightSegments: 1
    },
    
    // position on marker
    position: {
        x: 0,
        y: 0.45, // offset up from marker center
        z: 0
    },
    
    // rotation (facing camera)
    rotation: {
        x: 0,
        y: 0,
        z: 0
    },
    
    // scale
    scale: {
        x: 1,
        y: 1,
        z: 1
    }
};

// lighting configuration
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

// camera configuration
export const CAMERA_CONFIG = {
    fov: 60,
    near: 0.1,
    far: 1000,
    aspectRatio: 'auto'
};

// debug
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
