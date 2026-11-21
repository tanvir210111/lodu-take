// Snakes & Ladders Engine (লুডু মাস্টার স্টাইল ১০০ ঘরের সাপ-লুডু)
class SnakesLaddersGame {
    constructor(canvasId, onGameEnd) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onGameEnd = onGameEnd;

        this.boardSize = 10;
        this.tileSize = 40;

        // Ladders: [start, end]
        this.ladders = {
            4: 14,
            9: 31,
            20: 38,
            28: 84,
            40: 59,
            51: 67,
            63: 81,
            71: 91
        };

        // Snakes: [head, tail]
        this.snakes = {
            17: 7,
            54: 34,
            62: 19,
            64: 60,
            87: 24,
            93: 73,
            95: 75,
            99: 78
        };

        this.playerPos = 0;
        this.botPos = 0;
        this.isMoving = false;
        this.isGameOver = false;

        this.initCanvas();
        this.drawBoard();
    }

    initCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : this.canvas.getBoundingClientRect();
        const size = Math.min(rect.width || 360, rect.height || 360, 400);
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        this.tileSize = size / 10;
        this.renderSize = size;
    }

    reset() {
        this.playerPos = 0;
        this.botPos = 0;
        this.isMoving = false;
        this.isGameOver = false;
        this.drawBoard();
    }

    getCellCoord(cellNum) {
        if (cellNum <= 0) return { x: 15, y: this.renderSize - 15 };
        const index = cellNum - 1;
        const rowFromBottom = Math.floor(index / 10);
        const colInRow = index % 10;
        const col = (rowFromBottom % 2 === 0) ? colInRow : (9 - colInRow);
        const row = 9 - rowFromBottom;

        return {
            x: col * this.tileSize + this.tileSize / 2,
            y: row * this.tileSize + this.tileSize / 2
        };
    }

    drawBoard() {
        this.ctx.clearRect(0, 0, this.renderSize, this.renderSize);

        // Draw 100 tiles with vibrant Ludo Master checkerboard
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const cellIndex = (9 - r) * 10 + (( (9 - r) % 2 === 0 ) ? c : (9 - c)) + 1;
                const isEven = (r + c) % 2 === 0;

                // Checkerboard colors
                this.ctx.fillStyle = isEven ? '#1e293b' : '#0f172a';
                if (cellIndex === 100) this.ctx.fillStyle = '#b45309'; // Crown cell
                this.ctx.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);

                // Grid borders
                this.ctx.strokeStyle = '#334155';
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);

                // Number text
                this.ctx.fillStyle = isEven ? '#94a3b8' : '#64748b';
                this.ctx.font = 'bold 9px sans-serif';
                this.ctx.fillText(cellIndex.toString(), c * this.tileSize + 3, r * this.tileSize + 10);

                if (cellIndex === 100) {
                    this.ctx.fillText('🏆', c * this.tileSize + this.tileSize / 2 - 5, r * this.tileSize + this.tileSize / 2 + 5);
                }
            }
        }

        // Draw Ladders
        Object.entries(this.ladders).forEach(([start, end]) => {
            this.drawLadder(parseInt(start), parseInt(end));
        });

        // Draw Snakes
        Object.entries(this.snakes).forEach(([head, tail]) => {
            this.drawSnake(parseInt(head), parseInt(tail));
        });

        // Draw Tokens
        this.drawTokens();
    }

    drawLadder(start, end) {
        const p1 = this.getCellCoord(start);
        const p2 = this.getCellCoord(end);

        this.ctx.save();
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len * 5;
        const ny = dx / len * 5;

        this.ctx.moveTo(p1.x + nx, p1.y + ny);
        this.ctx.lineTo(p2.x + nx, p2.y + ny);
        this.ctx.moveTo(p1.x - nx, p1.y - ny);
        this.ctx.lineTo(p2.x - nx, p2.y - ny);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#7dd3fc';
        this.ctx.lineWidth = 2;
        const rungs = Math.floor(len / 13);
        for (let i = 1; i <= rungs; i++) {
            const t = i / (rungs + 1);
            const rx = p1.x + dx * t;
            const ry = p1.y + dy * t;
            this.ctx.beginPath();
            this.ctx.moveTo(rx + nx, ry + ny);
            this.ctx.lineTo(rx - nx, ry - ny);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    drawSnake(head, tail) {
        const p1 = this.getCellCoord(head);
        const p2 = this.getCellCoord(tail);

        this.ctx.save();
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();

        const midX = (p1.x + p2.x) / 2 + 12;
        const midY = (p1.y + p2.y) / 2 - 8;

        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        this.ctx.stroke();

        // Head
        this.ctx.fillStyle = '#dc2626';
        this.ctx.beginPath();
        this.ctx.arc(p1.x, p1.y, 5.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(p1.x - 1.5, p1.y - 1.5, 1.2, 0, Math.PI * 2);
        this.ctx.arc(p1.x + 1.5, p1.y - 1.5, 1.2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawTokens() {
        if (this.playerPos > 0) {
            const pos = this.getCellCoord(this.playerPos);
            this.drawPawn(pos.x - 4, pos.y, '#3b82f6', '#1e40af', 'P');
        }
        if (this.botPos > 0) {
            const pos = this.getCellCoord(this.botPos);
            this.drawPawn(pos.x + 4, pos.y, '#ef4444', '#991b1b', 'B');
        }
    }

    drawPawn(x, y, color, shade, label) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 4, 6, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        const grad = this.ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 7);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, color);
        grad.addColorStop(1, shade);

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 7, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 7.5px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, y);
        this.ctx.restore();
    }

    animateMove(isPlayer, startPos, targetPos, callback) {
        let current = startPos;
        const step = () => {
            if (current < targetPos) {
                current++;
                if (isPlayer) this.playerPos = current;
                else this.botPos = current;
                window.audioManager.playMoveStep();
                this.drawBoard();
                setTimeout(step, 130);
            } else {
                let finalPos = targetPos;
                if (this.ladders[targetPos]) {
                    finalPos = this.ladders[targetPos];
                    window.audioManager.playLadderClimb();
                } else if (this.snakes[targetPos]) {
                    finalPos = this.snakes[targetPos];
                    window.audioManager.playSnakeBite();
                }

                if (isPlayer) this.playerPos = finalPos;
                else this.botPos = finalPos;

                this.drawBoard();
                if (callback) callback();
            }
        };
        step();
    }

    playTurn(diceRoll, isBot, callback) {
        this.isMoving = true;
        let finished = false;
        const safeCb = () => {
            if (!finished) {
                finished = true;
                this.isMoving = false;
                if (callback) callback();
            }
        };

        const watchdog = setTimeout(() => {
            if (!finished) {
                console.warn('Snakes playTurn watchdog triggered');
                safeCb();
            }
        }, 2500);

        const currentPos = isBot ? this.botPos : this.playerPos;
        let targetPos = currentPos + diceRoll;

        if (targetPos > 100) {
            targetPos = currentPos;
        }

        this.animateMove(!isBot, currentPos, targetPos, () => {
            clearTimeout(watchdog);
            const finalPos = isBot ? this.botPos : this.playerPos;
            if (finalPos === 100) {
                this.isGameOver = true;
                if (!isBot) {
                    window.audioManager.playWin();
                    this.onGameEnd(true);
                } else {
                    window.audioManager.playLose();
                    this.onGameEnd(false);
                }
                return;
            }

            safeCb();
        });
    }
}

window.SnakesLaddersGame = SnakesLaddersGame;
