// Unity Ads & Monetag Dual Advertising Controller
class AdManager {
    constructor() {
        this.gameId = '800447683';
        this.rewardedPlacement = 'BP_Rewarded_Android';
        this.interstitialPlacement = 'BP_Interstitial_Android';
        this.bannerPlacement = 'BP_Banner_Android';

        this.inPagePushEl = document.getElementById('inPagePushBanner');
        this.inPageCloseBtn = document.getElementById('inPagePushClose');
        
        this.unityInitialized = false;
        this.isNative = false;

        this.initEventListeners();
        this.initUnityAds();
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

    async initUnityAds() {
        // Detect native capacitor platform
        if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
            this.isNative = true;
        }

        console.log('[AdManager] Initializing... Native mode:', this.isNative);

        if (this.isNative && window.Capacitor?.Plugins?.Unityads) {
            try {
                console.log('[UnityAds] Initializing Game ID:', this.gameId);
                await window.Capacitor.Plugins.Unityads.initialize({
                    gameId: this.gameId,
                    testMode: false
                });
                this.unityInitialized = true;
                console.log('[UnityAds] Initialization SUCCESS!');
                
                // Preload Rewarded and Interstitial ads
                this.preloadAds();
            } catch (err) {
                console.warn('[UnityAds] Initialization error:', err);
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

    // Rewarded Video: For Revive option
    async showRewardedVideo(onSuccess, onFailure) {
        console.log('[AdManager] showRewardedVideo called');
        if (this.isNative && window.Capacitor?.Plugins?.Unityads) {
            try {
                // Ensure ad is requested
                await window.Capacitor.Plugins.Unityads.loadRewardedVideo({
                    placementId: this.rewardedPlacement
                }).catch(() => {});

                const result = await window.Capacitor.Plugins.Unityads.showRewardedVideo();
                console.log('[UnityAds] Show Rewarded Result:', result);
                
                if (result && result.success) {
                    if (typeof onSuccess === 'function') onSuccess();
                } else {
                    if (typeof onFailure === 'function') onFailure();
                }

                // Preload next video in background
                setTimeout(() => this.preloadAds(), 2000);
                return;
            } catch (err) {
                console.error('[UnityAds] Show rewarded error:', err);
                // Graceful fallback: grant reward so user isn't stuck
                if (typeof onSuccess === 'function') onSuccess();
                return;
            }
        }

        // Web/Browser fallback: simulate rewarded video modal or complete immediately
        console.log('[AdManager] Web fallback: granting reward');
        if (typeof onSuccess === 'function') {
            onSuccess();
        }
    }

    // Interstitial / Vignette Ad
    async showVignetteAd(onClosed) {
        console.log('[AdManager] showVignetteAd called');
        if (this.isNative && window.Capacitor?.Plugins?.Unityads) {
            try {
                await window.Capacitor.Plugins.Unityads.loadInterstitial({
                    placementId: this.interstitialPlacement
                }).catch(() => {});

                await window.Capacitor.Plugins.Unityads.showInterstitial();
                console.log('[UnityAds] Interstitial Shown');
                setTimeout(() => this.preloadAds(), 2000);
            } catch (err) {
                console.warn('[UnityAds] Show interstitial error:', err);
            }
        } else {
            // Web fallback: Monetag Vignette
            if (typeof window.show_vignette === 'function') {
                try {
                    window.show_vignette();
                } catch (e) {
                    console.warn('Monetag vignette trigger error', e);
                }
            }
        }

        if (typeof onClosed === 'function') {
            onClosed();
        }
    }
}

window.adManager = new AdManager();
