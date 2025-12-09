document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------
  // --------- GAME DATA (ROOMS) -------
  // -----------------------------------
  // Este arreglo contiene TODAS las habitaciones (rooms) del juego.
  const rooms = [
    // ---------- ROOM 1 ----------
    {
      type: "translate", 
      question: "Translate the bloody message on the wall: 'Sombra'",
      answer: "shadow",
      hint: "It follows you but you can never catch it.",
    },

    // ---------- ROOM 2 ----------
    {
      type: "jumble", 
      question:
        "Unscramble the letters to reveal the haunting sound: T E L S K O N E",
      answer: "skeleton",
      hint: "It's a framework of bones.",
    },

    // ---------- ROOM 3 (Ghost Theme) ----------
    {
      type: "riddle", 
      question:
        "I have no voice, but I can tell you stories. I have a spine, but no bones. What am I?",
      answer: "book",
      hint: "Often found in a library, like this one...",
    },

    // ---------- ROOM 4 (Monster Theme) ----------
    {
      type: "multiple", 
      question: "Which word describes a place where the dead are buried?",
      options: ["Basement", "Attic", "Cemetery", "Dungeon"], 
      answer: "cemetery",
      hint: "It's also known as a graveyard.",
    },
    // ---------- ROOM 5 ----------
    {
      type: "findword",
      question:
        "A six-letter modal verb hides in this unsettling message. Can you find it?",
      paragraph:
        "A cold whisper brushed my ear, hinting that I should choose wisely.",
      answer: "should",
      hint: "It's a modal verb used to give advice.",
    },

    // ---------- ROOM 6 ----------
    {
      type: "riddle",
      question:
        "I am the modal of strict rules and absolute necessity. I leave no choice and allow no refusal. What word am I?",
      answer: "Must",
      hint: "Completes this sentence: 'You ___ stop at a red light.'",
    },

    // ---------- ROOM 7 ----------
    {
      type: "translate", 
      question: "Complete the passive voice sentence:",
      paragraph:
        "The experiment ___ (conduct) in the abandoned laboratory last night.",
      answer: "was conducted",
      hint: "Past passive: was + past participle.",
    },

    // ---------- ROOM 8 ----------
    {
      type: "jumble", 
      question: "Put the words in the correct passive voice order:",
      paragraph:
        "the / was / discovered / formula / old",
      answer: "the old formula was discovered",
      hint: "Start with 'the old formula' + passive structure.",
    },
  ];

  // -----------------------------------
  // ----------- DOM ELEMENTS ----------
  // -----------------------------------
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const endScreen = document.getElementById("end-screen");

  const fogLayer = document.querySelector(".fog-layer");
  const flickerOverlay = document.querySelector(".flicker-overlay");

  const startButton = document.getElementById("start-button");
  const playerNameInput = document.getElementById("player-name-input");
  const nameError = document.getElementById("name-error");

  const playerNameDisplay = document.getElementById("player-name-display");
  const finalPlayerName = document.getElementById("final-player-name");
  const roomIndicator = document.getElementById("room-indicator");
  const scoreDisplay = document.getElementById("score");
  const timerDisplay = document.getElementById("timer");
  const questionEl = document.getElementById("challenge-question");
  const paragraphEl = document.getElementById("challenge-paragraph");
  const multipleChoiceEl = document.getElementById("multiple-choice-options");
  const answerInput = document.getElementById("answer-input");
  const checkAnswerBtn = document.getElementById("check-answer-btn");
  const hintBtn = document.getElementById("hint-btn");
  const feedbackMessage = document.getElementById("feedback-message");
  const door = document.getElementById("door");
  const finalScoreDisplay = document.getElementById("final-score");
  const finalTimeDisplay = document.getElementById("final-time");
  const highScoreDisplay = document.getElementById("high-score");
  const learnedWordsList = document.getElementById("learned-words-list");
  const restartBtn = document.getElementById("restart-btn");

  const correctSound = document.getElementById("correct-sound");
  const incorrectSound = document.getElementById("incorrect-sound");
  const doorOpenSound = document.getElementById("door-open-sound");
  const victorySound = document.getElementById("victory-sound");
  const backgroundMusic = document.getElementById("background-music");

  // -----------------------------------
  // ----------- GAME STATE ------------
  // -----------------------------------
  let playerName = "";
  let currentRoomIndex = 0; 
  let score = 0; 
  let learnedWords = []; 
  let hintUsed = false; 
  let timerInterval; 
  let secondsElapsed = 0; 

  // -----------------------------------
  // -------------- FUNCTIONS -----------
  // -----------------------------------

  function playSound(sound) {
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch((e) => console.error("Audio playback failed:", e));
    }
  }

  function startGame() {
    playerName = localStorage.getItem("escapeRoomPlayerName") || "Prisoner";

    playerNameDisplay.textContent = playerName;
    finalPlayerName.textContent = playerName;

    currentRoomIndex = 0;
    score = 0;
    secondsElapsed = 0;
    learnedWords = [];

    updateScore();
    startTimer();
    loadRoom(currentRoomIndex);

    document.body.addEventListener(
      "click",
      () => {
        if (backgroundMusic && backgroundMusic.paused) {
          backgroundMusic.volume = 0.1;
          backgroundMusic
            .play()
            .catch((e) => console.error("Music could not be played:", e));
        }
      },
      { once: true }
    );
  }

  function loadRoom(index) {
    const body = document.body;

    // --- MANEJO DE TEMAS / ESTÉTICA ---
    // Limpiamos todas las clases de tema primero
    body.classList.remove(
      "theme-special",
      "theme-special2",
      "theme-room3",
      "theme-room4",
      "theme-room7",
      "theme-room8",
    );

    if (index === 2) {
      // Room 3: Estética Fantasma
      body.classList.add("theme-room3");
    } else if (index === 3) {
      // Room 4: Estética Monstruo
      body.classList.add("theme-room4");
    } else if (index === 4) {
      // Room 5 (Original theme-special)
      body.classList.add("theme-special");
    } else if (index === 5) {
      // Room 6 (Original theme-special2)
      body.classList.add("theme-special2");
    } else if (index === 6) {
      // Room 4: Estética Monstruo
      body.classList.add("theme-room7");
    } else if (index === 7) {
      // Room 4: Estética Monstruo
      body.classList.add("theme-room8");
    }

    if (index >= rooms.length) {
      finishGame();
      return;
    }

    const room = rooms[index]; 

    questionEl.textContent = room.question;
    roomIndicator.textContent = `Room ${index + 1}/${rooms.length}`;

    answerInput.value = "";
    answerInput.focus();
    feedbackMessage.textContent = "";
    door.classList.remove("open");
    hintBtn.disabled = false;
    hintUsed = false;

    answerInput.classList.remove("hidden");
    paragraphEl.classList.add("hidden");
    multipleChoiceEl.classList.add("hidden");
    multipleChoiceEl.innerHTML = "";
    checkAnswerBtn.classList.remove("hidden");

    // Mostrar paragraph si existe SIN importar el tipo
    if (room.paragraph) {
      paragraphEl.textContent = room.paragraph;
      paragraphEl.classList.remove("hidden");
    }
    else if (room.type === "multiple") {
      answerInput.classList.add("hidden");
      checkAnswerBtn.classList.add("hidden");
      multipleChoiceEl.classList.remove("hidden");

      room.options.forEach((option) => {
        const button = document.createElement("button");
        button.textContent = option;
        button.classList.add("choice-btn");
        button.onclick = () => checkMultipleChoice(option);
        multipleChoiceEl.appendChild(button);
      });
    }
  }

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

  function checkMultipleChoice(selectedOption) {
    const correctAnswer = rooms[currentRoomIndex].answer.toLowerCase();
    if (selectedOption.toLowerCase() === correctAnswer) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  }

  function handleCorrectAnswer() {
    playSound(correctSound);

    score += hintUsed ? 50 : 100;
    updateScore();

    const roomData = rooms[currentRoomIndex];
    const word =
      roomData.answer.charAt(0).toUpperCase() + roomData.answer.slice(1);
    learnedWords.push(word);

    feedbackMessage.textContent = "CORRECT!";
    feedbackMessage.className = "feedback-correct";

    answerInput.disabled = true;
    checkAnswerBtn.disabled = true;
    hintBtn.disabled = true;
    document
      .querySelectorAll(".choice-btn")
      .forEach((btn) => (btn.disabled = true));

    setTimeout(() => {
      playSound(doorOpenSound);
      door.classList.add("open");
    }, 500);

    setTimeout(nextRoom, 2500);
  }

  function handleIncorrectAnswer() {
    playSound(incorrectSound);

    score = Math.max(0, score - 25);
    updateScore();

    feedbackMessage.textContent = "WRONG!";
    feedbackMessage.className = "feedback-incorrect";

    document.getElementById("challenge-container").classList.add("input-error");
    setTimeout(
      () =>
        document
          .getElementById("challenge-container")
          .classList.remove("input-error"),
      500
    );
  }

  function nextRoom() {
    currentRoomIndex++;
    answerInput.disabled = false;
    checkAnswerBtn.disabled = false;
    loadRoom(currentRoomIndex);
  }

  function showHint() {
    if (!hintUsed) {
      score = Math.max(0, score - 50);
      updateScore();
      hintUsed = true;
    }

    feedbackMessage.textContent = `Hint: ${rooms[currentRoomIndex].hint}`;
    hintBtn.disabled = true;
  }

  function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      secondsElapsed++;

      const minutes = Math.floor(secondsElapsed / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (secondsElapsed % 60).toString().padStart(2, "0");

      timerDisplay.textContent = `Time: ${minutes}:${seconds}`;
    }, 1000);
  }

  function finishGame() {
    clearInterval(timerInterval);
    playSound(victorySound);
    if (backgroundMusic) backgroundMusic.pause();

    gameScreen.classList.add("hidden");
    endScreen.classList.remove("hidden");

    finalScoreDisplay.textContent = `Your Final Score: ${score}`;
    finalTimeDisplay.textContent = `Time Taken: ${timerDisplay.textContent.replace(
      "Time: ",
      ""
    )}`;

    const highScoreVal = localStorage.getItem("escapeRoomHighScore");
    const highScoreName =
      localStorage.getItem("escapeRoomHighScoreName") || "The Warden";

    if (!highScoreVal || score > parseInt(highScoreVal)) {
      localStorage.setItem("escapeRoomHighScore", score);
      localStorage.setItem("escapeRoomHighScoreName", playerName);
      highScoreDisplay.textContent = `New High Score!`;
    } else {
      highScoreDisplay.textContent = `Best Score: ${highScoreVal} by ${highScoreName}`;
    }

    learnedWordsList.innerHTML = "";
    learnedWords.forEach((word) => {
      const li = document.createElement("li");
      li.textContent = word;
      learnedWordsList.appendChild(li);
    });
  }

  startButton.addEventListener("click", () => {
    const name = playerNameInput.value.trim();

    if (name) {
      localStorage.setItem("escapeRoomPlayerName", name);

      startScreen.classList.add("hidden");
      gameScreen.classList.remove("hidden");
      fogLayer.classList.add("hidden");
      flickerOverlay.classList.remove("hidden");

      startGame();
    } else {
      nameError.textContent = "A name is required to mark your tombstone.";
      playerNameInput.classList.add("input-error");
    }
  });

  playerNameInput.addEventListener("input", () => {
    if (playerNameInput.value.trim()) {
      nameError.textContent = "";
      playerNameInput.classList.remove("input-error");
    }
  });

  playerNameInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      startButton.click();
    }
  });

  checkAnswerBtn.addEventListener("click", checkAnswer);

  answerInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      checkAnswer();
    }
  });

  hintBtn.addEventListener("click", showHint);

  restartBtn.addEventListener("click", () => {
    endScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    flickerOverlay.classList.add("hidden");
    fogLayer.classList.remove("hidden");
    playerNameInput.value = "";
  });
});