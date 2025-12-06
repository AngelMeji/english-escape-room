document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------
    // --------- GAME DATA (ROOMS) -------
    // -----------------------------------
    // Este arreglo contiene TODAS las habitaciones (rooms) del juego.
    // Cada room tiene:
    //  type: tipo de reto (translate, jumble, riddle, multiple, findword)
    //  question: pregunta que se mostrará
    //  answer: respuesta correcta
    //  hint: pista opcional
    //  *Algunos tipos traen datos extra como: options[], paragraph, etc.
    const rooms = [
        // ---------- ROOM 1 ----------
        {
            type: "translate", // Tipo: traducir palabra
            question: "Translate the bloody message on the wall: 'Sombra'",
            answer: "shadow",
            hint: "It follows you but you can never catch it.",
        },

        // ---------- ROOM 2 ----------
        {
            type: "jumble", // Tipo: ordenar letras
            question: "Unscramble the letters to reveal the haunting sound: T E L S K O N E",
            answer: "skeleton",
            hint: "It's a framework of bones.",
        },

        // ---------- ROOM 3 ----------
        {
            type: "riddle", // Tipo: acertijo
            question: "I have no voice, but I can tell you stories. I have a spine, but no bones. What am I?",
            answer: "book",
            hint: "Often found in a library, like this one...",
        },

        // ---------- ROOM 4 ----------
        {
            type: "multiple", // Tipo: selección múltiple
            question: "Which word describes a place where the dead are buried?",
            options: ["Basement", "Attic", "Cemetery", "Dungeon"], // Opciones
            answer: "cemetery",
            hint: "It's also known as a graveyard.",
        },

        // ---------- ROOM 5 ----------
        {
            type: "findword", // Tipo: encontrar palabra oculta
            question: "Find the hidden six-letter word in this creepy note:",
            paragraph: "The candle flickered, casting long, dancing figures on the wall. The air was frigid, and a sense of dread crept into my heart. I could almost hear a faint, spectral whisper right behind me.",
            answer: "spirit",
            hint: "It's another word for a ghost or phantom.",
        }
    ];

    // -----------------------------------
    // ----------- DOM ELEMENTS ----------
    // -----------------------------------
    // Se obtienen todos los elementos HTML que se van a manipular.
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');

    const fogLayer = document.querySelector('.fog-layer');
    const flickerOverlay = document.querySelector('.flicker-overlay');

    // Inputs y botones
    const startButton = document.getElementById('start-button');
    const playerNameInput = document.getElementById('player-name-input');
    const nameError = document.getElementById('name-error');

    // Elementos del juego
    const playerNameDisplay = document.getElementById('player-name-display');
    const finalPlayerName = document.getElementById('final-player-name');
    const roomIndicator = document.getElementById('room-indicator');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const questionEl = document.getElementById('challenge-question');
    const paragraphEl = document.getElementById('challenge-paragraph');
    const multipleChoiceEl = document.getElementById('multiple-choice-options');
    const answerInput = document.getElementById('answer-input');
    const checkAnswerBtn = document.getElementById('check-answer-btn');
    const hintBtn = document.getElementById('hint-btn');
    const feedbackMessage = document.getElementById('feedback-message');
    const door = document.getElementById('door');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalTimeDisplay = document.getElementById('final-time');
    const highScoreDisplay = document.getElementById('high-score');
    const learnedWordsList = document.getElementById('learned-words-list');
    const restartBtn = document.getElementById('restart-btn');

    // Audios
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');
    const doorOpenSound = document.getElementById('door-open-sound');
    const victorySound = document.getElementById('victory-sound');
    const backgroundMusic = document.getElementById('background-music');

    // -----------------------------------
    // ----------- GAME STATE ------------
    // -----------------------------------
    // Variables que almacenan el estado actual del juego.
    let playerName = '';
    let currentRoomIndex = 0; // En qué número de room vamos
    let score = 0;            // Puntaje del jugador
    let learnedWords = [];    // Palabras aprendidas
    let hintUsed = false;     // Si usó pista en la room actual
    let timerInterval;        // Intervalo del temporizador
    let secondsElapsed = 0;   // Tiempo total

    // -----------------------------------
    // -------------- FUNCTIONS -----------
    // -----------------------------------

    // Reproduce un sonido (si existe)
    function playSound(sound) {
        if(sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.error("Audio playback failed:", e));
        }
    }

    // Inicia el juego
    function startGame() {
        // Cargar nombre del jugador desde localStorage
        playerName = localStorage.getItem('escapeRoomPlayerName') || 'Prisoner';

        // Mostrar nombre en pantalla
        playerNameDisplay.textContent = playerName;
        finalPlayerName.textContent = playerName;

        // Reiniciar valores
        currentRoomIndex = 0;
        score = 0;
        secondsElapsed = 0;
        learnedWords = [];

        updateScore();
        startTimer();
        loadRoom(currentRoomIndex);

        // Iniciar música cuando el usuario haga click
        document.body.addEventListener('click', () => {
            if (backgroundMusic && backgroundMusic.paused) {
                backgroundMusic.volume = 0.1;
                backgroundMusic.play().catch(e => console.error("Music could not be played:", e));
            }
        }, { once: true });
    }

    // Carga la room según el índice
    function loadRoom(index) {
        // Si ya no hay más rooms → termina el juego
        if (index >= rooms.length) {
            finishGame();
            return;
        }

        const room = rooms[index]; // Datos de la room actual

        // Mostrar pregunta y progreso
        questionEl.textContent = room.question;
        roomIndicator.textContent = `Room ${index + 1}/${rooms.length}`;

        // Reset UI
        answerInput.value = '';
        answerInput.focus();
        feedbackMessage.textContent = '';
        door.classList.remove('open');
        hintBtn.disabled = false;
        hintUsed = false;

        // Reset de elementos UI
        answerInput.classList.remove('hidden');
        paragraphEl.classList.add('hidden');
        multipleChoiceEl.classList.add('hidden');
        multipleChoiceEl.innerHTML = '';
        checkAnswerBtn.classList.remove('hidden');

        // --- CONFIGURAR CUANDO ES “findword” ---
        if (room.type === 'findword') {
            paragraphEl.textContent = room.paragraph;
            paragraphEl.classList.remove('hidden');
        }

        // --- CONFIGURAR CUANDO ES “multiple choice” ---
        else if (room.type === 'multiple') {
            answerInput.classList.add('hidden');
            checkAnswerBtn.classList.add('hidden');
            multipleChoiceEl.classList.remove('hidden');

            // Generar los botones de opciones
            room.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.classList.add('choice-btn');
                button.onclick = () => checkMultipleChoice(option);
                multipleChoiceEl.appendChild(button);
            });
        }
    }

    // Verifica respuesta en tipos normales (translate, riddle, jumble, findword)
    function checkAnswer() {
        const userAnswer = answerInput.value.trim().toLowerCase();
        if (!userAnswer) return;

        const correctAnswer = rooms[currentRoomIndex].answer.toLowerCase();

        if (userAnswer === correctAnswer) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    }

    // Verifica respuesta de multiple choice
    function checkMultipleChoice(selectedOption) {
        const correctAnswer = rooms[currentRoomIndex].answer.toLowerCase();
        if (selectedOption.toLowerCase() === correctAnswer) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    }

    // Cuando la respuesta es correcta
    function handleCorrectAnswer() {
        playSound(correctSound);

        // Si usó hint → menos puntos
        score += hintUsed ? 50 : 100;
        updateScore();

        // Guardar palabra aprendida
        const roomData = rooms[currentRoomIndex];
        const word = roomData.answer.charAt(0).toUpperCase() + roomData.answer.slice(1);
        learnedWords.push(word);

        // Feedback visual
        feedbackMessage.textContent = 'CORRECT!';
        feedbackMessage.className = 'feedback-correct';

        // Bloquear inputs
        answerInput.disabled = true;
        checkAnswerBtn.disabled = true;
        hintBtn.disabled = true;
        document.querySelectorAll('.choice-btn').forEach(btn => btn.disabled = true);

        // Abrir puerta
        setTimeout(() => {
            playSound(doorOpenSound);
            door.classList.add('open');
        }, 500);

        // Pasar a la siguiente room
        setTimeout(nextRoom, 2500);
    }

    // Cuando la respuesta es incorrecta
    function handleIncorrectAnswer() {
        playSound(incorrectSound);

        // Restar puntos pero sin bajar de 0
        score = Math.max(0, score - 25);
        updateScore();

        feedbackMessage.textContent = 'WRONG!';
        feedbackMessage.className = 'feedback-incorrect';

        // Efecto de error
        document.getElementById('challenge-container').classList.add('input-error');
        setTimeout(() => document.getElementById('challenge-container').classList.remove('input-error'), 500);
    }

    // Avanzar a la siguiente habitación
    function nextRoom() {
        currentRoomIndex++;
        answerInput.disabled = false;
        checkAnswerBtn.disabled = false;
        loadRoom(currentRoomIndex);
    }

    // Mostrar pista
    function showHint() {
        if (!hintUsed) {
            score = Math.max(0, score - 50);
            updateScore();
            hintUsed = true;
        }

        feedbackMessage.textContent = `Hint: ${rooms[currentRoomIndex].hint}`;
        hintBtn.disabled = true;
    }

    // Actualiza el score en pantalla
    function updateScore() {
        scoreDisplay.textContent = `Score: ${score}`;
    }

    // Iniciar temporizador
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsElapsed++;

            const minutes = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
            const seconds = (secondsElapsed % 60).toString().padStart(2, '0');

            timerDisplay.textContent = `Time: ${minutes}:${seconds}`;
        }, 1000);
    }

    // Terminar juego
    function finishGame() {
        clearInterval(timerInterval);
        playSound(victorySound);
        if(backgroundMusic) backgroundMusic.pause();

        // Mostrar pantalla final
        gameScreen.classList.add('hidden');
        endScreen.classList.remove('hidden');

        finalScoreDisplay.textContent = `Your Final Score: ${score}`;
        finalTimeDisplay.textContent = `Time Taken: ${timerDisplay.textContent.replace('Time: ', '')}`;

        // High score
        const highScoreVal = localStorage.getItem('escapeRoomHighScore');
        const highScoreName = localStorage.getItem('escapeRoomHighScoreName') || 'The Warden';

        if (!highScoreVal || score > parseInt(highScoreVal)) {
            localStorage.setItem('escapeRoomHighScore', score);
            localStorage.setItem('escapeRoomHighScoreName', playerName);
            highScoreDisplay.textContent = `New High Score!`;
        } else {
            highScoreDisplay.textContent = `Best Score: ${highScoreVal} by ${highScoreName}`;
        }

        // Mostrar palabras aprendidas
        learnedWordsList.innerHTML = '';
        learnedWords.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            learnedWordsList.appendChild(li);
        });
    }

    // -----------------------------------
    // ------------ EVENTOS ---------------
    // -----------------------------------

    // Botón de iniciar juego
    startButton.addEventListener('click', () => {
        const name = playerNameInput.value.trim();

        if (name) {
            localStorage.setItem('escapeRoomPlayerName', name);

            startScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            fogLayer.classList.add('hidden');
            flickerOverlay.classList.remove('hidden');

            startGame();

        } else {
            nameError.textContent = 'A name is required to mark your tombstone.';
            playerNameInput.classList.add('input-error');
        }
    });

    // Validación de nombre
    playerNameInput.addEventListener('input', () => {
        if (playerNameInput.value.trim()) {
            nameError.textContent = '';
            playerNameInput.classList.remove('input-error');
        }
    });

    // Enter para iniciar
    playerNameInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            startButton.click();
        }
    });

    // Responder
    checkAnswerBtn.addEventListener('click', checkAnswer);

    answerInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkAnswer();
        }
    });

    // Pista
    hintBtn.addEventListener('click', showHint);

    // Reiniciar juego
    restartBtn.addEventListener('click', () => {
        endScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        flickerOverlay.classList.add('hidden');
        fogLayer.classList.remove('hidden');
        playerNameInput.value = '';
    });

});
