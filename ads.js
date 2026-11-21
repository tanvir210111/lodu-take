// Moneytag Advertising Controller (English)
class MoneytagAdManager {
    constructor() {
        this.inPagePushEl = document.getElementById('inPagePushBanner');
        this.inPageCloseBtn = document.getElementById('inPagePushClose');
        this.rewardedModal = document.getElementById('rewardedVideoModal');
        this.adCountdownEl = document.getElementById('adCountdown');
        this.skipAdBtn = document.getElementById('skipAdBtn');

        this.initEventListeners();
    }

    initEventListeners() {
        if (this.inPageCloseBtn && this.inPagePushEl) {
            this.inPageCloseBtn.addEventListener('click', () => {
                this.inPagePushEl.style.display = 'none';
                setTimeout(() => {
                    this.inPagePushEl.style.display = 'flex';
                }, 40000);
            });
        }
    }

    showVignetteAd(onClosed) {
        console.log('[Moneytag] Triggering Vignette Interstitial Ad');
        if (typeof window.show_vignette === 'function') {
            try {
                window.show_vignette();
            } catch (e) {
                console.warn('Moneytag vignette trigger', e);
            }
        }
        if (typeof onClosed === 'function') {
            onClosed();
        }
    }

    showRewardedVideo(onCompleted) {
        if (!this.rewardedModal) return;

        this.rewardedModal.classList.remove('hidden');
        let timeLeft = 5;
        this.adCountdownEl.textContent = timeLeft;
        this.skipAdBtn.disabled = true;
        this.skipAdBtn.textContent = `Ad playing... (${timeLeft}s)`;
        this.skipAdBtn.className = 'w-full py-2.5 rounded-xl bg-slate-700 text-slate-400 font-bold text-xs cursor-not-allowed font-["Poppins"]';

        const timer = setInterval(() => {
            timeLeft--;
            this.adCountdownEl.textContent = timeLeft;
            this.skipAdBtn.textContent = `Ad playing... (${timeLeft}s)`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                this.skipAdBtn.disabled = false;
                this.skipAdBtn.textContent = 'Claim Revive Reward & Return';
                this.skipAdBtn.className = 'w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg font-["Poppins"]';

                this.skipAdBtn.onclick = () => {
                    this.rewardedModal.classList.add('hidden');
                    if (typeof onCompleted === 'function') {
                        onCompleted();
                    }
                };
            }
        }, 1000);
    }
}

window.adManager = new MoneytagAdManager();
