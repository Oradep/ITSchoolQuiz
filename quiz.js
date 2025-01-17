let selectedQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let correctAnswers = {};
let timer;
let timeLeft;
let totalQuestions;

window.onload = async function() {
    if (localStorage.getItem('quizCompleted')) {
        window.location.href = 'end.html';
        disableQuizInteraction();
        return;
    }
    
    try {
        const response = await fetch('QuizData.json');
        if (!response.ok) {
            throw new Error(`Failed to load quiz data. Status: ${response.status}`);
        }
        const quizData = await response.json();

        if (!Array.isArray(quizData.questions) || quizData.questions.length < quizData.numberOfQuestions) {
            throw new Error('Invalid questions format or not enough questions');
        }

        timeLeft = quizData.timeLimit;
        totalQuestions = quizData.numberOfQuestions;

        while (selectedQuestions.length < totalQuestions) {
            const index = Math.floor(Math.random() * quizData.questions.length);
            if (!selectedQuestions.includes(quizData.questions[index])) {
                selectedQuestions.push(quizData.questions[index]);
            }
        }

        selectedQuestions.forEach(question => {
            correctAnswers[question.Question] = question.correct;
        });

        document.getElementById('time-left').textContent = formatTime(timeLeft);
        timer = setInterval(updateTimer, 1000);
        generateQuestionButtons(totalQuestions);
        showQuestion();

        document.getElementById('quiz-container').classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    } catch (error) {
        console.error('Error loading quiz data:', error);
        document.getElementById('loading').textContent = 'Не удалось загрузить вопросы. Попробуйте позже.';
    }
};

function updateTimer() {
    timeLeft--;
    document.getElementById('time-left').textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
        endQuizDueToTimeout();
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function showQuestion() {
    const question = selectedQuestions[currentQuestionIndex];
    document.getElementById('question-text').textContent = question.Question;
    document.getElementById('option-a').textContent = question.a;
    document.getElementById('option-b').textContent = question.b;
    document.getElementById('option-c').textContent = question.c;

    document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));

    if (userAnswers[question.Question]) {
        document.getElementById(`option-${userAnswers[question.Question]}`).classList.add('selected');
    }

    document.getElementById('prev-button').disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === selectedQuestions.length - 1) {
        document.getElementById('next-button').textContent = 'Завершить';
    } else {
        document.getElementById('next-button').textContent = 'Ответить';
    }

    updateQuestionButtons();
}

function nextQuestion() {
    saveAnswer();
    if (currentQuestionIndex < selectedQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        confirmEndQuiz();
    }
}

function prevQuestion() {
    saveAnswer();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

function jumpToQuestion(index) {
    saveAnswer();
    currentQuestionIndex = index;
    showQuestion();
}

function saveAnswer() {
    const question = selectedQuestions[currentQuestionIndex];
    if (document.getElementById('option-a').classList.contains('selected')) {
        userAnswers[question.Question] = 'a';
    } else if (document.getElementById('option-b').classList.contains('selected')) {
        userAnswers[question.Question] = 'b';
    } else if (document.getElementById('option-c').classList.contains('selected')) {
        userAnswers[question.Question] = 'c';
    }
}

function confirmEndQuiz() {
    if (localStorage.getItem('quizCompleted')) {
        endQuiz();
    } else {
        showModal("Вы уверены, что хотите завершить тест?", endQuiz);
    }
}

function endQuizDueToTimeout() {
    clearInterval(timer);
    displayResults('Время вышло');
    localStorage.setItem('quizCompleted', 'true');
    disableQuizInteraction();
}

function endQuiz() {
    closeModal();
    clearInterval(timer);
    displayResults();
    localStorage.setItem('quizCompleted', 'true');
    disableQuizInteraction();
}

function disableQuizInteraction() {
    document.querySelectorAll('.option-button').forEach(button => {
        button.disabled = true;
    });

    document.querySelectorAll('.question-button').forEach(button => {
        button.disabled = true;
    });

    document.getElementById('prev-button').disabled = true;
}

function displayResults() {
    let correctCount = 0;
    const resultData = selectedQuestions.map(question => {
        const userAnswer = userAnswers[question.Question];
        const isCorrect = userAnswer === question.correct;
        if (isCorrect) {
            correctCount++;
        }
        return {
            question: question.Question,
            userAnswer: userAnswer,
            correctAnswer: question.correct,
            isCorrect: isCorrect
        };
    });
    localStorage.setItem('quizResult', JSON.stringify({ correctCount, totalQuestions, resultData }));
    window.location.href = 'end.html';
}

function updateQuestionButtons() {
    const buttons = document.querySelectorAll('.question-button');
    buttons.forEach((button, index) => {
        if (index === currentQuestionIndex) {
            button.classList.add('active-question');
        } else {
            button.classList.remove('active-question');
        }
    });
}

function generateQuestionButtons(total) {
    const container = document.getElementById('question-buttons');
    container.innerHTML = '';
    for (let i = 0; i < total; i++) {
        const button = document.createElement('button');
        button.className = 'question-button';
        button.textContent = i + 1;
        button.onclick = () => jumpToQuestion(i);
        container.appendChild(button);
    }
}

document.querySelectorAll('.option-button').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
        this.classList.add('selected');
    });
});

function showModal(message, action) {
    document.getElementById('confirm-text').textContent = message;
    document.getElementById('confirm-modal').style.display = 'block';
    document.getElementById('confirm-yes').onclick = action;
}

function closeModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}
