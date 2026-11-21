// Unity Ads Native Advertising Controller
class UnityAdManager {
    constructor() {
        this.gameId = '800447683';
        this.rewardedPlacement = 'BP_Rewarded_Android';
        this.interstitialPlacement = 'BP_Interstitial_Android';
        this.bannerPlacement = 'BP_Banner_Android';

        this.initialized = false;
        this.isLoadingAd = false;

        // Initialize as soon as DOM or Capacitor is ready
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
            console.log('[UnityAds] Running on Web Browser. Native SDK unavailable.');
            return;
        }

        const plugin = this.getPlugin();
        if (!plugin) {
            console.warn('[UnityAds] Plugin not yet available, retrying in 1s...');
            setTimeout(() => this.initSdk(), 1000);
            return;
        }

        try {
            console.log('[UnityAds] Initializing native Unity Ads SDK (Game ID:', this.gameId, ')...');
            await plugin.initialize({
                gameId: this.gameId,
                testMode: true // Enables instant video ad delivery on unlisted apps
            });
            this.initialized = true;
            console.log('[UnityAds] Initialization complete!');
            
            // Preload video ads immediately
            this.preloadRewarded();
            this.preloadInterstitial();
        } catch (err) {
            console.error('[UnityAds] Initialization error:', err);
        }
    }

    async preloadRewarded() {
        const plugin = this.getPlugin();
        if (!plugin || !this.isNativeApp()) return;

        try {
            console.log('[UnityAds] Preloading Rewarded Video...');
            await plugin.loadRewardedVideo({
                placementId: this.rewardedPlacement
            });
            console.log('[UnityAds] Rewarded Video preloaded and ready!');
        } catch (err) {
            console.warn('[UnityAds] Preload rewarded warning:', err);
        }
    }

    async preloadInterstitial() {
        const plugin = this.getPlugin();
        if (!plugin || !this.isNativeApp()) return;

        try {
            console.log('[UnityAds] Preloading Interstitial...');
            await plugin.loadInterstitial({
                placementId: this.interstitialPlacement
            });
            console.log('[UnityAds] Interstitial preloaded and ready!');
        } catch (err) {
            console.warn('[UnityAds] Preload interstitial warning:', err);
        }
    }

    // Rewarded Video: Revive or Bonus Coins
    async showRewardedVideo(onSuccess, onFailure) {
        if (!this.isNativeApp()) {
            alert('Notice: Unity Video Ads only play inside the Android APK app.\nPlease download and open the APK on your phone.');
            return;
        }

        const plugin = this.getPlugin();
        if (!plugin) {
            alert('Ad SDK initializing... Please wait 5 seconds and try again.');
            this.initSdk();
            return;
        }

        // Show visual loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'adBufferOverlay';
        overlay.className = 'fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-center p-4 text-center';
        overlay.innerHTML = `
            <div class="w-14 h-14 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <div class="text-base font-black text-white font-['Poppins']">Connecting to Unity Ads...</div>
            <div id="adBufferSubtext" class="text-xs text-amber-300 mt-1">Downloading HD Video Stream...</div>
        `;
        document.body.appendChild(overlay);

        const closeOverlay = () => {
            const el = document.getElementById('adBufferOverlay');
            if (el) el.remove();
        };

        try {
            // Check if already loaded
            let check = await plugin.isRewardedVideoLoaded().catch(() => ({ loaded: false }));
            
            // If not loaded yet, initiate load and wait up to 6 seconds
            if (!check || !check.loaded) {
                console.log('[UnityAds] Ad not cached yet, requesting load...');
                plugin.loadRewardedVideo({ placementId: this.rewardedPlacement }).catch(() => {});

                const subtext = document.getElementById('adBufferSubtext');
                for (let i = 0; i < 10; i++) {
                    await new Promise(r => setTimeout(r, 600));
                    if (subtext) subtext.textContent = `Buffering Video (${Math.min(90, (i + 1) * 12)}%)...`;
                    check = await plugin.isRewardedVideoLoaded().catch(() => ({ loaded: false }));
                    if (check && check.loaded) {
                        console.log('[UnityAds] Video ready after buffering!');
                        break;
                    }
                }
            }

            closeOverlay();

            // Show the actual Unity Rewarded Video
            console.log('[UnityAds] Triggering showRewardedVideo...');
            const res = await plugin.showRewardedVideo();
            console.log('[UnityAds] Rewarded Video completed:', res);

            if (res && res.success) {
                if (typeof onSuccess === 'function') onSuccess();
            } else {
                if (typeof onFailure === 'function') onFailure();
            }

            // Immediately preload the next video
            setTimeout(() => this.preloadRewarded(), 1500);

        } catch (err) {
            closeOverlay();
            console.error('[UnityAds] Failed to display video ad:', err);
            alert('Unity Video Ad is still buffering from the server or no network available. Please check your internet connection and try again in a few moments.');
            if (typeof onFailure === 'function') onFailure();
            setTimeout(() => this.preloadRewarded(), 2000);
        }
    }

    // Interstitial Ad
    async showInterstitialAd(onClosed) {
        if (!this.isNativeApp()) {
            if (typeof onClosed === 'function') onClosed();
            return;
        }

        const plugin = this.getPlugin();
        if (!plugin) {
            if (typeof onClosed === 'function') onClosed();
            return;
        }

        try {
            const check = await plugin.isInterstitialLoaded().catch(() => ({ loaded: false }));
            if (check && check.loaded) {
                await plugin.showInterstitial();
                setTimeout(() => this.preloadInterstitial(), 2000);
            } else {
                this.preloadInterstitial();
            }
        } catch (err) {
            console.warn('[UnityAds] Interstitial warning:', err);
        }

        if (typeof onClosed === 'function') onClosed();
    }

    showVignetteAd(onClosed) {
        return this.showInterstitialAd(onClosed);
    }
}

window.adManager = new UnityAdManager();
