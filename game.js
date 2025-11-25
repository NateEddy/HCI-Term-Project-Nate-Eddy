let gazeX = null, gazeY = null;


window.onload = async () => {
    await webgazer.setGazeListener((data, timestamp) => {
        if (!data) return;

        gazeX = data.x;
        gazeY = data.y;
    })
    .begin();

    webgazer.showVideoPreview(false).showPredictionPoints(false);

    initGame();
};


let scene, camera, renderer;
let playerBall;

function initGame() {
    // Create scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff99 });
    playerBall = new THREE.Mesh(geometry, material);
    scene.add(playerBall);

    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(2, 3, 4);
    scene.add(light);

    animate();
}


function animate() {
    requestAnimationFrame(animate);

    if (gazeX !== null) {
        const xNorm = (gazeX / window.innerWidth) * 2 - 1;
        const yNorm = -(gazeY / window.innerHeight) * 2 + 1;

        playerBall.position.x = xNorm * 3;  
        playerBall.position.y = yNorm * 2;
    }

    renderer.render(scene, camera);
}
