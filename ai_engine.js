// AI Engine & Dynamic Difficulty Controller (English)
class AIEngine {
    static getDifficulty(level) {
        if (level <= 2) {
            return {
                name: 'EASY',
                label: 'Easy',
                color: 'text-emerald-400',
                badgeBg: 'bg-emerald-500/20 border-emerald-500/30',
                biasChance: 0.0,
                playerAdvantage: 0.20,
                smartMove: false
            };
        } else if (level <= 4) {
            return {
                name: 'MEDIUM',
                label: 'Medium',
                color: 'text-blue-400',
                badgeBg: 'bg-blue-500/20 border-blue-500/30',
                biasChance: 0.05,
                playerAdvantage: 0.0,
                smartMove: true
            };
        } else if (level <= 6) {
            return {
                name: 'HARD',
                label: 'Hard',
                color: 'text-amber-400',
                badgeBg: 'bg-amber-500/20 border-amber-500/30',
                biasChance: 0.25,
                playerAdvantage: -0.10,
                smartMove: true
            };
        } else if (level <= 8) {
            return {
                name: 'EXTREME',
                label: 'Extreme',
                color: 'text-orange-400',
                badgeBg: 'bg-orange-500/20 border-orange-500/30',
                biasChance: 0.45,
                playerAdvantage: -0.25,
                smartMove: true
            };
        } else {
            return {
                name: 'NEVER-WON',
                label: 'Never-Won (Rigged)',
                color: 'text-rose-500',
                badgeBg: 'bg-rose-500/20 border-rose-500/40',
                biasChance: 0.75,
                playerAdvantage: -0.50,
                smartMove: true
            };
        }
    }

    static rollDice(isBot, level, context = {}) {
        const diff = this.getDifficulty(level);
        const { botIdealRoll, playerTrapRoll, playerSafeRoll } = context;

        if (isBot) {
            if (Math.random() < diff.biasChance && botIdealRoll && botIdealRoll >= 1 && botIdealRoll <= 6) {
                return botIdealRoll;
            }
            if (level >= 5 && Math.random() < 0.35) {
                return Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
            }
            return Math.floor(Math.random() * 6) + 1;
        } else {
            if (diff.playerAdvantage > 0) {
                if (Math.random() < diff.playerAdvantage && playerSafeRoll) {
                    return playerSafeRoll;
                }
            } else if (diff.playerAdvantage < 0) {
                if (Math.random() < Math.abs(diff.playerAdvantage) && playerTrapRoll) {
                    return playerTrapRoll;
                }
            }
            return Math.floor(Math.random() * 6) + 1;
        }
    }
}

window.AIEngine = AIEngine;
