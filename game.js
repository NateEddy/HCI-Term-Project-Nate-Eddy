let gazeX = null, gazeY = null;
let score = 0;
let timeLeft = 30;
let gameRunning = true;

let scene, camera, renderer;
let playerBall;
let scoreText, timerText, gameOverText;

window.onload = async () => {
    await webgazer.setGazeListener((data) => {
        if (!data) return;
        gazeX = data.x;
        gazeY = data.y;
    }).begin();

    webgazer.showVideoPreview(false).showPredictionPoints(false);

    initGame();
    startTimer();
};

function initGame() {
    scene = new THREE.Scene();

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

    respawnBall();

    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(2, 3, 4);
    scene.add(light);

    createHUD();

    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "r") resetGame();
    });

    animate();
}

function createHUD() {
    scoreText = document.createElement("div");
    timerText = document.createElement("div");
    gameOverText = document.createElement("div");

    Object.assign(scoreText.style, baseHUDStyle());
    Object.assign(timerText.style, baseHUDStyle());
    Object.assign(gameOverText.style, {
        color: "red",
        fontSize: "40px",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "none",
        fontFamily: "Arial",
    });

    scoreText.style.top = "10px";
    scoreText.style.left = "10px";

    timerText.style.top = "10px";
    timerText.style.right = "10px";

    gameOverText.innerText = "GAME OVER\nPress R to Restart";

    document.body.appendChild(scoreText);
    document.body.appendChild(timerText);
    document.body.appendChild(gameOverText);

    updateHUD();
}

function baseHUDStyle() {
    return {
        color: "white",
        fontSize: "24px",
        position: "absolute",
        fontFamily: "Arial",
        zIndex: 1000,
    };
}

function updateHUD() {
    scoreText.innerText = `Score: ${score}`;
    timerText.innerText = `Time: ${timeLeft}`;
}

function startTimer() {
    const interval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(interval);
            return;
        }

        timeLeft--;
        updateHUD();

        if (timeLeft <= 0) {
            gameOver();
            clearInterval(interval);
        }
    }, 1000);
}

function resetGame() {
    score = 0;
    timeLeft = 30;
    gameRunning = true;

    gameOverText.style.display = "none";
    updateHUD();
    respawnBall();
    startTimer();
}

function gameOver() {
    gameRunning = false;
    gameOverText.style.display = "block";
}

function respawnBall() {
    playerBall.position.x = (Math.random() * 6) - 3;
    playerBall.position.y = (Math.random() * 4) - 2;
}

function animate() {
    requestAnimationFrame(animate);

    if (!gameRunning) {
        renderer.render(scene, camera);
        return;
    }

    if (gazeX !== null) {
        const xNorm = (gazeX / window.innerWidth) * 2 - 1;
        const yNorm = -(gazeY / window.innerHeight) * 2 + 1;

        const gazePos = new THREE.Vector3(xNorm * 3, yNorm * 2, 0);
        const dist = gazePos.distanceTo(playerBall.position);

        if (dist < 0.3) {
            score++;
            updateHUD();
            respawnBall();
        }
    }

    renderer.render(scene, camera);
}
