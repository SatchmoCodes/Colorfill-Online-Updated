package com.colorfillonlineupdated

import android.media.AudioAttributes
import android.media.SoundPool
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PopSoundPoolModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val soundPool: SoundPool
    private val soundIds = mutableMapOf<String, Int>()

    init {
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_GAME)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        soundPool = SoundPool.Builder()
            .setMaxStreams(20)
            .setAudioAttributes(attrs)
            .build()
    }

    override fun getName(): String = "PopSoundPool"

    @ReactMethod
    fun load(filename: String) {
        val ctx = reactApplicationContext
        val name = filename.removeSuffix(".mp3")
        val resId = ctx.resources.getIdentifier(name, "raw", ctx.packageName)
        if (resId != 0 && !soundIds.containsKey(filename)) {
            soundIds[filename] = soundPool.load(ctx, resId, 1)
        }
    }

    @ReactMethod
    fun play(filename: String, volume: Float) {
        val id = soundIds[filename] ?: return
        soundPool.play(id, volume, volume, 1, 0, 1.0f)
    }

    @ReactMethod
    fun release() {
        soundPool.release()
        soundIds.clear()
    }
}
