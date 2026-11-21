// Ludo Master Engine - 4 Tokens Authentic Board Renderer & Interactive Token Selector
class LudoGame {
    constructor(canvasId, onGameEnd) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.onGameEnd = onGameEnd;

        this.gridCount = 15;
        this.cellSize = 26;
        this.renderSize = 390;

        // Player: Blue (Bottom-Left), Bot: Red (Top-Right)
        // 4 tokens each (Authentic Ludo Master style)
        this.playerTokens = [
            { id: 0, pos: -1, isHome: false, color: '#2563eb', border: '#ffffff' },
            { id: 1, pos: -1, isHome: false, color: '#3b82f6', border: '#ffffff' },
            { id: 2, pos: -1, isHome: false, color: '#1d4ed8', border: '#ffffff' },
            { id: 3, pos: -1, isHome: false, color: '#60a5fa', border: '#ffffff' }
        ];

        this.botTokens = [
            { id: 0, pos: -1, isHome: false, color: '#dc2626', border: '#ffffff' },
            { id: 1, pos: -1, isHome: false, color: '#ef4444', border: '#ffffff' },
            { id: 2, pos: -1, isHome: false, color: '#b91c1c', border: '#ffffff' },
            { id: 3, pos: -1, isHome: false, color: '#f87171', border: '#ffffff' }
        ];

        this.isMoving = false;
        this.isGameOver = false;
        this.movableTokenIds = [];
        this.pendingDiceRoll = null;
        this.onMoveCallback = null;

        this.initCanvas();
        this.setupPathCoordinates();
        this.drawBoard();
        this.bindEvents();
    }

    initCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        const size = Math.min(rect.width || 380, 400);
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.ctx.scale(dpr, dpr);
        this.cellSize = size / 15;
        this.renderSize = size;
    }

    setupPathCoordinates() {
        const cs = this.cellSize;
        // 52 common steps around the board
        this.commonTrack = [
            [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
            [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
            [7, 0], [8, 0],
            [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
            [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
            [14, 7], [14, 8],
            [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
            [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
            [7, 14], [6, 14],
            [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
            [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
            [0, 7], [0, 6]
        ];

        // Player (Blue) home corridor (6 steps)
        this.playerHomeTrack = [
            [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]
        ];

        // Bot (Red) home corridor (6 steps)
        this.botHomeTrack = [
            [13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]
        ];

        this.safeIndices = [0, 8, 13, 21, 26, 34, 39, 47];
    }

    reset() {
        this.playerTokens.forEach(t => { t.pos = -1; t.isHome = false; });
        this.botTokens.forEach(t => { t.pos = -1; t.isHome = false; });
        this.isMoving = false;
        this.isGameOver = false;
        this.movableTokenIds = [];
        this.pendingDiceRoll = null;
        this.drawBoard();
    }

    getBaseCoords(isPlayer, tokenIndex) {
        const cs = this.cellSize;
        if (isPlayer) {
            // Blue Base (Bottom-Left)
            const offsets = [
                { c: 2, r: 11 }, { c: 3.5, r: 11 },
                { c: 2, r: 12.5 }, { c: 3.5, r: 12.5 }
            ];
            const p = offsets[tokenIndex] || offsets[0];
            return { x: p.c * cs + cs / 2, y: p.r * cs + cs / 2 };
        } else {
            // Red Base (Top-Right)
            const offsets = [
                { c: 11, r: 2 }, { c: 12.5, r: 2 },
                { c: 11, r: 3.5 }, { c: 12.5, r: 3.5 }
            ];
            const p = offsets[tokenIndex] || offsets[0];
            return { x: p.c * cs + cs / 2, y: p.r * cs + cs / 2 };
        }
    }

    getTokenCoord(isPlayer, token) {
        if (token.pos === -1) {
            return this.getBaseCoords(isPlayer, token.id);
        }
        const cs = this.cellSize;
        if (token.pos < 51) {
            const offset = isPlayer ? 0 : 26;
            const index = (token.pos + offset) % 52;
            const pt = this.commonTrack[index] || [7, 7];
            return { x: pt[0] * cs + cs / 2, y: pt[1] * cs + cs / 2 };
        } else {
            const homeIdx = Math.min(token.pos - 51, 5);
            const pt = isPlayer ? this.playerHomeTrack[homeIdx] : this.botHomeTrack[homeIdx];
            const coord = pt || [7, 7];
            return { x: coord[0] * cs + cs / 2, y: coord[1] * cs + cs / 2 };
        }
    }

    drawBoard() {
        const cs = this.cellSize;
        this.ctx.clearRect(0, 0, this.renderSize, this.renderSize);

        // 1. Draw 4 Bases with rich Ludo King gradients
        // Top-Left (Green)
        this.drawLudoBase(0, 0, '#15803d', '#22c55e', '#bbf7d0');
        // Top-Right (Red - Bot)
        this.drawLudoBase(9, 0, '#b91c1c', '#ef4444', '#fecaca');
        // Bottom-Left (Blue - Player)
        this.drawLudoBase(0, 9, '#1d4ed8', '#3b82f6', '#bfdbfe');
        // Bottom-Right (Yellow)
        this.drawLudoBase(9, 9, '#a16207', '#eab308', '#fef08a');

        // 2. Draw Track cells
        this.ctx.lineWidth = 1;
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const inBase = (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8);
                const inCenter = (r >= 6 && r <= 8 && c >= 6 && c <= 8);

                if (!inBase && !inCenter) {
                    this.ctx.fillStyle = '#0f172a'; // Dark modern path cell

                    // Home corridors
                    if (r === 7 && c >= 1 && c <= 5) this.ctx.fillStyle = '#2563eb'; // Blue path
                    if (r === 7 && c >= 9 && c <= 13) this.ctx.fillStyle = '#dc2626'; // Red path
                    if (c === 7 && r >= 1 && r <= 5) this.ctx.fillStyle = '#16a34a'; // Green path
                    if (c === 7 && r >= 9 && r <= 13) this.ctx.fillStyle = '#ca8a04'; // Yellow path

                    // Starting squares
                    if (r === 6 && c === 1) this.ctx.fillStyle = '#3b82f6';
                    if (r === 8 && c === 13) this.ctx.fillStyle = '#ef4444';
                    if (r === 1 && c === 8) this.ctx.fillStyle = '#22c55e';
                    if (r === 13 && c === 6) this.ctx.fillStyle = '#eab308';

                    this.ctx.fillRect(c * cs, r * cs, cs, cs);
                    this.ctx.strokeStyle = '#334155';
                    this.ctx.strokeRect(c * cs, r * cs, cs, cs);
                }
            }
        }

        // 3. Draw Center 4 Triangles
        this.drawCenterTriangles();

        // 4. Safe Stars
        this.drawSafeStars();

        // 5. Draw Tokens
        this.drawTokens();
    }

    drawLudoBase(gx, gy, darkColor, lightColor, innerColor) {
        const cs = this.cellSize;
        // Outer colored square
        this.ctx.fillStyle = lightColor;
        this.ctx.fillRect(gx * cs, gy * cs, cs * 6, cs * 6);
        this.ctx.strokeStyle = darkColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(gx * cs, gy * cs, cs * 6, cs * 6);

        // Inner White Box
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect((gx + 1) * cs, (gy + 1) * cs, cs * 4, cs * 4);

        // Circular token holding slots
        const offsets = [
            { c: gx + 2, r: gy + 2 },
            { c: gx + 3.5, r: gy + 2 },
            { c: gx + 2, r: gy + 3.5 },
            { c: gx + 3.5, r: gy + 3.5 }
        ];

        offsets.forEach(pt => {
            this.ctx.fillStyle = innerColor;
            this.ctx.beginPath();
            this.ctx.arc(pt.c * cs + cs / 2, pt.r * cs + cs / 2, cs * 0.55, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = lightColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    drawCenterTriangles() {
        const cs = this.cellSize;
        const cx = 7.5 * cs;
        const cy = 7.5 * cs;

        // Blue (Left)
        this.ctx.fillStyle = '#2563eb';
        this.ctx.beginPath();
        this.ctx.moveTo(6 * cs, 6 * cs);
        this.ctx.lineTo(cx, cy);
        this.ctx.lineTo(6 * cs, 9 * cs);
        this.ctx.fill();

        // Red (Right)
        this.ctx.fillStyle = '#dc2626';
        this.ctx.beginPath();
        this.ctx.moveTo(9 * cs, 6 * cs);
        this.ctx.lineTo(cx, cy);
        this.ctx.lineTo(9 * cs, 9 * cs);
        this.ctx.fill();

        // Green (Top)
        this.ctx.fillStyle = '#16a34a';
        this.ctx.beginPath();
        this.ctx.moveTo(6 * cs, 6 * cs);
        this.ctx.lineTo(cx, cy);
        this.ctx.lineTo(9 * cs, 6 * cs);
        this.ctx.fill();

        // Yellow (Bottom)
        this.ctx.fillStyle = '#ca8a04';
        this.ctx.beginPath();
        this.ctx.moveTo(6 * cs, 9 * cs);
        this.ctx.lineTo(cx, cy);
        this.ctx.lineTo(9 * cs, 9 * cs);
        this.ctx.fill();

        // Crown/Trophy in center
        this.ctx.fillStyle = '#fef08a';
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('👑', cx, cy);
    }

    drawSafeStars() {
        const cs = this.cellSize;
        const stars = [[1, 6], [8, 2], [13, 8], [6, 12], [2, 8], [8, 13], [12, 6], [6, 1]];
        this.ctx.fillStyle = '#fde047';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        stars.forEach(([c, r]) => {
            this.ctx.fillText('★', c * cs + cs / 2, r * cs + cs / 2);
        });
    }

    drawTokens() {
        // Draw Bot Tokens (Red)
        this.botTokens.forEach(token => {
            const coord = this.getTokenCoord(false, token);
            this.draw3DPawn(coord.x, coord.y, '#ef4444', '#991b1b', false);
        });

        // Draw Player Tokens (Blue)
        this.playerTokens.forEach(token => {
            const coord = this.getTokenCoord(true, token);
            const isMovable = this.movableTokenIds.includes(token.id);
            this.draw3DPawn(coord.x, coord.y, '#3b82f6', '#1e40af', isMovable);
        });
    }

    draw3DPawn(x, y, mainColor, shadeColor, isMovable) {
        this.ctx.save();

        // If movable, draw pulsating halo ring around token
        if (isMovable) {
            this.ctx.strokeStyle = '#facc15';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 13, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 6, 8, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Pawn Base
        this.ctx.fillStyle = shadeColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y + 2, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Pawn Head (3D Gradient ball)
        const radGrad = this.ctx.createRadialGradient(x - 2, y - 4, 1, x, y - 2, 7);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(0.3, mainColor);
        radGrad.addColorStop(1, shadeColor);

        this.ctx.fillStyle = radGrad;
        this.ctx.beginPath();
        this.ctx.arc(x, y - 2, 7, 0, Math.PI * 2);
        this.ctx.fill();

        // Border highlight
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.restore();
    }

    bindEvents() {
        // Click on token to move
        this.canvas.addEventListener('click', (e) => {
            if (this.isMoving || this.movableTokenIds.length === 0 || !this.pendingDiceRoll) return;

            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Find if player clicked on a movable token
            for (let id of this.movableTokenIds) {
                const token = this.playerTokens[id];
                const coord = this.getTokenCoord(true, token);
                const dist = Math.hypot(clickX - coord.x, clickY - coord.y);

                if (dist <= 20) {
                    this.executePlayerMove(id);
                    return;
                }
            }
        });
    }

    // Determine which tokens can move for the given dice roll
    getMovableTokens(isPlayer, diceRoll) {
        const tokens = isPlayer ? this.playerTokens : this.botTokens;
        const movable = [];

        tokens.forEach(t => {
            if (t.isHome) return;
            if (t.pos === -1) {
                if (diceRoll === 6) movable.push(t.id);
            } else if (t.pos + diceRoll <= 56) {
                movable.push(t.id);
            }
        });

        return movable;
    }

    promptPlayerMove(diceRoll, callback) {
        this.pendingDiceRoll = diceRoll;
        this.onMoveCallback = callback;
        this.movableTokenIds = this.getMovableTokens(true, diceRoll);

        if (this.movableTokenIds.length === 0) {
            // No moves possible, pass turn
            this.pendingDiceRoll = null;
            this.drawBoard();
            setTimeout(() => callback(false), 500);
            return;
        }

        // If only 1 token can move, auto-move smoothly
        if (this.movableTokenIds.length === 1) {
            this.drawBoard();
            setTimeout(() => {
                this.executePlayerMove(this.movableTokenIds[0]);
            }, 300);
        } else {
            // Multiple choices, highlight and let user click
            this.drawBoard();
        }
    }

    executePlayerMove(tokenId) {
        const diceVal = this.pendingDiceRoll;
        const cb = this.onMoveCallback;
        this.movableTokenIds = [];
        this.pendingDiceRoll = null;

        this.moveToken(true, tokenId, diceVal, cb);
    }

    moveToken(isPlayer, tokenId, diceRoll, callback) {
        this.isMoving = true;
        const tokens = isPlayer ? this.playerTokens : this.botTokens;
        const token = tokens[tokenId];

        if (token.pos === -1) {
            if (diceRoll === 6) {
                token.pos = 0;
                window.audioManager.playMoveStep();
                this.drawBoard();
                this.isMoving = false;
                if (callback) callback(true); // 6 gives extra roll
                return;
            } else {
                this.isMoving = false;
                if (callback) callback(false);
                return;
            }
        }

        const startPos = token.pos;
        const targetPos = token.pos + diceRoll;

        if (targetPos > 56) {
            this.isMoving = false;
            if (callback) callback(false);
            return;
        }

        let curr = startPos;
        const stepAnim = () => {
            if (curr < targetPos) {
                curr++;
                token.pos = curr;
                window.audioManager.playMoveStep();
                this.drawBoard();
                setTimeout(stepAnim, 110);
            } else {
                // Reached target
                if (token.pos === 56) {
                    token.isHome = true;
                }

                const hasCut = this.checkCutOpponent(isPlayer, token);
                this.isMoving = false;

                // Check Win (All 4 tokens home)
                const allHome = tokens.filter(t => t.pos === 56).length >= 2; // Fast win at 2/4 tokens home
                if (allHome) {
                    this.isGameOver = true;
                    if (isPlayer) {
                        window.audioManager.playWin();
                        this.onGameEnd(true);
                    } else {
                        window.audioManager.playLose();
                        this.onGameEnd(false);
                    }
                    return;
                }

                if (callback) callback(hasCut || diceRoll === 6);
            }
        };
        stepAnim();
    }

    checkCutOpponent(isPlayer, token) {
        if (token.pos < 0 || token.pos > 50) return false;

        const oppTokens = isPlayer ? this.botTokens : this.playerTokens;
        const myOffset = isPlayer ? 0 : 26;
        const myTile = (token.pos + myOffset) % 52;

        if (this.safeIndices.includes(myTile)) return false;

        let cut = false;
        oppTokens.forEach(opp => {
            if (opp.pos >= 0 && opp.pos <= 50) {
                const oppOffset = isPlayer ? 26 : 0;
                const oppTile = (opp.pos + oppOffset) % 52;
                if (myTile === oppTile) {
                    opp.pos = -1; // Send back to base
                    cut = true;
                    window.audioManager.playCutSound();
                }
            }
        });

        this.drawBoard();
        return cut;
    }
}

window.LudoGame = LudoGame;
