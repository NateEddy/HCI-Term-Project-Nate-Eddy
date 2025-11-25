let gazeX = null, gazeY = null;
let score = 0;
let timeLeft = 30;
let gameRunning = false;

let scene, camera, renderer;
let playerBall;
let scoreText, timerText, gameOverText, gazeText, gazeDot;

window.onload = async () => {
    await webgazer.setGazeListener((data, elapsedTime) => {
        if (data) {
            gazeX = data.x;
            gazeY = data.y;
        }
    }).begin();

    webgazer.showVideoPreview(true).showPredictionPoints(true);
    alert("Allow webcam access and follow the blue dots to calibrate. Click on them after you look at them");
    await startCalibration();
};

async function startCalibration() {
    const points = [
        {x: 10, y: 10}, {x: 50, y: 10}, {x: 90, y: 10},
        {x: 10, y: 50}, {x: 50, y: 50}, {x: 90, y: 50},
        {x: 10, y: 90}, {x: 50, y: 90}, {x: 90, y: 90}
    ];

    for (const p of points) {
        await showCalibrationDot(p.x, p.y);
        await new Promise(res => {
            const end = Date.now() + 2000;
            const interval = setInterval(() => {
                if (gazeX && gazeY) {
                    webgazer.recordScreenPosition(gazeX, gazeY, 'calibration');
                }
                if (Date.now() > end) {
                    clearInterval(interval);
                    res();
                }
            }, 50);
        });
    }

    alert("Game starting.");
    startGame();
    startTimer();
    gameRunning = true;
}

function showCalibrationDot(xPercent, yPercent) {
    return new Promise(resolve => {
        const dot = document.createElement("div");
        dot.style.width = "20px";
        dot.style.height = "20px";
        dot.style.backgroundColor = "blue";
        dot.style.position = "absolute";
        dot.style.borderRadius = "50%";
        dot.style.left = `calc(${xPercent}% - 10px)`;
        dot.style.top = `calc(${yPercent}% - 10px)`;
        dot.style.zIndex = 2000;
        dot.style.cursor = "pointer";
        dot.addEventListener("click", () => {
            document.body.removeChild(dot);
            resolve();
        });
        document.body.appendChild(dot);
    });
}

function startGame() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    createGazeDot();

    window.addEventListener("keydown", (e) => { if (e.key.toLowerCase() === "r") resetGame(); });
    animate();
}

function createHUD() {
    scoreText = document.createElement("div");
    timerText = document.createElement("div");
    gameOverText = document.createElement("div");
    gazeText = document.createElement("div");

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
        textAlign: "center",
        whiteSpace: "pre-line"
    });
    Object.assign(gazeText.style, baseHUDStyle());
    gazeText.style.bottom = "10px";
    gazeText.style.left = "10px";
    timerText.style.top = "10px";
    timerText.style.right = "10px";
    scoreText.style.top = "10px";
    scoreText.style.right = "120px";
    gameOverText.innerText = "GAME OVER\nPress R to Restart";

    document.body.appendChild(scoreText);
    document.body.appendChild(timerText);
    document.body.appendChild(gameOverText);
    document.body.appendChild(gazeText);
    updateHUD();
}

function baseHUDStyle() {
    return { color: "white", fontSize: "24px", position: "absolute", fontFamily: "Arial", zIndex: 1000 };
}

function createGazeDot() {
    gazeDot = document.createElement("div");
    gazeDot.style.width = "15px";
    gazeDot.style.height = "15px";
    gazeDot.style.borderRadius = "50%";
    gazeDot.style.backgroundColor = "red";
    gazeDot.style.position = "absolute";
    gazeDot.style.pointerEvents = "none";
    gazeDot.style.zIndex = 1000;
    document.body.appendChild(gazeDot);
}

function updateHUD() {
    scoreText.innerText = `Score: ${score}`;
    timerText.innerText = `Time: ${timeLeft}`;
}

function startTimer() {
    const interval = setInterval(() => {
        if (!gameRunning) { clearInterval(interval); return; }
        timeLeft--;
        updateHUD();
        if (timeLeft <= 0) { gameOver(); clearInterval(interval); }
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

    if (!gameRunning) { renderer.render(scene, camera); return; }

    if (gazeX !== null && gazeY !== null) {
        gazeText.innerText = `Gaze: (${Math.round(gazeX)}, ${Math.round(gazeY)})`;
        gazeDot.style.left = `${gazeX - 7.5}px`;
        gazeDot.style.top = `${gazeY - 7.5}px`;

        const vector = playerBall.position.clone();
        vector.project(camera);
        const screenX = (vector.x + 1) / 2 * window.innerWidth;
        const screenY = (-vector.y + 1) / 2 * window.innerHeight;
        const dx = gazeX - screenX;
        const dy = gazeY - screenY;
        const dist = Math.hypot(dx, dy);

        if (dist < 80) {
            score++;
            updateHUD();
            respawnBall();
        }
    } else {
        gazeText.innerText = "Gaze: (not detected)";
    }

    renderer.render(scene, camera);
}
