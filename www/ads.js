// Start.io Pure Native Advertising Controller (App ID: 210830571)
class StartAppAdManager {
    constructor() {
        this.appId = '210830571';
        this.initialized = false;

        // Auto-initialize when ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.initSdk();
        } else {
            document.addEventListener('DOMContentLoaded', () => this.initSdk());
        }
    }

    isNativeApp() {
        if (typeof window !== 'undefined' && window.Capacitor) {
            if (typeof window.Capacitor.isNativePlatform === 'function') {
                return window.Capacitor.isNativePlatform();
            }
            if (typeof window.Capacitor.getPlatform === 'function') {
                return window.Capacitor.getPlatform() !== 'web';
            }
        }
        return false;
    }

    getPlugin() {
        return window.Capacitor?.Plugins?.StartAppAds || null;
    }

    async initSdk() {
        if (!this.isNativeApp()) {
            console.log('[Start.io] Running on Web. Native SDK unavailable.');
            return;
        }

        const plugin = this.getPlugin();
        if (!plugin) {
            console.warn('[Start.io] Plugin injecting, retrying in 500ms...');
            setTimeout(() => this.initSdk(), 500);
            return;
        }

        try {
            console.log(`[Start.io] Initializing Start.io SDK with App ID: ${this.appId}...`);
            await plugin.init({ appId: this.appId, testMode: true });
            this.initialized = true;
            console.log('[Start.io] Start.io SDK initialized successfully!');
        } catch (e) {
            console.warn('[Start.io] Init error:', e);
        }
    }

    async showRewardedVideo(onSuccess, onFailure) {
        if (!this.isNativeApp()) {
            alert('Notice: Start.io Video Ads run natively inside the Android APK app on your mobile phone.');
            if (typeof onFailure === 'function') onFailure();
            return;
        }

        const plugin = this.getPlugin();
        if (!plugin) {
            alert('বিজ্ঞাপন ইঞ্জিন লোড হচ্ছে। অনুগ্রহ করে ২ সেকেন্ড পর আবার চেষ্টা করুন।');
            this.initSdk();
            if (typeof onFailure === 'function') onFailure();
            return;
        }

        // Show visual loading overlay with cancel button
        const overlay = document.createElement('div');
        overlay.id = 'adBufferOverlay';
        overlay.className = 'fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-6 text-center';
        overlay.innerHTML = `
            <button id="btnCancelAdBuffer" type="button" class="absolute top-6 right-6 w-11 h-11 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center active:scale-95 hover:bg-slate-700">✕</button>
            <div class="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div class="text-base font-black text-white font-['Poppins']">Connecting to Start.io Server...</div>
            <div id="adBufferSubtext" class="text-xs text-amber-300 mt-1.5 font-medium">Downloading Video Stream...</div>
            <div class="text-[11px] text-slate-400 mt-4 max-w-xs">ক্যানসেল করতে উপরের ✕ বাটনে চাপুন</div>
        `;
        document.body.appendChild(overlay);

        let isCancelled = false;
        const closeOverlay = () => {
            const el = document.getElementById('adBufferOverlay');
            if (el) el.remove();
        };

        const cancelBtn = document.getElementById('btnCancelAdBuffer');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                isCancelled = true;
                closeOverlay();
                console.log('[Start.io] User cancelled loading.');
                if (typeof onFailure === 'function') onFailure();
            });
        }

        const updateStatus = (msg) => {
            const subtext = document.getElementById('adBufferSubtext');
            if (subtext) subtext.textContent = msg;
        };

        const withTimeout = (promise, ms, errorMsg) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
            ]);
        };

        // 1. Check if already preloaded and ready
        let adReady = false;
        try {
            const check = await plugin.isReady();
            if (check && check.ready) {
                console.log('[Start.io] Rewarded Video already preloaded and ready!');
                adReady = true;
            }
        } catch (e) {
            console.log('[Start.io] Readiness check:', e);
        }

        // 2. If not ready, load with 10s timeout
        if (!adReady) {
            updateStatus('Requesting Rewarded Video...');
            try {
                await withTimeout(
                    plugin.loadRewardedVideo(),
                    10000,
                    'Ad server request timed out'
                );
                adReady = true;
            } catch (err) {
                console.warn('[Start.io] Load error:', err);
            }
        }

        if (isCancelled) return;

        if (!adReady) {
            closeOverlay();
            alert('বিজ্ঞাপন এই মুহূর্তে লোড করা যায়নি (No Fill)। অনুগ্রহ করে ইন্টারনেট চেক করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
            if (typeof onFailure === 'function') onFailure();
            return;
        }

        // 3. Ad is ready! Display video
        updateStatus('Opening Fullscreen Video Ad...');
        try {
            await new Promise(r => setTimeout(r, 300));
            closeOverlay();

            const result = await plugin.showRewardedVideo();
            console.log('[Start.io] Video ad result:', result);

            if (result && result.success) {
                if (typeof onSuccess === 'function') onSuccess();
            } else {
                if (typeof onFailure === 'function') onFailure();
            }
        } catch (showErr) {
            closeOverlay();
            console.error('[Start.io] Show error:', showErr);
            alert('বিজ্ঞাপন চালু হতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।');
            if (typeof onFailure === 'function') onFailure();
        }
    }

    async showInterstitialAd(onClosed) {
        if (!this.isNativeApp()) {
            if (typeof onClosed === 'function') onClosed();
            return;
        }

        const plugin = this.getPlugin();
        if (plugin) {
            try {
                await plugin.showInterstitial();
            } catch (e) {
                console.warn('[Start.io] Interstitial note:', e);
            }
        }

        if (typeof onClosed === 'function') onClosed();
    }

    showVignetteAd(onClosed) {
        return this.showInterstitialAd(onClosed);
    }
}

window.adManager = new StartAppAdManager();
