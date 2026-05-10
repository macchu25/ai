package com.cardiac.alert;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.os.IBinder;
import android.util.Log;

import java.io.IOException;
import java.nio.ByteBuffer;

public class AlertService extends Service {
    private static final String TAG = "AlertService";
    private static final String CHANNEL_ID = "cardiac_alert_channel";
    private volatile boolean isRunning = false;
    private Thread playThread;
    private AudioTrack currentAudioTrack;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String filePath = intent != null ? intent.getStringExtra("file") : null;

        createNotificationChannel();
        Notification notification = new Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("⚠️ Cardiac Alert")
                .setContentText("Đang truyền cảnh báo khẩn cấp...")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .build();
        startForeground(1, notification);

        if (filePath == null || filePath.isEmpty()) {
            Log.e(TAG, "Không có đường dẫn file!");
            stopSelf();
            return START_NOT_STICKY;
        }

        Log.i(TAG, "🎯 Bắt đầu stream audio vào cuộc gọi: " + filePath);

        final String audioPath = filePath;
        isRunning = true;

        playThread = new Thread(() -> {
            AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);

            try {
                // Khi đang có cuộc gọi, hệ thống đã set MODE_IN_CALL rồi
                // Không cần setMode() — chỉ cần tăng volume và stream PCM vào VOICE_CALL
                Log.i(TAG, "📞 Audio mode hiện tại: " + am.getMode() + " (4 = MODE_IN_CALL)");

                // Tăng âm lượng call tối đa
                am.setStreamVolume(AudioManager.STREAM_VOICE_CALL,
                        am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL), 0);

                // Decode MP3 → PCM → Stream vào AudioTrack VOICE_CALL
                playMp3ToCall(audioPath);

            } catch (Exception e) {
                Log.e(TAG, "❌ Lỗi: " + e.getMessage(), e);
            } finally {
                Log.i(TAG, "✅ Hoàn tất phát cảnh báo.");
                stopSelf();
            }
        });
        playThread.start();

        return START_NOT_STICKY;
    }

    /**
     * Decode MP3 bằng MediaCodec, sau đó viết PCM thẳng vào AudioTrack STREAM_VOICE_CALL.
     * Trên các thiết bị MediaTek: STREAM_VOICE_CALL trong MODE_IN_CALL được route vào uplink.
     */
    private void playMp3ToCall(String filePath) throws IOException {
        MediaExtractor extractor = new MediaExtractor();
        extractor.setDataSource(filePath);

        // Tìm audio track trong file MP3
        MediaFormat format = null;
        int trackIndex = -1;
        for (int i = 0; i < extractor.getTrackCount(); i++) {
            MediaFormat f = extractor.getTrackFormat(i);
            String mime = f.getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith("audio/")) {
                format = f;
                trackIndex = i;
                break;
            }
        }

        if (format == null || trackIndex < 0) {
            Log.e(TAG, "❌ Không tìm thấy audio track trong file: " + filePath);
            extractor.release();
            return;
        }

        extractor.selectTrack(trackIndex);

        String mimeType = format.getString(MediaFormat.KEY_MIME);
        int sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE);
        int channelCount = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
        int channelConfig = (channelCount == 1)
                ? AudioFormat.CHANNEL_OUT_MONO
                : AudioFormat.CHANNEL_OUT_STEREO;

        Log.i(TAG, String.format("📊 Audio info: mime=%s, %dHz, %dch", mimeType, sampleRate, channelCount));

        // Khởi tạo MediaCodec decoder (MP3 → PCM)
        MediaCodec codec = MediaCodec.createDecoderByType(mimeType);
        codec.configure(format, null, null, 0);
        codec.start();

        // Khởi tạo AudioTrack với STREAM_VOICE_CALL → inject vào uplink
        int minBuf = AudioTrack.getMinBufferSize(sampleRate, channelConfig, AudioFormat.ENCODING_PCM_16BIT);
        AudioTrack audioTrack = new AudioTrack(
                AudioManager.STREAM_VOICE_CALL,
                sampleRate,
                channelConfig,
                AudioFormat.ENCODING_PCM_16BIT,
                minBuf * 4,
                AudioTrack.MODE_STREAM
        );
        currentAudioTrack = audioTrack; // lưu lại để onDestroy cleanup an toàn
        audioTrack.play();
        Log.i(TAG, "▶ AudioTrack đang phát vào STREAM_VOICE_CALL (uplink)...");

        MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
        boolean inputDone = false;
        boolean outputDone = false;

        while (!outputDone && isRunning) {
            // Đẩy dữ liệu MP3 vào decoder
            if (!inputDone) {
                int inputIdx = codec.dequeueInputBuffer(10_000);
                if (inputIdx >= 0) {
                    ByteBuffer inputBuf = codec.getInputBuffer(inputIdx);
                    int sampleSize = extractor.readSampleData(inputBuf, 0);
                    if (sampleSize < 0) {
                        // Hết dữ liệu
                        codec.queueInputBuffer(inputIdx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                        inputDone = true;
                        Log.i(TAG, "📦 Đã nạp hết dữ liệu MP3 vào decoder.");
                    } else {
                        codec.queueInputBuffer(inputIdx, 0, sampleSize, extractor.getSampleTime(), 0);
                        extractor.advance();
                    }
                }
            }

            // Lấy PCM ra và ghi vào AudioTrack
            int outputIdx = codec.dequeueOutputBuffer(bufferInfo, 10_000);
            if (outputIdx >= 0) {
                ByteBuffer outputBuf = codec.getOutputBuffer(outputIdx);
                if (outputBuf != null && bufferInfo.size > 0) {
                    byte[] pcm = new byte[bufferInfo.size];
                    outputBuf.get(pcm);
                    // Ghi PCM thẳng vào audio buffer của cuộc gọi
                    audioTrack.write(pcm, 0, pcm.length);
                }
                codec.releaseOutputBuffer(outputIdx, false);
                if ((bufferInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                    outputDone = true;
                }
            }
        }

        // Đợi buffer phát hết trước khi dừng
        audioTrack.stop();
        audioTrack.release();
        codec.stop();
        codec.release();
        extractor.release();
        Log.i(TAG, "✅ Stream PCM vào cuộc gọi hoàn tất!");
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        if (playThread != null) {
            playThread.interrupt();
        }
        // Safe cleanup - không để crash
        if (currentAudioTrack != null) {
            try {
                currentAudioTrack.pause();
                currentAudioTrack.flush();
                currentAudioTrack.release();
            } catch (Exception ignored) {}
            currentAudioTrack = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Cardiac Alert", NotificationManager.IMPORTANCE_LOW);
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(channel);
    }
}
