// Multi-marker detector using red pixel clustering
// Returns up to 4 marker positions detected in the video stream
export async function initARDetector(videoElement) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    function updateCanvasSize() {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
    }
    
    videoElement.addEventListener('loadedmetadata', updateCanvasSize);
    
    // Helper: Find red pixel regions and cluster them
    function findRedMarkers(imageData, maxMarkers = 4) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Create red pixel map
        const redMap = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (r > 200 && g < 100 && b < 100) {
                redMap[i / 4] = 1;
            }
        }
        
        // Cluster adjacent red pixels using connected components
        const visited = new Uint8ClampedArray(width * height);
        const clusters = [];
        
        for (let idx = 0; idx < width * height; idx++) {
            if (redMap[idx] && !visited[idx]) {
                const cluster = floodFill(idx, width, height, redMap, visited);
                if (cluster.pixels.length > 20) { // Min cluster size
                    clusters.push(cluster);
                }
            }
        }
        
        // Sort by size and return top maxMarkers
        clusters.sort((a, b) => b.pixels.length - a.pixels.length);
        return clusters.slice(0, maxMarkers).map(cluster => ({
            x: cluster.centerX,
            y: cluster.centerY,
            size: cluster.pixels.length,
            pixelCount: cluster.pixels.length,
            rvec: [0, 0, 0],
            tvec: [0, 0, 1]
        }));
    }
    
    // Helper: Flood fill to find connected red pixel regions
    function floodFill(startIdx, width, height, redMap, visited) {
        const queue = [startIdx];
        const pixels = [];
        let sumX = 0, sumY = 0;
        
        while (queue.length > 0) {
            const idx = queue.shift();
            if (visited[idx]) continue;
            
            visited[idx] = 1;
            pixels.push(idx);
            
            const y = Math.floor(idx / width);
            const x = idx % width;
            sumX += x;
            sumY += y;
            
            // Check 4-connected neighbors
            const neighbors = [
                idx - 1,           // left
                idx + 1,           // right
                idx - width,       // top
                idx + width        // bottom
            ];
            
            for (const nIdx of neighbors) {
                if (nIdx >= 0 && nIdx < width * height && redMap[nIdx] && !visited[nIdx]) {
                    queue.push(nIdx);
                }
            }
        }
        
        return {
            pixels,
            centerX: sumX / pixels.length,
            centerY: sumY / pixels.length
        };
    }
    
    return {
        // Detect returns array of markers or empty array
        detect: () => {
            if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
                return [];
            }
            
            updateCanvasSize();
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            return findRedMarkers(imageData, 4);
        }
    };
}