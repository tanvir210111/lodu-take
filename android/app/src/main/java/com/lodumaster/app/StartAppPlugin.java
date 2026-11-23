package com.lodumaster.app;

import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.startapp.sdk.adsbase.Ad;
import com.startapp.sdk.adsbase.StartAppAd;
import com.startapp.sdk.adsbase.StartAppSDK;
import com.startapp.sdk.adsbase.adlisteners.AdDisplayListener;
import com.startapp.sdk.adsbase.adlisteners.AdEventListener;
import com.startapp.sdk.adsbase.adlisteners.VideoListener;

@CapacitorPlugin(name = "StartAppAds")
public class StartAppPlugin extends Plugin {
    private static final String TAG = "StartAppAds";
    private StartAppAd rewardedAd;
    private boolean isInitialized = false;

    @PluginMethod
    public void init(PluginCall call) {
        String appId = call.getString("appId", "210830571");
        try {
            StartAppSDK.init(getContext(), appId, false);
            StartAppAd.disableSplash();
            rewardedAd = new StartAppAd(getContext());
            isInitialized = true;
            Log.d(TAG, "StartApp SDK initialized with App ID: " + appId);
            preload();
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "StartApp init error: ", e);
            call.reject("StartApp init failed: " + e.getMessage());
        }
    }

    private void preload() {
        if (rewardedAd != null) {
            rewardedAd.loadAd(StartAppAd.AdMode.REWARDED_VIDEO, new AdEventListener() {
                @Override
                public void onReceiveAd(@NonNull Ad ad) {
                    Log.d(TAG, "StartApp Rewarded Video preloaded successfully");
                }
                @Override
                public void onFailedToReceiveAd(@Nullable Ad ad) {
                    Log.w(TAG, "StartApp Rewarded Video preload failed: " + (ad != null ? ad.getErrorMessage() : ""));
                }
            });
        }
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        boolean ready = rewardedAd != null && rewardedAd.isReady();
        JSObject ret = new JSObject();
        ret.put("ready", ready);
        call.resolve(ret);
    }

    @PluginMethod
    public void loadRewardedVideo(PluginCall call) {
        if (!isInitialized) {
            try {
                StartAppSDK.init(getContext(), "210830571", false);
                StartAppAd.disableSplash();
                isInitialized = true;
            } catch (Exception ignored) {}
        }
        if (rewardedAd == null) {
            rewardedAd = new StartAppAd(getContext());
        }

        if (rewardedAd.isReady()) {
            call.resolve();
            return;
        }

        rewardedAd.loadAd(StartAppAd.AdMode.REWARDED_VIDEO, new AdEventListener() {
            @Override
            public void onReceiveAd(@NonNull Ad ad) {
                Log.d(TAG, "StartApp Rewarded Video loaded");
                call.resolve();
            }

            @Override
            public void onFailedToReceiveAd(@Nullable Ad ad) {
                String errMsg = (ad != null && ad.getErrorMessage() != null) ? ad.getErrorMessage() : "No Fill";
                Log.e(TAG, "StartApp Rewarded Video load failed: " + errMsg);
                call.reject(errMsg);
            }
        });
    }

    @PluginMethod
    public void showRewardedVideo(PluginCall call) {
        if (rewardedAd == null || !rewardedAd.isReady()) {
            call.reject("Ad not loaded yet");
            return;
        }

        final boolean[] rewardGranted = {false};

        rewardedAd.setVideoListener(new VideoListener() {
            @Override
            public void onVideoCompleted() {
                Log.d(TAG, "StartApp video completed - user earned reward");
                rewardGranted[0] = true;
            }
        });

        rewardedAd.showAd(new AdDisplayListener() {
            @Override
            public void adHidden(Ad ad) {
                Log.d(TAG, "StartApp ad closed. Reward earned: " + rewardGranted[0]);
                JSObject ret = new JSObject();
                ret.put("success", rewardGranted[0]);
                call.resolve(ret);
                preload();
            }

            @Override
            public void adDisplayed(Ad ad) {
                Log.d(TAG, "StartApp ad displayed on screen");
            }

            @Override
            public void adClicked(Ad ad) {
                Log.d(TAG, "StartApp ad clicked");
            }

            @Override
            public void adNotDisplayed(Ad ad) {
                Log.e(TAG, "StartApp ad not displayed");
                call.reject("Could not display ad");
                preload();
            }
        });
    }

    @PluginMethod
    public void showInterstitial(PluginCall call) {
        try {
            StartAppAd.showAd(getActivity());
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Interstitial failed: " + e.getMessage());
        }
    }
}
