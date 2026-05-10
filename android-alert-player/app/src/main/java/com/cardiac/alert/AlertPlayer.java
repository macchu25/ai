package com.cardiac.alert;

import android.app.Activity;
import android.content.Intent;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Bundle;
import android.util.Log;

public class AlertPlayer extends Activity {
    private static final String TAG = "AlertPlayer";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = getIntent();
        String filePath = intent.getStringExtra("file");

        if (filePath == null || filePath.isEmpty()) {
            Log.e(TAG, "Không có đường dẫn file!");
            finish();
            return;
        }

        Log.i(TAG, "Phát file: " + filePath);

        AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);

        // ✅ BẬT LOA NGOÀI ĐÚNG CÁCH (không toggle, luôn = true)
        am.setSpeakerphoneOn(true);
        Log.i(TAG, "🔊 Loa ngoài: BẬT");

        // Tăng âm lượng lên tối đa
        am.setStreamVolume(AudioManager.STREAM_MUSIC, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC), 0);
        am.setStreamVolume(AudioManager.STREAM_VOICE_CALL, am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL), 0);

        try {
            MediaPlayer mp = new MediaPlayer();
            mp.setAudioStreamType(AudioManager.STREAM_MUSIC);
            mp.setDataSource(filePath);
            mp.prepare();
            mp.setVolume(1.0f, 1.0f);

            mp.setOnCompletionListener(mp2 -> {
                mp2.release();
                // Tắt loa ngoài khi phát xong (trả về trạng thái bình thường)
                am.setSpeakerphoneOn(false);
                Log.i(TAG, "✅ Phát xong! Tắt loa ngoài.");
                finish();
            });

            mp.start();
            android.widget.Toast.makeText(this, "▶ Đang phát cảnh báo...", android.widget.Toast.LENGTH_LONG).show();
            Log.i(TAG, "▶ Bắt đầu phát audio!");

        } catch (Exception e) {
            Log.e(TAG, "Lỗi phát audio: " + e.getMessage());
            android.widget.Toast.makeText(this, "Lỗi: " + e.getMessage(), android.widget.Toast.LENGTH_LONG).show();
            am.setSpeakerphoneOn(false);
            finish();
        }
    }
}
