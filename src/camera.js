export async function initCamera(videoElement) {
    const constraints = {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
        }
    };
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
        
        return new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve(stream);
            };
        });
    } catch (error) {
        console.error('Ошибка доступа к камере:', error);
        throw error;
    }
}