document.addEventListener('DOMContentLoaded', () => {
    // State
    const TOTAL_QUESTIONS = 4;
    let currentQuestionIndex = 0;
    let score = 0;
    let currentProblem = { n1: 0, n2: 0, ans: 0 };
    let isProcessing = false;

    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const questionScreen = document.getElementById('question-screen');
    const resultScreen = document.getElementById('result-screen');

    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const submitBtn = document.getElementById('submit-btn');

    const num1El = document.getElementById('num1');
    const num2El = document.getElementById('num2');
    const operatorEl = document.getElementById('operator');
    const answerInput = document.getElementById('answer-input');
    const feedbackEl = document.getElementById('feedback-msg');
    const progressFill = document.getElementById('progress-fill');

    const accuracyText = document.getElementById('accuracy-text');
    const scoreCount = document.getElementById('score-count');

    // Audio Context
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(type) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'correct') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(600, now + 0.1); // Ding-dong
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);

            // Confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now); // Low buzz
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    }

    // Event Listeners
    startBtn.addEventListener('click', () => { playSound('click'); startGame(); });
    restartBtn.addEventListener('click', () => { playSound('click'); resetGame(); });
    submitBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });

    function showScreen(screen) {
        // Hide all screens
        [startScreen, questionScreen, resultScreen].forEach(s => {
            s.classList.remove('active');
            // Small delay to allow fade out before setting display:none if we were doing strict keeping
            // But CSS controls logic with opacity/pointer-events mostly.
            // For accessibility we should toggle hidden class properly but for visual simplified:
            if (s !== screen) {
                setTimeout(() => s.classList.add('hidden'), 400);
            }
        });

        // Show target
        screen.classList.remove('hidden');
        // Force reflow
        void screen.offsetWidth;
        screen.classList.add('active');
    }

    function startGame() {
        currentQuestionIndex = 0;
        score = 0;
        showScreen(questionScreen);
        nextQuestion();
    }

    function resetGame() {
        showScreen(startScreen);
    }

    function nextQuestion() {
        if (currentQuestionIndex >= TOTAL_QUESTIONS) {
            showResults();
            return;
        }

        // Generate Problem
        let n1, n2, ans, operator;

        if (currentQuestionIndex < 2) {
            // Addition (First 2 questions)
            n1 = Math.floor(Math.random() * 10);
            n2 = Math.floor(Math.random() * 10);
            ans = n1 + n2;
            operator = '+';
        } else {
            // Subtraction (Last 2 questions)
            // Ensure n1 >= n2 so result is non-negative
            n1 = Math.floor(Math.random() * 10);
            n2 = Math.floor(Math.random() * 10);
            if (n1 < n2) {
                [n1, n2] = [n2, n1]; // Swap
            }
            ans = n1 - n2;
            operator = '-';
        }

        currentProblem = { n1, n2, ans };

        // Update UI
        num1El.textContent = n1;
        num2El.textContent = n2;
        operatorEl.textContent = operator;
        answerInput.value = '';
        answerInput.focus();
        feedbackEl.textContent = '';
        feedbackEl.style.color = 'var(--text-secondary)';

        // Update Progress
        const progress = (currentQuestionIndex / TOTAL_QUESTIONS) * 100;
        progressFill.style.width = `${progress}%`;

        isProcessing = false;
    }

    function checkAnswer() {
        if (isProcessing) return;

        const userAns = parseInt(answerInput.value);
        if (isNaN(userAns)) return;

        isProcessing = true;
        currentQuestionIndex++;

        if (userAns === currentProblem.ans) {
            score++;
            playSound('correct');
            feedbackEl.textContent = '正解！';
            feedbackEl.style.color = 'var(--success-color)';
        } else {
            playSound('wrong');
            feedbackEl.textContent = `ざんねん… 正解は ${currentProblem.ans} でした`;
            feedbackEl.style.color = 'var(--error-color)';
        }

        // Wait a bit then go to next
        setTimeout(() => {
            nextQuestion();
        }, 1000);
    }

    function showResults() {
        showScreen(resultScreen);
        const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);
        accuracyText.textContent = `${percentage}%`;
        scoreCount.textContent = score;
        progressFill.style.width = '100%';

        if (score === TOTAL_QUESTIONS) {
            playSound('correct');
            setTimeout(() => {
                confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.6 }
                });
            }, 300);
        }
    }
});
