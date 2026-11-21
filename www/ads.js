// Moneytag Advertising Controller (English)
class MoneytagAdManager {
    constructor() {
        this.inPagePushEl = document.getElementById('inPagePushBanner');
        this.inPageCloseBtn = document.getElementById('inPagePushClose');
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
        // Rewarded video revive disabled
        if (typeof onCompleted === 'function') {
            onCompleted();
        }
    }
}

window.adManager = new MoneytagAdManager();
