const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');
const questionElement = document.getElementById('question');
const answerElement = document.getElementById('answer');
const resultsTable = document.getElementById('resultsTable');
const startButton = document.getElementById('startButton');
const progressBarFill = document.getElementById('progressBarFill');

let startTime, endTime;
let timesTables = [];
let currentQuestion;
let correctAnswers = 0;
let totalQuestions = 0;
let answerShown = false; // Flag to ensure swipe is only registered after answer is revealed

const MAX_QUESTIONS = 144; // 12 x 12 = 144

function initTimesTables() {
    timesTables = [];
    for (let i = 1; i <= 12; i++) {
        for (let j = 1; j <= 12; j++) {
            timesTables.push({ question: `${i} x ${j}`, answer: i * j });
        }
    }
}

function getRandomQuestion() {
    // Check if the pool is empty before attempting to splice
    if (timesTables.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * timesTables.length);
    // splice returns an array, so we take the first element [0]
    return timesTables.splice(randomIndex, 1)[0]; 
}

function updateProgressBar() {
    // The progress bar tracks how many unique questions have been correctly answered
    // (i.e., how many items have been permanently removed from the initial 144 set)
    const progress = ((MAX_QUESTIONS - timesTables.length) / MAX_QUESTIONS) * 100; 
    progressBarFill.style.width = `${progress}%`;
}

function showQuestion() {
    currentQuestion = getRandomQuestion();
    
    if (!currentQuestion) {
        // This case should be caught by the length check in handleSwipe, 
        // but it's a good safety check.
        endGame(); 
        return;
    }

    questionElement.textContent = currentQuestion.question;
    answerElement.textContent = "";
    answerElement.style.display = "none";
    answerShown = false; // Reset the flag for the new question
    updateProgressBar();
}

function showAnswer() {
    // Only show the answer if it hasn't been shown yet for this question
    if (!answerShown) {
        answerElement.textContent = currentQuestion.answer;
        answerElement.style.display = "block";
        answerShown = true; // Set flag to allow swiping
    }
}

function handleSwipe(direction) {
    // Only process the swipe if the answer has been revealed
    if (!answerShown) {
        return; 
    }
    
    totalQuestions++; // Count the card review
    
    if (direction === 'left') {
        // SWIPE LEFT: Mark Correct (Question is gone permanently)
        correctAnswers++;
        // The question was already removed by getRandomQuestion()
    } else if (direction === 'right') {
        // SWIPE RIGHT: Mark Wrong (Put the question back into the pool)
        timesTables.push(currentQuestion); 
    }

    if (timesTables.length === 0) {
        endGame();
    } else {
        showQuestion();
    }
}

function startGame() {
    startTime = new Date();
    correctAnswers = 0;
    totalQuestions = 0;
    initTimesTables();
    
    startScreen.style.display = "none";
    gameScreen.style.display = "flex";
    
    showQuestion();
}

function endGame() {
    endTime = new Date();
    const timeTaken = (endTime - startTime) / 1000;
    
    // Calculate final metrics
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const secondsPerCard = totalQuestions > 0 ? timeTaken / totalQuestions : 0;
    const cardsPerSecond = timeTaken > 0 ? totalQuestions / timeTaken : 0;

    resultsTable.innerHTML = `
        <tr><th>Total Cards Seen</th><td>${totalQuestions}</td></tr>
        <tr><th>Accuracy (Correct Marks)</th><td>${accuracy.toFixed(2)}%</td></tr>
        <tr><th>Time Taken</th><td>${timeTaken.toFixed(2)} seconds</td></tr>
        <tr><th>Seconds per Card</th><td>${secondsPerCard.toFixed(2)}</td></tr>
        <tr><th>Cards per Second</th><td>${cardsPerSecond.toFixed(2)}</td></tr>
    `;

    gameScreen.style.display = "none";
    resultsScreen.style.display = "flex";
}

// --- Event Listeners ---

startButton.addEventListener('click', startGame);

// Tap anywhere on the game screen to reveal the answer
gameScreen.addEventListener('click', showAnswer);


// --- Basic Swipe Detection (Touch Events) ---
let startX;

gameScreen.addEventListener('touchstart', (e) => {
    // Record the starting X position of the first touch
    startX = e.touches[0].clientX;
});

gameScreen.addEventListener('touchend', (e) => {
    // Only proceed if the answer has been shown
    if (!answerShown) {
        return; 
    }
    
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startX;
    const swipeThreshold = 50; // Minimum distance to register a swipe

    if (Math.abs(diffX) > swipeThreshold) { 
        if (diffX < 0) {
            // Swipe Left (End X is less than Start X)
            handleSwipe('left');
        } else {
            // Swipe Right (End X is greater than Start X)
            handleSwipe('right');
        }
    }
});
