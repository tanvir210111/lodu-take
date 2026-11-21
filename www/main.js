// Ludo King Master Controller - Universal Layout, 3D Physics Dice & Never-Stuck AI Engine
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Available Avatars
    const AVATARS = [
        { id: 'king', name: 'King', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=King' },
        { id: 'queen', name: 'Queen', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Queen' },
        { id: 'tiger', name: 'Tiger', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tiger' },
        { id: 'cyber', name: 'Cyber', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber' },
        { id: 'ninja', name: 'Ninja', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ninja' },
        { id: 'wizard', name: 'Wizard', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Wizard' },
        { id: 'robot', name: 'Robot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alpha' },
        { id: 'phoenix', name: 'Phoenix', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Phoenix' }
    ];

    // State
    const state = {
        user: {
            name: 'Player 1',
            avatar: AVATARS[0].url
        },
        currentLevel: 1,
        totalLevels: 20,
        currentMatchIndex: 0,
        matches: Array(10).fill(null),
        currentMode: 'ludo',
        isPlayerTurn: true,
        canRoll: true,
        lastDiceValue: 1,
        soundEnabled: true
    };

    function loadUserData() {
        try {
            const savedProfile = localStorage.getItem('lodu_king_user_v1');
            if (savedProfile) {
                state.user = JSON.parse(savedProfile);
            }
            const savedProgress = localStorage.getItem('lodu_master_save_v1');
            if (savedProgress) {
                const data = JSON.parse(savedProgress);
                state.currentLevel = data.currentLevel || 1;
                state.currentMatchIndex = data.currentMatchIndex || 0;
                state.matches = data.matches || Array(10).fill(null);
            }
        } catch (e) {
            console.warn('Could not load user or state', e);
        }
    }

    function saveUserData() {
        try {
            localStorage.setItem('lodu_king_user_v1', JSON.stringify(state.user));
            localStorage.setItem('lodu_master_save_v1', JSON.stringify({
                currentLevel: state.currentLevel,
                currentMatchIndex: state.currentMatchIndex,
                matches: state.matches
            }));
        } catch (e) {
            console.warn('Could not save user data', e);
        }
    }

    loadUserData();

    // Elements
    const splashScreen = document.getElementById('splashScreen');
    const splashProgressBar = document.getElementById('splashProgressBar');
    const splashProgressText = document.getElementById('splashProgressText');

    const authScreen = document.getElementById('authScreen');
    const avatarPicker = document.getElementById('avatarPicker');
    const playerNameInput = document.getElementById('playerNameInput');
    const authPlayGuestBtn = document.getElementById('authPlayGuestBtn');
    const authGoogleBtn = document.getElementById('authGoogleBtn');

    const lobbyScreen = document.getElementById('lobbyScreen');
    const lobbyAvatarImg = document.getElementById('lobbyAvatarImg');
    const lobbyPlayerName = document.getElementById('lobbyPlayerName');
    const lobbyLevelBadge = document.getElementById('lobbyLevelBadge');
    const lobbySoundBtn = document.getElementById('lobbySoundBtn');
    const lobbySoundIcon = document.getElementById('lobbySoundIcon');
    const lobbyWalletBadge = document.getElementById('lobbyWalletBadge');

    const btnPlayLudoMode = document.getElementById('btnPlayLudoMode');
    const btnPlaySnakeMode = document.getElementById('btnPlaySnakeMode');
    const btnOpenWallet = document.getElementById('btnOpenWallet');
    const btnOpenRules = document.getElementById('btnOpenRules');
    const footerWalletBtn = document.getElementById('footerWalletBtn');
    const footerSettingsBtn = document.getElementById('footerSettingsBtn');

    const gameScreen = document.getElementById('gameScreen');
    const btnBackToLobby = document.getElementById('btnBackToLobby');
    const gameLevelDisplay = document.getElementById('gameLevelDisplay');
    const gameDiffBadge = document.getElementById('gameDiffBadge');
    const gameMatchNumber = document.getElementById('gameMatchNumber');
    const arenaWinCount = document.getElementById('arenaWinCount');
    const arenaLossCount = document.getElementById('arenaLossCount');
    const arenaMatchDots = document.getElementById('arenaMatchDots');
    const arenaLudoView = document.getElementById('arenaLudoView');
    const arenaSnakeView = document.getElementById('arenaSnakeView');

    const botAvatarWrapper = document.getElementById('botAvatarWrapper');
    const botStatusLabel = document.getElementById('botStatusLabel');
    const bot3DDice = document.getElementById('bot3DDice');

    const userAvatarWrapper = document.getElementById('userAvatarWrapper');
    const gameUserAvatar = document.getElementById('gameUserAvatar');
    const userTurnTitle = document.getElementById('userTurnTitle');
    const userTurnHint = document.getElementById('userTurnHint');
    const user3DDice = document.getElementById('user3DDice');
    const userDiceClickArea = document.getElementById('userDiceClickArea');
    const rollDiceBtn = document.getElementById('rollDiceBtn');

    // Modals
    const walletModal = document.getElementById('walletModal');
    const closeWalletModal = document.getElementById('closeWalletModal');
    const withdrawForm = document.getElementById('withdrawForm');
    const withdrawAmount = document.getElementById('withdrawAmount');
    const accountNumber = document.getElementById('accountNumber');
    const withdrawError = document.getElementById('withdrawError');
    const withdrawSuccess = document.getElementById('withdrawSuccess');

    const resultModal = document.getElementById('resultModal');
    const resultIconWrapper = document.getElementById('resultIconWrapper');
    const resultTitle = document.getElementById('resultTitle');
    const resultDesc = document.getElementById('resultDesc');
    const nextMatchBtn = document.getElementById('nextMatchBtn');

    const rulesModal = document.getElementById('rulesModal');
    const closeRulesModal = document.getElementById('closeRulesModal');

    // Init Engines
    const ludoGame = new window.LudoGame('ludoCanvas', (isWin) => handleMatchOutcome(isWin));
    const snakeGame = new window.SnakesLaddersGame('snakeCanvas', (isWin) => handleMatchOutcome(isWin));

    // Handle Window Resize for Universal Responsive Canvas
    window.addEventListener('resize', () => {
        if (!gameScreen.classList.contains('hidden')) {
            setTimeout(() => {
                if (state.currentMode === 'ludo') {
                    ludoGame.initCanvas();
                    ludoGame.drawBoard();
                } else {
                    snakeGame.initCanvas();
                    snakeGame.drawBoard();
                }
            }, 100);
        }
    });

    // 1. SPLASH SCREEN FLOW
    function checkLiveOTA() {
        fetch('http://lodutake.duckdns.org:10000/api/ota/check')
            .then(res => res.json())
            .then(data => {
                console.log('[Live OTA] Server connected:', data);
                if (lobbyLevelBadge) {
                    lobbyLevelBadge.innerHTML = `LVL ${state.currentLevel} • <span class="text-emerald-400 font-bold">OTA</span>`;
                }
            })
            .catch(() => {
                console.log('[Live OTA] Offline or local bundle used');
            });
    }

    function startSplashScreen() {
        checkLiveOTA();
        let progress = 0;
        const interval = setInterval(() => {
            progress += 25;
            splashProgressBar.style.width = `${progress}%`;
            if (progress === 50) splashProgressText.textContent = 'Loading Game Resources...';
            if (progress === 75) splashProgressText.textContent = 'Connecting to Server...';
            if (progress >= 100) {
                clearInterval(interval);
                splashScreen.classList.add('hidden');

                const hasProfile = localStorage.getItem('lodu_king_user_v1');
                if (hasProfile) {
                    showLobbyScreen();
                } else {
                    showAuthScreen();
                }
            }
        }, 160);
    }

    // 2. AUTH SCREEN FLOW
    let selectedAvatarUrl = AVATARS[0].url;

    function showAuthScreen() {
        authScreen.classList.remove('hidden');
        lobbyScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');

        avatarPicker.innerHTML = '';
        AVATARS.forEach((av) => {
            const btn = document.createElement('div');
            btn.className = `p-1 rounded-2xl border-2 cursor-pointer transition transform hover:scale-105 flex items-center justify-center ${av.url === selectedAvatarUrl ? 'border-amber-400 bg-amber-500/20' : 'border-slate-700 bg-slate-900'}`;
            btn.innerHTML = `<img src="${av.url}" class="w-10 h-10 rounded-full">`;
            btn.onclick = () => {
                selectedAvatarUrl = av.url;
                document.querySelectorAll('#avatarPicker > div').forEach(el => {
                    el.className = el.className.replace('border-amber-400 bg-amber-500/20', 'border-slate-700 bg-slate-900');
                });
                btn.className = 'p-1 rounded-2xl border-2 border-amber-400 bg-amber-500/20 cursor-pointer transition transform hover:scale-105 flex items-center justify-center';
            };
            avatarPicker.appendChild(btn);
        });

        playerNameInput.value = state.user.name || 'Player 1';
    }

    function completeAuth() {
        const name = playerNameInput.value.trim() || 'Player 1';
        state.user.name = name;
        state.user.avatar = selectedAvatarUrl;
        saveUserData();

        authScreen.classList.add('hidden');
        showLobbyScreen();
    }

    authPlayGuestBtn.addEventListener('click', completeAuth);
    authGoogleBtn.addEventListener('click', completeAuth);

    // 3. LOBBY FLOW
    function showLobbyScreen() {
        lobbyScreen.classList.remove('hidden');
        authScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');

        lobbyAvatarImg.src = state.user.avatar;
        lobbyPlayerName.textContent = state.user.name;
        lobbyLevelBadge.textContent = `LVL ${state.currentLevel}`;

        updateGlobalBalance();
        if (window.lucide) window.lucide.createIcons();
    }

    function updateGlobalBalance() {
        const bal = window.walletManager.getBalance();
        document.querySelectorAll('.globalBalanceText').forEach(el => {
            el.textContent = bal;
        });
    }

    btnPlayLudoMode.addEventListener('click', () => {
        state.currentMode = 'ludo';
        startMatchInArena();
    });

    btnPlaySnakeMode.addEventListener('click', () => {
        state.currentMode = 'snake';
        startMatchInArena();
    });

    btnOpenWallet.addEventListener('click', () => openWalletModal());
    lobbyWalletBadge.addEventListener('click', () => openWalletModal());
    footerWalletBtn.addEventListener('click', () => openWalletModal());

    btnOpenRules.addEventListener('click', () => {
        rulesModal.classList.remove('hidden');
    });

    closeRulesModal.addEventListener('click', () => {
        rulesModal.classList.add('hidden');
    });

    lobbySoundBtn.addEventListener('click', () => {
        state.soundEnabled = window.audioManager.toggle();
        lobbySoundIcon.setAttribute('data-lucide', state.soundEnabled ? 'volume-2' : 'volume-x');
        if (window.lucide) window.lucide.createIcons();
    });

    // 4. CLEAN ARENA FLOW
    function startMatchInArena() {
        lobbyScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        gameUserAvatar.src = state.user.avatar;

        setTimeout(() => {
            if (state.currentMode === 'ludo') {
                arenaLudoView.classList.remove('hidden');
                arenaSnakeView.classList.add('hidden');
                ludoGame.initCanvas();
                ludoGame.drawBoard();
            } else {
                arenaSnakeView.classList.remove('hidden');
                arenaLudoView.classList.add('hidden');
                snakeGame.initCanvas();
                snakeGame.drawBoard();
            }
        }, 50);

        updateArenaUI();
        switchToPlayerTurn();
    }

    btnBackToLobby.addEventListener('click', () => {
        gameScreen.classList.add('hidden');
        showLobbyScreen();
    });

    function updateArenaUI() {
        const diff = window.AIEngine.getDifficulty(state.currentLevel);

        gameLevelDisplay.textContent = `LEVEL ${state.currentLevel}`;
        gameDiffBadge.textContent = diff.name;
        gameDiffBadge.className = `text-[8px] font-black px-1.5 py-0.2 rounded-full border ${diff.badgeBg} ${diff.color}`;
        gameMatchNumber.textContent = `${state.currentMatchIndex + 1}`;

        let wins = 0;
        let losses = 0;
        arenaMatchDots.innerHTML = '';

        state.matches.forEach((res, idx) => {
            const dot = document.createElement('div');
            dot.className = 'flex-1 h-2 rounded-full flex items-center justify-center transition-all duration-300 ';

            if (res === true) {
                wins++;
                dot.className += 'bg-emerald-500 shadow-md shadow-emerald-500/50';
            } else if (res === false) {
                losses++;
                dot.className += 'bg-rose-500 shadow-md shadow-rose-500/50';
            } else if (idx === state.currentMatchIndex) {
                dot.className += 'bg-amber-400 animate-pulse';
            } else {
                dot.className += 'bg-slate-800 border border-slate-700';
            }
            arenaMatchDots.appendChild(dot);
        });

        arenaWinCount.textContent = wins;
        arenaLossCount.textContent = losses;

        updateGlobalBalance();
        saveUserData();
    }

    // 3D REALISTIC DICE SYSTEM
    function roll3DDice(cubeEl, value, callback) {
        cubeEl.classList.add('rolling-3d');
        window.audioManager.playDiceRoll();

        setTimeout(() => {
            cubeEl.classList.remove('rolling-3d');
            cubeEl.className = `cube-3d show-face-${value}`;
            if (callback) callback();
        }, 500);
    }

    function handleDiceRoll() {
        if (!state.canRoll || !state.isPlayerTurn) return;
        state.canRoll = false;
        rollDiceBtn.disabled = true;

        const diceVal = window.AIEngine.rollDice(false, state.currentLevel, { playerSafeRoll: 6 });
        state.lastDiceValue = diceVal;

        roll3DDice(user3DDice, diceVal, () => {
            if (state.currentMode === 'snake') {
                userTurnHint.textContent = `Rolled ${diceVal}! Moving...`;
                snakeGame.playTurn(diceVal, false, () => {
                    switchToBotTurn();
                });
            } else {
                userTurnHint.textContent = `Rolled ${diceVal}! Select piece`;
                ludoGame.promptPlayerMove(diceVal, (extraTurn) => {
                    if (extraTurn && !ludoGame.isGameOver) {
                        state.canRoll = true;
                        rollDiceBtn.disabled = false;
                        userTurnHint.textContent = 'Rolled 6 or Cut! Extra turn!';
                    } else {
                        switchToBotTurn();
                    }
                });
            }
        });
    }

    // COMPUTER TURN CONTROLLER (NEVER STUCK)
    let botWatchdogTimer = null;

    function switchToBotTurn() {
        state.isPlayerTurn = false;
        userAvatarWrapper.classList.remove('turn-active-ring');
        botAvatarWrapper.classList.add('bot-turn-active-ring');

        userTurnTitle.textContent = 'COMPUTER TURN';
        userTurnTitle.className = 'text-xs font-bold text-red-400 font-["Poppins"]';
        userTurnHint.textContent = 'Computer is thinking...';
        botStatusLabel.textContent = 'Rolling 3D dice...';

        // Clear any old watchdog
        if (botWatchdogTimer) clearTimeout(botWatchdogTimer);

        // Fail-safe global watchdog: if bot takes > 4.5s, force back to player!
        botWatchdogTimer = setTimeout(() => {
            console.warn('[Watchdog] Bot turn timeout, returning turn to player');
            switchToPlayerTurn();
        }, 4500);

        setTimeout(() => {
            executeBotTurn();
        }, 600);
    }

    function executeBotTurn() {
        const diceVal = window.AIEngine.rollDice(true, state.currentLevel, {});
        state.lastDiceValue = diceVal;

        // Roll Computer 3D dice
        roll3DDice(bot3DDice, diceVal, () => {
            botStatusLabel.textContent = `Rolled ${diceVal}!`;

            if (state.currentMode === 'snake') {
                botStatusLabel.textContent = `Moving ${diceVal} steps...`;
                snakeGame.playTurn(diceVal, true, () => {
                    if (botWatchdogTimer) clearTimeout(botWatchdogTimer);
                    switchToPlayerTurn();
                });
            } else {
                // Ludo Mode
                const movable = ludoGame.getMovableTokens(false, diceVal);

                if (movable.length === 0) {
                    botStatusLabel.textContent = `Rolled ${diceVal} (No moves!)`;
                    setTimeout(() => {
                        if (botWatchdogTimer) clearTimeout(botWatchdogTimer);
                        switchToPlayerTurn();
                    }, 650);
                    return;
                }

                // Bot chooses best token
                let chosenId = movable[0];
                for (let id of movable) {
                    if (ludoGame.botTokens[id].pos > ludoGame.botTokens[chosenId].pos) {
                        chosenId = id;
                    }
                }

                botStatusLabel.textContent = `Moving piece...`;
                ludoGame.moveToken(false, chosenId, diceVal, (extraTurn) => {
                    if (botWatchdogTimer) clearTimeout(botWatchdogTimer);

                    if (extraTurn && !ludoGame.isGameOver) {
                        botStatusLabel.textContent = `Rolled 6 or Cut! Extra turn!`;
                        setTimeout(() => executeBotTurn(), 650);
                    } else {
                        setTimeout(() => switchToPlayerTurn(), 350);
                    }
                });
            }
        });
    }

    function switchToPlayerTurn() {
        if (botWatchdogTimer) clearTimeout(botWatchdogTimer);

        state.isPlayerTurn = true;
        state.canRoll = true;
        rollDiceBtn.disabled = false;

        botAvatarWrapper.classList.remove('bot-turn-active-ring');
        userAvatarWrapper.classList.add('turn-active-ring');

        userTurnTitle.innerHTML = `<span>YOUR TURN</span><span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>`;
        userTurnTitle.className = 'text-xs font-black text-emerald-400 font-["Poppins"] flex items-center gap-1';
        userTurnHint.textContent = 'Tap 3D dice to roll';
        botStatusLabel.textContent = 'Waiting turn...';
    }

    rollDiceBtn.addEventListener('click', handleDiceRoll);
    userDiceClickArea.addEventListener('click', handleDiceRoll);

    function triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 90,
                spread: 75,
                origin: { y: 0.6 }
            });
        }
    }

    // MATCH OUTCOME & 8-WIN / 3-LOSS RULES
    function handleMatchOutcome(isWin) {
        if (botWatchdogTimer) clearTimeout(botWatchdogTimer);

        state.matches[state.currentMatchIndex] = isWin;
        updateArenaUI();

        const wins = state.matches.filter(m => m === true).length;
        const losses = state.matches.filter(m => m === false).length;

        resultModal.classList.remove('hidden');
        window.adManager.showVignetteAd();

        if (isWin) {
            triggerConfetti();
            resultIconWrapper.className = 'w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400';
            resultIconWrapper.innerHTML = '<i data-lucide="trophy" class="w-7 h-7"></i>';
            resultTitle.textContent = 'VICTORY! YOU WON! 🏆';
            resultTitle.className = 'text-lg font-black mb-1 text-emerald-400 font-["Poppins"]';
            resultDesc.textContent = `Match ${state.currentMatchIndex + 1} completed! Level score: ${wins}/8 Wins.`;
        } else {
            resultIconWrapper.className = 'w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-lg bg-rose-500/20 border border-rose-500/40 text-rose-400';
            resultIconWrapper.innerHTML = '<i data-lucide="skull" class="w-7 h-7"></i>';
            resultTitle.textContent = 'DEFEAT! COMPUTER WON!';
            resultTitle.className = 'text-lg font-black mb-1 text-rose-400 font-["Poppins"]';
            resultDesc.textContent = `Losses in this level: ${losses}/3. 3 losses resets to Level 1!`;
        }

        if (window.lucide) window.lucide.createIcons();

        // 3 LOSSES = RESET TO LEVEL 1
        if (losses >= 3) {
            resultTitle.textContent = 'LEVEL FAILED! (3 LOSSES)';
            resultDesc.innerHTML = `<span class="text-rose-400 font-bold">You suffered 3 losses! Your run resets to Level 1!</span><br><button id="reviveAdBtn" class="mt-2 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md inline-flex items-center gap-1 font-['Poppins']"><i data-lucide="play-circle" class="w-3.5 h-3.5"></i> Watch Ad to Revive 1 Loss</button>`;
            if (window.lucide) window.lucide.createIcons();

            setTimeout(() => {
                const reviveBtn = document.getElementById('reviveAdBtn');
                if (reviveBtn) {
                    reviveBtn.onclick = () => {
                        window.adManager.showRewardedVideo(() => {
                            state.matches[state.currentMatchIndex] = null;
                            updateArenaUI();
                            resultModal.classList.add('hidden');
                            resetBoardForNextMatch();
                        });
                    };
                }
            }, 100);

            nextMatchBtn.textContent = 'RESET TO LEVEL 1';
            nextMatchBtn.onclick = () => {
                state.currentLevel = 1;
                state.currentMatchIndex = 0;
                state.matches = Array(10).fill(null);
                updateArenaUI();
                resultModal.classList.add('hidden');
                resetBoardForNextMatch();
            };
            return;
        }

        // 8 WINS = LEVEL CLEARED (+20 BDT)
        if (wins >= 8) {
            triggerConfetti();
            window.walletManager.addLevelReward(state.currentLevel);
            resultTitle.textContent = `LEVEL ${state.currentLevel} CLEARED! 👑`;
            resultTitle.className = 'text-lg font-black mb-1 text-amber-300 font-["Poppins"]';
            resultDesc.innerHTML = `Spectacular! You won 8 matches!<br><b class="text-emerald-400 text-sm font-['Poppins']">+20 BDT Added to your Wallet!</b>`;

            nextMatchBtn.textContent = `START LEVEL ${state.currentLevel + 1}`;
            nextMatchBtn.onclick = () => {
                if (state.currentLevel < state.totalLevels) {
                    state.currentLevel++;
                }
                state.currentMatchIndex = 0;
                state.matches = Array(10).fill(null);
                updateArenaUI();
                resultModal.classList.add('hidden');
                resetBoardForNextMatch();
            };
            return;
        }

        // Advance to next match
        nextMatchBtn.textContent = 'PLAY NEXT MATCH';
        nextMatchBtn.onclick = () => {
            state.currentMatchIndex = Math.min(state.currentMatchIndex + 1, 9);
            updateArenaUI();
            resultModal.classList.add('hidden');
            resetBoardForNextMatch();
        };
    }

    function resetBoardForNextMatch() {
        if (botWatchdogTimer) clearTimeout(botWatchdogTimer);
        ludoGame.reset();
        snakeGame.reset();
        switchToPlayerTurn();
        user3DDice.className = 'cube-3d show-face-1';
        bot3DDice.className = 'cube-3d show-face-1';
    }

    // WALLET MODAL ACTIONS
    function openWalletModal() {
        updateGlobalBalance();
        withdrawError.classList.add('hidden');
        withdrawSuccess.classList.add('hidden');
        walletModal.classList.remove('hidden');
    }

    closeWalletModal.addEventListener('click', () => {
        walletModal.classList.add('hidden');
    });

    withdrawForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const method = document.querySelector('input[name="paymentMethod"]:checked').value;
        const amount = parseInt(withdrawAmount.value, 10);
        const account = accountNumber.value;

        const res = window.walletManager.withdraw(amount, method, account);
        if (res.success) {
            withdrawError.classList.add('hidden');
            withdrawSuccess.textContent = res.message;
            withdrawSuccess.classList.remove('hidden');
            updateGlobalBalance();
            withdrawAmount.value = '';
            accountNumber.value = '';
        } else {
            withdrawSuccess.classList.add('hidden');
            withdrawError.textContent = res.message;
            withdrawError.classList.remove('hidden');
        }
    });

    startSplashScreen();
});
