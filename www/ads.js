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

        // Show visual loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'adBufferOverlay';
        overlay.className = 'fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-5 text-center';
        overlay.innerHTML = `
            <div class="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div class="text-base font-black text-white font-['Poppins']">Connecting to Unity Ads Server...</div>
            <div id="adBufferSubtext" class="text-xs text-amber-300 mt-1.5 font-medium">Downloading Video Stream...</div>
        `;
        document.body.appendChild(overlay);

        const closeOverlay = () => {
            const el = document.getElementById('adBufferOverlay');
            if (el) el.remove();
        };

        const updateStatus = (msg) => {
            const subtext = document.getElementById('adBufferSubtext');
            if (subtext) subtext.textContent = msg;
        };

        // Ensure initialized
        if (!this.initialized) {
            updateStatus('Connecting to Ad Server...');
            try {
                await plugin.initialize({ gameId: this.gameId, testMode: false });
                this.initialized = true;
            } catch (initErr) {
                closeOverlay();
                const errStr = initErr?.message || JSON.stringify(initErr);
                alert(`Ad Server Error:\n${errStr}\n\nPlease check your internet connection.`);
                if (typeof onFailure === 'function') onFailure();
                return;
            }
        }

        // 1. Check if already loaded in cache
        try {
            const check = await plugin.isRewardedVideoLoaded();
            if (check && check.loaded) {
                console.log('[UnityAds] Video ad already preloaded and ready in cache!');
                adReady = true;
            }
        } catch (e) {
            console.log('[UnityAds] Preload check:', e);
        }

        // 2. If not already loaded, fetch placement
        const candidatePlacements = [this.rewardedPlacement];
        const placementErrors = [];
        if (!adReady) {
            for (const placement of candidatePlacements) {
                updateStatus(`Requesting video (${placement})...`);
                console.log(`[UnityAds] Trying to load placement: ${placement}...`);

                try {
                    // Await native load
                    await plugin.loadRewardedVideo({ placementId: placement });
                    console.log(`[UnityAds] Placement ${placement} loaded successfully!`);
                    adReady = true;
                    break;
                } catch (loadErr) {
                    const msg = loadErr?.message || JSON.stringify(loadErr) || 'No Fill / Request Rejected';
                    console.warn(`[UnityAds] Placement ${placement} load rejected:`, msg);
                    placementErrors.push(`${placement}: ${msg}`);
                }
            }
        }

        if (!adReady) {
            closeOverlay();
            const reason = placementErrors.join('\n');
            alert(`ভিডিও বিজ্ঞাপন লোড হতে পারেনি:\n${reason}\n\nপরামর্শ:\n1. ইউনিটি ড্যাশবোর্ডে Test Mode অফ/লাইভ করা থাকলে রিয়েল বিজ্ঞাপন কিছুটা সময় নিতে পারে।\n2. ইন্টারনেট সংযোগ চেক করে কিছুক্ষণ পর আবার চেষ্টা করুন।`);
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
