// ЖОСКАЯ ЗАГЛУШКА!!!
export async function initARDetector(videoElement) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Установим размеры canvas как у видео
    function updateCanvasSize() {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
    }
    
    videoElement.addEventListener('loadedmetadata', updateCanvasSize);
    
    return {
        detect: () => {
            if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
                return { found: false };
            }
            
            updateCanvasSize();
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let redCount = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Проверяем, является ли пиксель красным (r высокий, g и b низкие)
                if (r > 200 && g < 100 && b < 100) {
                    redCount++;
                }
            }
            
            const totalPixels = canvas.width * canvas.height;
            const redRatio = redCount / totalPixels;
            
            // Если красные пиксели занимают более 1% изображения, считаем, что нашли маркер
            if (redRatio > 0.01) {
                return {
                    found: true,
                    rvec: [0, 0, 0],
                    tvec: [0, 0, 1]
                };
            }
            
            return { found: false };
        }
    };
}