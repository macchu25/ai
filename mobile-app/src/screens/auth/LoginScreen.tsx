import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { socialLogin } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('inter.sawashima@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore((s) => s.setUser);

  // Cấu hình Google Auth chuẩn
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '1048649974212-00j0273a74ms3bp1d62mcciil9jo3pit.apps.googleusercontent.com',
    androidClientId: '1048649974212-00j0273a74ms3bp1d62mcciil9jo3pit.apps.googleusercontent.com',
    iosClientId: '1048649974212-00j0273a74ms3bp1d62mcciil9jo3pit.apps.googleusercontent.com',
  }, {
    native: AuthSession.makeRedirectUri({
      scheme: 'your.app.scheme' // Đây là lý do Google chặn: thiếu Scheme/Redirect URI hợp lệ
    })
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        // Sau khi Google trả về Access Token thật, 
        // ta gọi backend để đổi lấy JWT của hệ thống
        handleGoogleSignInSuccess(authentication.accessToken);
      }
    }
  }, [response]);

  const handleGoogleSignInSuccess = async (token: string) => {
    setLoading(true);
    try {
      // Gọi thử API lấy thông tin user từ Google để có Email/Name thật
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = await userInfoRes.json();

      // Sau đó gửi thông tin "chuẩn" này về Backend
      const result = await socialLogin({
        email: userInfo.email,
        name: userInfo.name,
        provider: 'google',
        provider_id: userInfo.sub,
      });
      setUser({ 
        token: result.token, 
        user_id: result.user_id, 
        name: result.name, 
        email: userInfo.email 
      });
    } catch (e) {
      setError('Lỗi xác thực với Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await socialLogin({
        email: email.trim(),
        name: email.split('@')[0] || 'Admin',
        provider: 'mobile',
        provider_id: `mobile_${email.trim()}`,
      });
      setUser({ token: result.token, user_id: result.user_id, name: result.name, email });
    } catch (e: any) {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await socialLogin({
        email: `${provider}_test@casos.ai`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        provider: provider,
        provider_id: `${provider}_${Date.now()}`,
      });
      setUser({ 
        token: result.token, 
        user_id: result.user_id, 
        name: result.name, 
        email: `${provider}_test@casos.ai` 
      });
    } catch (e: any) {
      setError(`Không thể đăng nhập qua ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.title}>Đăng nhập</Text>

          {/* Form */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên đăng nhập / Email</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <View style={styles.rememberWrap}>
              <View style={styles.checkbox}></View>
              <Text style={styles.rememberText}>Ghi nhớ tôi</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.btnLogin, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerWrap}>
            <Text style={styles.registerText}>Bạn chưa có tài khoản? </Text>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerWrap}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.line} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialWrap}>
            <TouchableOpacity 
              style={styles.socialIconBtn} 
              onPress={() => promptAsync()}
              disabled={!request || loading}
            >
              <Ionicons name="logo-google" size={24} color="#ef4444" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialIconBtn} 
              onPress={() => handleSocialLogin('facebook')}
              disabled={loading}
            >
              <Ionicons name="logo-facebook" size={24} color="#3b82f6" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialIconBtn} 
              onPress={() => handleSocialLogin('github')}
              disabled={loading}
            >
              <Ionicons name="logo-github" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>©CASOS.ai</Text>
        <Text style={styles.footerText}>Điều khoản</Text>
        <Text style={styles.footerText}>Bảo mật</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="globe-outline" size={12} color="#94a3b8" style={{ marginRight: 4 }} />
          <Text style={styles.footerText}>Tiếng Việt</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 40, paddingBottom: 60 },
  
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 40,
  },

  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 14,
  },

  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 4,
    marginRight: 8,
  },
  rememberText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '700',
  },

  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },

  btnLogin: {
    backgroundColor: '#0a58ca',
    borderRadius: 8,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },

  registerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  registerText: {
    color: '#64748b',
    fontSize: 13,
  },
  registerLink: {
    color: '#0a58ca',
    fontSize: 13,
    fontWeight: '700',
  },

  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },

  socialWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialIconBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
});
