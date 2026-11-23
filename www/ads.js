// Start.io & Unity Ads Dual Hybrid Advertising Controller
class AdManager {
    constructor() {
        this.startAppId = '210830571';
        this.unityGameId = '800447683';
        this.unityPlacement = 'BP_Rewarded_Android';

        this.initialized = false;
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

    getStartAppPlugin() {
        return window.Capacitor?.Plugins?.StartAppAds || null;
    }

    getUnityPlugin() {
        return window.Capacitor?.Plugins?.Unityads || null;
    }

    async initSdk() {
        if (!this.isNativeApp()) return;

        // Initialize Start.io (Primary live ads for standalone APK)
        const startApp = this.getStartAppPlugin();
        if (startApp) {
            try {
                await startApp.init({ appId: this.startAppId });
                console.log('[AdManager] Start.io initialized with App ID:', this.startAppId);
            } catch (e) {
                console.warn('[AdManager] Start.io init note:', e);
            }
        }

        // Initialize Unity Ads
        const unity = this.getUnityPlugin();
        if (unity) {
            try {
                await unity.initialize({ gameId: this.unityGameId, testMode: false });
                console.log('[AdManager] Unity Ads initialized');
            } catch (e) {
                console.warn('[AdManager] Unity Ads init note:', e);
            }
        }

        this.initialized = true;
    }

    async showRewardedVideo(onSuccess, onFailure) {
        if (!this.isNativeApp()) {
            alert('Notice: Video Ads run inside the Android APK app on your mobile phone.');
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
            <div class="text-base font-black text-white font-['Poppins']">Connecting to Ad Server...</div>
            <div id="adBufferSubtext" class="text-xs text-amber-300 mt-1.5 font-medium">Loading Rewarded Video...</div>
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

        // Try Start.io First (Works on APK without Google Play Store!)
        const startApp = this.getStartAppPlugin();
        if (startApp) {
            updateStatus('Loading Start.io Video Ad...');
            try {
                await withTimeout(startApp.loadRewardedVideo(), 10000, 'Start.io Timeout');
                if (isCancelled) return;

                closeOverlay();
                console.log('[AdManager] Displaying Start.io Rewarded Video...');
                const res = await startApp.showRewardedVideo();
                if (res && res.success) {
                    if (typeof onSuccess === 'function') onSuccess();
                    return;
                }
            } catch (startErr) {
                console.warn('[AdManager] Start.io attempt rejected, trying Unity fallback:', startErr);
            }
        }

        if (isCancelled) return;

        // Fallback to Unity Ads
        const unity = this.getUnityPlugin();
        if (unity) {
            updateStatus('Loading Unity Ads Stream...');
            try {
                await withTimeout(unity.loadRewardedVideo({ placementId: this.unityPlacement }), 8000, 'Unity Ads Timeout');
                if (isCancelled) return;

                closeOverlay();
                const res = await unity.showRewardedVideo();
                if (res && res.success) {
                    if (typeof onSuccess === 'function') onSuccess();
                    return;
                }
            } catch (unityErr) {
                console.warn('[AdManager] Unity Ads fallback failed:', unityErr);
            }
        }

        closeOverlay();
        if (!isCancelled) {
            alert('বিজ্ঞাপন এই মুহূর্তে লোড করা যায়নি (No Fill)। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
            if (typeof onFailure === 'function') onFailure();
        }
    }

    async showInterstitialAd(onClosed) {
        if (!this.isNativeApp()) {
            if (typeof onClosed === 'function') onClosed();
            return;
        }

        const startApp = this.getStartAppPlugin();
        if (startApp) {
            try {
                await startApp.showInterstitial();
            } catch (e) {
                console.warn('[AdManager] Interstitial note:', e);
            }
        }
        if (typeof onClosed === 'function') onClosed();
    }

    showVignetteAd(onClosed) {
        return this.showInterstitialAd(onClosed);
    }
}

window.adManager = new AdManager();
