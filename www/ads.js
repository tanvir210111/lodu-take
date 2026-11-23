// Unity Ads Native Advertising Controller with Real-time Diagnostics
class UnityAdManager {
    constructor() {
        this.gameId = '800447683';
        this.rewardedPlacement = 'BP_Rewarded_Android';
        this.interstitialPlacement = 'BP_Interstitial_Android';
        this.bannerPlacement = 'BP_Banner_Android';

        this.initialized = false;
        this.initError = null;
        this.isBuffering = false;

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
        return window.Capacitor?.Plugins?.Unityads || null;
    }

    async initSdk() {
        if (!this.isNativeApp()) {
            console.log('[UnityAds] Web environment detected. Native SDK not available.');
            return;
        }

        const plugin = this.getPlugin();
        if (!plugin) {
            console.warn('[UnityAds] Plugin not yet injected, retrying in 800ms...');
            setTimeout(() => this.initSdk(), 800);
            return;
        }

        try {
            console.log(`[UnityAds] Initializing Unity Ads SDK with Game ID: ${this.gameId} (Production Live Ads Mode)...`);
            await plugin.initialize({
                gameId: this.gameId,
                testMode: false // Live production ads for all real users
            });
            this.initialized = true;
            this.initError = null;
            console.log('[UnityAds] Unity Ads SDK successfully initialized in Production Mode!');

            // Preload video ads in advance
            this.preload();
        } catch (err) {
            this.initialized = false;
            this.initError = err?.message || JSON.stringify(err);
            console.error('[UnityAds] Initialization Error:', this.initError);
        }
    }

    async preload() {
        const plugin = this.getPlugin();
        if (!plugin || !this.isNativeApp() || !this.initialized) return;

        try {
            await plugin.loadRewardedVideo({ placementId: this.rewardedPlacement });
            console.log(`[UnityAds] Rewarded Video (${this.rewardedPlacement}) preloaded.`);
        } catch (e) {
            console.warn('[UnityAds] Preload warning:', e);
        }
    }

    // Rewarded Video: For Revive or +5 BDT Bonus
    async showRewardedVideo(onSuccess, onFailure) {
        if (!this.isNativeApp()) {
            alert('Notice: Unity Video Ads only run natively inside the Android APK app on your mobile phone.\nPlease open the downloaded app on Android.');
            if (typeof onFailure === 'function') onFailure();
            return;
        }

        const plugin = this.getPlugin();
        if (!plugin) {
            alert('Unity Ads plugin is initializing. Please wait a few seconds and try again.');
            this.initSdk();
            if (typeof onFailure === 'function') onFailure();
            return;
        }

        // Helper for timing out slow native calls
        const withTimeout = (promise, ms, errorMsg) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
            ]);
        };

        // Show visual loading overlay with cancel button
        const overlay = document.createElement('div');
        overlay.id = 'adBufferOverlay';
        overlay.className = 'fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-6 text-center';
        overlay.innerHTML = `
            <button id="btnCancelAdBuffer" type="button" class="absolute top-6 right-6 w-11 h-11 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 font-bold text-xl flex items-center justify-center active:scale-95 hover:bg-slate-700">✕</button>
            <div class="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div class="text-base font-black text-white font-['Poppins']">Connecting to Unity Ads Server...</div>
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
                console.log('[UnityAds] User cancelled loading.');
                if (typeof onFailure === 'function') onFailure();
            });
        }

        const updateStatus = (msg) => {
            const subtext = document.getElementById('adBufferSubtext');
            if (subtext) subtext.textContent = msg;
        };

        // Ensure initialized
        if (!this.initialized) {
            updateStatus('Connecting to Ad Server...');
            try {
                await withTimeout(
                    plugin.initialize({ gameId: this.gameId, testMode: false }),
                    8000,
                    'Server initialization timed out'
                );
                this.initialized = true;
            } catch (initErr) {
                closeOverlay();
                const errStr = initErr?.message || JSON.stringify(initErr);
                alert(`Ad Server Error:\n${errStr}\n\nPlease check your internet connection.`);
                if (typeof onFailure === 'function') onFailure();
                return;
            }
        }

        if (isCancelled) return;

        // 1. Check if already loaded in cache
        try {
            const check = await withTimeout(plugin.isRewardedVideoLoaded(), 3000, 'Check timeout');
            if (check && check.loaded) {
                console.log('[UnityAds] Video ad already preloaded and ready in cache!');
                adReady = true;
            }
        } catch (e) {
            console.log('[UnityAds] Preload check:', e);
        }

        if (isCancelled) return;

        // 2. If not already loaded, fetch placement with a strict 10s timeout
        const candidatePlacements = [this.rewardedPlacement];
        const placementErrors = [];
        if (!adReady) {
            for (const placement of candidatePlacements) {
                updateStatus(`Requesting video (${placement})...`);
                console.log(`[UnityAds] Trying to load placement: ${placement}...`);

                try {
                    // Await native load with 10s timeout
                    await withTimeout(
                        plugin.loadRewardedVideo({ placementId: placement }),
                        10000,
                        'বিজ্ঞাপন লোড হতে অতিরিক্ত সময় নিয়েছে (Timeout)। নেটওয়ার্কে কোনো বিজ্ঞাপন পাওয়া যায়নি (No Fill)।'
                    );
                    console.log(`[UnityAds] Placement ${placement} loaded successfully!`);
                    adReady = true;
                    break;
                } catch (loadErr) {
                    const msg = loadErr?.message || JSON.stringify(loadErr) || 'No Fill';
                    console.warn(`[UnityAds] Placement ${placement} load rejected:`, msg);
                    placementErrors.push(`${placement}: ${msg}`);
                }
            }
        }

        if (isCancelled) return;

        if (!adReady) {
            closeOverlay();
            const reason = placementErrors.join('\n');
            alert(`বিজ্ঞাপন এই মুহূর্তে লোড করা যায়নি:\n\n${reason}\n\nকারণ:\nঅ্যাপটি Google Play Store এ লাইভ না থাকায় বিজ্ঞাপনদাতাদের আসল (Real) বিজ্ঞাপন সবসময় পাওয়া যায় না (No Fill)।\n\nসমাধান:\nসবাইকে নিশ্চিত বিজ্ঞাপন দেখাতে Unity Cloud ড্যাশবোর্ডে "Force test mode ON for all devices" সিলেক্ট করে Save করুন।`);
            if (typeof onFailure === 'function') onFailure();
            return;
        }

        // Ad is ready! Show video
        updateStatus('Opening Fullscreen Video Ad...');
        try {
            await new Promise(r => setTimeout(r, 400));
            closeOverlay();

            const result = await plugin.showRewardedVideo();
            console.log('[UnityAds] Video playback completed:', result);

            if (result && result.success) {
                if (typeof onSuccess === 'function') onSuccess();
            } else {
                if (typeof onFailure === 'function') onFailure();
            }

            // Preload next video in background
            setTimeout(() => this.preload(), 1500);

        } catch (showErr) {
            closeOverlay();
            console.error('[UnityAds] Error during showRewardedVideo:', showErr);
            const errDetails = showErr?.message || JSON.stringify(showErr);
            alert(`Unity Video Playback Error:\n${errDetails}`);
            if (typeof onFailure === 'function') onFailure();
        }
    }

    // Interstitial Ad
    async showInterstitialAd(onClosed) {
        if (!this.isNativeApp()) {
            if (typeof onClosed === 'function') onClosed();
            return;
        }

        const plugin = this.getPlugin();
        if (!plugin || !this.initialized) {
            if (typeof onClosed === 'function') onClosed();
            return;
        }

        const candidatePlacements = [this.interstitialPlacement];
        for (const placement of candidatePlacements) {
            try {
                await plugin.loadInterstitial({ placementId: placement });
                await plugin.showInterstitial();
                console.log(`[UnityAds] Interstitial ${placement} shown.`);
                break;
            } catch (e) {
                console.warn(`[UnityAds] Interstitial ${placement} warning:`, e);
            }
        }

        if (typeof onClosed === 'function') onClosed();
    }

    showVignetteAd(onClosed) {
        return this.showInterstitialAd(onClosed);
    }
}

window.adManager = new UnityAdManager();
