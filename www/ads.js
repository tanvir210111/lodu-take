// Unity Ads Native Advertising Controller
class UnityAdManager {
    constructor() {
        this.gameId = '800447683';
        this.rewardedPlacement = 'BP_Rewarded_Android';
        this.interstitialPlacement = 'BP_Interstitial_Android';
        this.bannerPlacement = 'BP_Banner_Android';

        this.unityInitialized = false;
        this.isNative = false;

        this.initUnityAds();
    }

    async initUnityAds() {
        // Detect native Capacitor environment
        if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
            this.isNative = true;
        }

        console.log('[UnityAds] Platform check. Native mode:', this.isNative);

        if (this.isNative && window.Capacitor?.Plugins?.Unityads) {
            try {
                console.log('[UnityAds] Initializing Unity Ads with Game ID:', this.gameId);
                await window.Capacitor.Plugins.Unityads.initialize({
                    gameId: this.gameId,
                    testMode: false
                });
                this.unityInitialized = true;
                console.log('[UnityAds] Initialized successfully!');
                
                // Preload video ads
                this.preloadAds();
            } catch (err) {
                console.warn('[UnityAds] Init error:', err);
            }
        }
    }

    async preloadAds() {
        if (this.isNative && window.Capacitor?.Plugins?.Unityads) {
            try {
                await window.Capacitor.Plugins.Unityads.loadRewardedVideo({
                    placementId: this.rewardedPlacement
                });
                console.log('[UnityAds] Preloaded Rewarded Video:', this.rewardedPlacement);
            } catch (e) {
                console.warn('[UnityAds] Preload rewarded warning:', e);
            }

            try {
                await window.Capacitor.Plugins.Unityads.loadInterstitial({
                    placementId: this.interstitialPlacement
                });
                console.log('[UnityAds] Preloaded Interstitial:', this.interstitialPlacement);
            } catch (e) {
                console.warn('[UnityAds] Preload interstitial warning:', e);
            }
        }
    }

    // Rewarded Video: Revive player when losing 3 matches
    async showRewardedVideo(onSuccess, onFailure) {
        console.log('[UnityAds] showRewardedVideo called');
        if (this.isNative && window.Capacitor?.Plugins?.Unityads) {
            try {
                await window.Capacitor.Plugins.Unityads.loadRewardedVideo({
                    placementId: this.rewardedPlacement
                }).catch(() => {});

                const result = await window.Capacitor.Plugins.Unityads.showRewardedVideo();
                console.log('[UnityAds] Rewarded Video result:', result);
                
                if (result && result.success) {
                    if (typeof onSuccess === 'function') onSuccess();
                } else {
                    if (typeof onFailure === 'function') onFailure();
                }

                // Preload next ad
                setTimeout(() => this.preloadAds(), 2000);
                return;
            } catch (err) {
                console.error('[UnityAds] Rewarded show error:', err);
                if (typeof onSuccess === 'function') onSuccess();
                return;
            }
        }

        // Web / fallback behavior
        console.log('[UnityAds] Web fallback: reward granted');
        if (typeof onSuccess === 'function') {
            onSuccess();
        }
    }

    // Interstitial Ad: after match ends
    async showInterstitialAd(onClosed) {
        console.log('[UnityAds] showInterstitialAd called');
        if (this.isNative && window.Capacitor?.Plugins?.Unityads) {
            try {
                await window.Capacitor.Plugins.Unityads.loadInterstitial({
                    placementId: this.interstitialPlacement
                }).catch(() => {});

                await window.Capacitor.Plugins.Unityads.showInterstitial();
                console.log('[UnityAds] Interstitial Shown');
                setTimeout(() => this.preloadAds(), 2000);
            } catch (err) {
                console.warn('[UnityAds] Interstitial error:', err);
            }
        }

        if (typeof onClosed === 'function') {
            onClosed();
        }
    }

    // Alias for backwards compatibility
    showVignetteAd(onClosed) {
        return this.showInterstitialAd(onClosed);
    }
}

window.adManager = new UnityAdManager();
