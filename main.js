let board = Array(9).fill('');
let gameActive = true;
let playerScore = 0;
let aiScore = 0;

function makeMove(cellIndex) {
    if (!gameActive || board[cellIndex] !== '') return;

    // Player move
    board[cellIndex] = 'X';
    updateCell(cellIndex, 'X');
    
    if (checkWinner() || board.every(cell => cell !== '')) {
        endGame();
        return;
    }

    // AI move
    gameActive = false;
    document.getElementById('status').textContent = "AI is thinking...";
    
    setTimeout(() => {
        makeAIMove();
        gameActive = true;
        
        if (checkWinner() || board.every(cell => cell !== '')) {
            endGame();
        } else {
            document.getElementById('status').textContent = "Your turn! (X)";
        }
    }, 500);
}

function makeAIMove() {
    // Try to win
    const winMove = findBestMove('O');
    if (winMove !== -1) {
        board[winMove] = 'O';
        updateCell(winMove, 'O');
        return;
    }

    // Block player from winning
    const blockMove = findBestMove('X');
    if (blockMove !== -1) {
        board[blockMove] = 'O';
        updateCell(blockMove, 'O');
        return;
    }

    // Take center if available
    if (board[4] === '') {
        board[4] = 'O';
        updateCell(4, 'O');
        return;
    }

    // Take any available corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === '');
    if (availableCorners.length > 0) {
        const move = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        board[move] = 'O';
        updateCell(move, 'O');
        return;
    }

    // Take any available side
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(i => board[i] === '');
    if (availableSides.length > 0) {
        const move = availableSides[Math.floor(Math.random() * availableSides.length)];
        board[move] = 'O';
        updateCell(move, 'O');
    }
}

function findBestMove(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] === player && board[b] === player && board[c] === '') return c;
        if (board[a] === player && board[c] === player && board[b] === '') return b;
        if (board[b] === player && board[c] === player && board[a] === '') return a;
    }
    return -1;
}

function updateCell(index, mark) {
    const cell = document.getElementsByClassName('cell')[index];
    cell.textContent = mark;
    cell.disabled = true;
    addPopAnimation(cell);
}

function checkWinner() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function endGame() {
    const winner = checkWinner();
    if (winner) {
        if (winner === 'X') {
            playerScore++;
            document.getElementById('status').textContent = "You won! 🎉";
        } else {
            aiScore++;
            document.getElementById('status').textContent = "AI won! 😔";
        }
    } else {
        document.getElementById('status').textContent = "It's a draw! 🤝";
    }
    
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('aiScore').textContent = aiScore;
    gameActive = false;
}

function resetGame() {
    board = Array(9).fill('');
    gameActive = true;
    document.getElementById('status').textContent = "Your turn! (X)";
    
    const cells = document.getElementsByClassName('cell');
    for (let cell of cells) {
        cell.textContent = '';
        cell.disabled = false;
    }
}

function resetScore() {
    playerScore = 0;
    aiScore = 0;
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('aiScore').textContent = '0';
    resetGame();
}

function addPopAnimation(element) {
    element.classList.add('animate-pop');
    element.addEventListener('animationend', () => {
        element.classList.remove('animate-pop');
    }, { once: true });
}
