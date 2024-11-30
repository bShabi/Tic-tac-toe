const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Game state storage
const games = new Map();

function generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkWinner(board) {
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

    if (board.every(cell => cell !== '')) return 'draw';
    return null;
}

io.on('connection', (socket) => {
    socket.on('createGame', () => {
        const gameCode = generateGameCode();
        games.set(gameCode, {
            board: Array(9).fill(''),
            players: [socket.id],
            currentPlayer: 'X'
        });
        socket.join(gameCode);
        socket.emit('gameCreated', gameCode);
    });

    socket.on('joinGame', (gameCode) => {
        const game = games.get(gameCode);
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }
        if (game.players.length >= 2) {
            socket.emit('error', 'Game is full');
            return;
        }

        game.players.push(socket.id);
        socket.join(gameCode);
        
        // Notify both players
        socket.emit('gameJoined', { mark: 'O' });
        io.to(game.players[0]).emit('gameJoined', { mark: 'X' });
        
        // Initial board state
        io.to(gameCode).emit('updateGame', {
            board: game.board,
            currentPlayer: game.currentPlayer
        });
    });

// In your server.js
socket.on('makeMove', ({ cellIndex, gameCode }) => {
    const game = games.get(gameCode);
    if (!game) {
        socket.emit('error', 'Game not found');
        return;
    }

    const playerIndex = game.players.indexOf(socket.id);
    if (playerIndex === -1) {
        socket.emit('error', 'Player not in game');
        return;
    }

    const playerMark = playerIndex === 0 ? 'X' : 'O';

    // Validate turn
    if (game.currentPlayer !== playerMark || game.board[cellIndex] !== '') {
        socket.emit('error', 'Invalid move');
        return;
    }

    // Make move
    game.board[cellIndex] = playerMark;
    
    // Switch turns
    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

    // Broadcast updated game state
    io.to(gameCode).emit('updateGame', {
        board: game.board,
        currentPlayer: game.currentPlayer
    });

    // Check for winner
    const winner = checkWinner(game.board);
    if (winner) {
        io.to(gameCode).emit('gameOver', {
            board: game.board,
            winner: winner === 'draw' ? null : winner
        });
        games.delete(gameCode);
    }
});

    socket.on('disconnect', () => {
        // Clean up any games where this player was participating
        for (const [gameCode, game] of games.entries()) {
            if (game.players.includes(socket.id)) {
                io.to(gameCode).emit('error', 'Opponent disconnected');
                games.delete(gameCode);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});