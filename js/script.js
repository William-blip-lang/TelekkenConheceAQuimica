
// =====================
// QUIZ INTERATIVO
// =====================

const questions = document.querySelectorAll(".question-card");
const optionButtons = document.querySelectorAll(".option-btn");
const progressFill = document.getElementById("progress-fill");
const currentQuestionSpan = document.getElementById("current-question");
const totalQuestionsSpan = document.getElementById("total-questions");

let currentQuestionIndex = 0;
const totalQuestions = questions.length - 1;

totalQuestionsSpan.textContent = totalQuestions;

optionButtons.forEach(button => {
    button.addEventListener("click", () => {
        const parentCard = button.closest(".question-card");
        const isCorrect = button.dataset.answer === "correct";

        parentCard.querySelectorAll(".option-btn").forEach(btn => btn.disabled = true);

        if (isCorrect) {
            button.classList.add("correct");
            parentCard.querySelector(".correct-feedback").classList.add("show");
        } else {
            button.classList.add("wrong");
            parentCard.querySelector(".wrong-feedback").classList.add("show");
        }
    });
});

function nextQuestion() {
    questions[currentQuestionIndex].classList.remove("active");
    currentQuestionIndex++;

    if (currentQuestionIndex < totalQuestions) {
        questions[currentQuestionIndex].classList.add("active");
        currentQuestionSpan.textContent = currentQuestionIndex + 1;
        updateProgress();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    questions[currentQuestionIndex].classList.remove("active");
    const finalResult = document.getElementById("final-result");
    finalResult.classList.add("active");
    progressFill.style.width = "100%";
    currentQuestionSpan.textContent = totalQuestions;
}

function restartQuiz() {
    questions.forEach(q => q.classList.remove("active"));
    optionButtons.forEach(btn => {
        btn.classList.remove("correct", "wrong");
        btn.disabled = false;
    });
    document.querySelectorAll(".feedback").forEach(f => f.classList.remove("show"));

    currentQuestionIndex = 0;
    questions[0].classList.add("active");
    currentQuestionSpan.textContent = 1;
    updateProgress();
}

function updateProgress() {
    const progress = ((currentQuestionIndex) / totalQuestions) * 100;
    progressFill.style.width = progress + "%";
}

// =====================
// MODELO 3D (Three.js)
// =====================

let scene, camera, renderer;
let atomGroup, bondsGroup;
let autoRotate = true;

init3DModel();
animate();

function init3DModel() {
    const container = document.getElementById("model-container");

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    atomGroup = new THREE.Group();
    bondsGroup = new THREE.Group();
    scene.add(atomGroup);
    scene.add(bondsGroup);

    createWS2Model(3);

    document.getElementById("layers").addEventListener("input", (e) => {
        const value = parseInt(e.target.value);
        document.getElementById("layers-value").textContent = value;
        resetAtoms();
        createWS2Model(value);
    });

    document.getElementById("autoRotate").addEventListener("change", (e) => {
        autoRotate = e.target.checked;
    });

    document.getElementById("showBonds").addEventListener("change", (e) => {
        bondsGroup.visible = e.target.checked;
    });

    document.getElementById("opacity").addEventListener("input", (e) => {
        atomGroup.traverse(child => {
            if (child.isMesh) {
                child.material.opacity = parseFloat(e.target.value);
                child.material.transparent = child.material.opacity < 1;
            }
        });
    });

    window.addEventListener("resize", onWindowResize);

    const loading = container.querySelector(".loading");
    if (loading) loading.style.display = "none";
}

function createWS2Model(layers) {
    const tungstenMaterial = new THREE.MeshPhongMaterial({ color: "#4a90e2" });
    const sulfurMaterial = new THREE.MeshPhongMaterial({ color: "#f1c40f" });

    const tungstenGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sulfurGeometry = new THREE.SphereGeometry(0.3, 32, 32);

    for (let i = 0; i < layers; i++) {
        const offset = i * 2;

        const tungsten = new THREE.Mesh(tungstenGeometry, tungstenMaterial.clone());
        tungsten.position.set(0, 0, offset);
        atomGroup.add(tungsten);

        const sulfur1 = new THREE.Mesh(sulfurGeometry, sulfurMaterial.clone());
        sulfur1.position.set(1.2, 0, offset);
        atomGroup.add(sulfur1);

        const sulfur2 = new THREE.Mesh(sulfurGeometry, sulfurMaterial.clone());
        sulfur2.position.set(-1.2, 0, offset);
        atomGroup.add(sulfur2);

        createBond(tungsten.position, sulfur1.position);
        createBond(tungsten.position, sulfur2.position);
    }

    updateAtomCount();
}

function createBond(start, end) {
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const distance = start.distanceTo(end);
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 16);

    const bond = new THREE.Mesh(geometry, material);

    bond.position.copy(start).add(end).divideScalar(2);
    bond.lookAt(end);
    bond.rotateX(Math.PI / 2);

    bondsGroup.add(bond);
}

function updateAtomCount() {
    const tungstenAtoms = atomGroup.children.filter(c => c.material.color.getHexString() === "4a90e2").length;
    const sulfurAtoms = atomGroup.children.length - tungstenAtoms;
    document.getElementById("atom-count").textContent = `Átomos: ${atomGroup.children.length} (${tungstenAtoms}W + ${sulfurAtoms}S)`;
}

function resetAtoms() {
    while (atomGroup.children.length) atomGroup.remove(atomGroup.children[0]);
    while (bondsGroup.children.length) bondsGroup.remove(bondsGroup.children[0]);
}

function resetView() {
    camera.position.set(0, 0, 15);
}

function toggleAnimation() {
    autoRotate = !autoRotate;
    document.getElementById("autoRotate").checked = autoRotate;
}

function onWindowResize() {
    const container = document.getElementById("model-container");
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (autoRotate) {
        atomGroup.rotation.y += 0.01;
        bondsGroup.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}
