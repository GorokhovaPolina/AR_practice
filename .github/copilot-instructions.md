# AR Practice - Copilot Instructions

## Project Overview
A WebAR (web-based augmented reality) application that detects a single marker pattern and renders video content on it using AR.js and Three.js. When the marker is detected in the camera view, a video texture is displayed and plays automatically.

**Architecture**: Two-layer system:
1. **Detection Layer** (`AR.js`) - Detects physical marker patterns (Hiro/Kanji) from camera feed
2. **Rendering Layer** (`Three.js`) - Renders video mesh positioned on detected marker

## Tech Stack
- **AR.js v2.2.2** - Marker detection and pose estimation (ArToolKit wrapper)
- **Three.js v0.160.0** - 3D rendering engine
- **Vite** - Build tool and dev server (port 3000)
- **ESM modules** - Modern JavaScript imports

## Core Architecture

### Marker Detection (AR.js)
- **Default marker**: Hiro pattern (https://cdn.rawgit.com/jeromeetienne/AR.js/master/data/data/patt.hiro)
- **Supports**: Hiro, Kanji, or custom QR code patterns
- **Detection flow**: Camera feed → ArToolKit analysis → Pose transformation → THREE.Group positioning

### Video Rendering (Three.js)
1. **AssetLoader** (`assetLoader.js`) - Async video loading with error handling
2. **Mesh creation** - PlaneGeometry with VideoTexture (16:9 aspect ratio by default)
3. **Playback control** - Auto-play on marker found, pause on marker lost

### Module Structure
```
src/
├── main.js           # ARApp class - orchestrates AR.js + Three.js
├── assetLoader.js    # AssetLoader class - handles video texture loading
├── constants.js      # Configuration (markers, video URLs, mesh transforms)
├── camera.js         # Legacy - can be removed
├── detector.js       # Legacy - can be removed
└── renderer.js       # Legacy - can be removed
```

## Key Classes and Interfaces

### ARApp (main.js)
Main orchestrator class:
- `initThreeJS()` - Sets up Three.js scene/camera/renderer with lighting
- `initARJS()` - Initializes AR.js marker detection
- `setupMarkerDetection()` - Monitors marker visibility (polls every 50ms)
- `loadVideoAssets()` - Loads video texture into Three.js
- `onMarkerFound()` / `onMarkerLost()` - Control video playback

**Key properties:**
- `this.scene` - Three.js scene
- `this.markerGroup` - THREE.Group controlled by AR.js (positioned at marker)
- `this.videoMesh` - PlaneGeometry with video texture
- `this.arToolkitContext` - AR.js detection engine

### AssetLoader (assetLoader.js)
Handles video texture management:
- `loadVideoTexture(url, name, config)` - Async load video, returns `{ videoElement, texture }`
- `createVideoMesh(texture, meshConfig)` - Creates THREE.Mesh with video texture
- `playVideo(mesh)` / `pauseVideo(mesh)` / `stopVideo(mesh)` - Playback control
- `setVolume(mesh, volume)` - Volume control (0.0-1.0)
- `dispose(name)` - Clean up resources

## Configuration (constants.js)

**MARKER_CONFIG:**
- `type` - 'hiro' or 'kanji' (standard AR.js markers)
- `patternUrl` - URL to marker pattern file
- `cameraParametersUrl` - Camera calibration (default for most mobiles)
- `canvasWidth/Height` - Detection resolution (1280x720 default)

**VIDEO_ASSETS:**
- `primary.url` - Video source (supports local files: `/videos/file.mp4`)
- `primary.loop` - Loop video
- `primary.muted` - Required for autoplay in browsers

**MESH_CONFIG:**
- `geometry.width/height` - Plane dimensions (1.6 x 0.9 = 16:9 ratio)
- `position` - Offset from marker center (0, 0.45, 0 = above marker)
- `rotation/scale` - Transform relative to marker

## Common Tasks

### Change Video Source
Edit `VIDEO_ASSETS.primary.url` in `constants.js`:
```javascript
// Local file (recommended)
url: '/videos/my-video.mp4',

// Remote file (with CORS support)
url: 'https://example.com/video.mp4'
```

### Change Marker Pattern
1. Download custom pattern PDF from AR.js website
2. Update `MARKER_CONFIG.patternUrl` to point to new pattern file
3. Pattern files are `.patt` format (binary)

### Customize Video Mesh Size/Position
Modify `MESH_CONFIG` in `constants.js`:
```javascript
geometry: { width: 2.0, height: 1.125 },  // 16:9 at 2x size
position: { x: 0, y: 0.5, z: 0 }          // Higher offset
```

### Add Multiple Videos
Use `AssetLoader` to load multiple videos, swap textures on demand:
```javascript
// Load second video
const asset2 = await this.assetLoader.loadVideoTexture(url2, 'video2', config2);
// Switch texture
this.videoMesh.material.map = asset2.texture;
```

### Control Video Playback
Use `AssetLoader` methods:
```javascript
this.assetLoader.playVideo(this.videoMesh);
this.assetLoader.pauseVideo(this.videoMesh);
this.assetLoader.setVolume(this.videoMesh, 0.5);  // 50% volume
```

## Build & Dev Workflow

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies (including ar.js) |
| `npm run dev` | Start Vite dev server (opens http://localhost:3000) |
| `npm run build` | Bundle to `dist/` (ESNext target) |
| `npm run preview` | Preview production build locally |

**Critical**: AR.js 2.2.2 loads as global script tag (not ES6 module). Make sure to wait for `THREEx` to be available before initializing.

## Debug UI
Real-time status display in top-left corner:
- **Status** - Initialization progress
- **FPS** - Render performance
- **Marker** - Detection state (green=found, red=not found)
- **Video** - Loading/playing/paused state

## Known Limitations & TODOs
- AR.js detects only one marker type at a time (can use custom QR patterns)
- Camera calibration uses default parameters (may need fine-tuning for specific devices)
- Video loading requires CORS support (YouTube/Instagram won't work)
- No multi-marker support (each app instance tracks one pattern)
- Marker pose is approximate (good for rough positioning)

## Troubleshooting

**Camera not working:**
- Check HTTPS/localhost requirement
- Verify browser camera permissions
- AR.js needs camera feed at 1280x720 minimum

**Marker not detected:**
- Print/display Hiro pattern (physical or on screen)
- Ensure good lighting
- Try marker closer to camera
- Check console for AR.js initialization errors

**Video not playing:**
- Verify video URL is accessible and CORS-enabled
- Check browser console for load errors
- Video must be muted for autoplay to work
- Some formats require specific codec support

## File Structure Reference
```
src/
  main.js       - ARApp class, animation loop, pose calculation
  camera.js     - getUserMedia initialization
  detector.js   - Marker detection (red pixel counting)
  renderer.js   - Three.js video plane creation
test/
  simple-test.js - Incremental subsystem tests
```
