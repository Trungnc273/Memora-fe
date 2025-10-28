import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    email.trim() && username.trim() && displayName.trim() && password.trim();

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      const res = await axios.post(
        "https://memora-be.onrender.com/auth/sign-up",
        {
          email,
          username,
          display_name: displayName,
          password,
        }
      );

      const token = res.data?.data?.token;

      if (token) {
        await AsyncStorage.setItem("token", token);

        // Chuyển sang /home
        router.replace("/app");

        // Thông báo
        if (Platform.OS === "web") {
          window.alert("🎉 Đăng ký thành công!");
        } else {
          Alert.alert("🎉 Thành công", "Đăng ký thành công!");
        }
      } else {
        if (Platform.OS === "web") {
          window.alert("Đăng ký thất bại, hãy thử lại!");
        } else {
          Alert.alert("Lỗi", "Đăng ký thất bại, hãy thử lại!");
        }
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === "web") {
        window.alert("Có lỗi xảy ra. Kiểm tra thông tin và thử lại!");
      } else {
        Alert.alert("Lỗi", "Có lỗi xảy ra. Kiểm tra thông tin và thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Tạo tài khoản mới</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Tên đăng nhập"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Tên hiển thị"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
            />

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.terms}>
              Bằng cách nhấn “Tiếp tục”, bạn đồng ý với{" "}
              <Text style={styles.link}>Điều khoản dịch vụ</Text> và{" "}
              <Text style={styles.link}>Chính sách quyền riêng tư</Text> của
              chúng tôi.
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                (!isValid || loading) && styles.buttonDisabled,
              ]}
              onPress={handleContinue}
              disabled={!isValid || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Đang đăng ký..." : "Tiếp tục →"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 20 },
  backButton: { marginTop: 10, alignSelf: "flex-start" },
  content: { flex: 1, justifyContent: "center", marginTop: 40 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 25 },
  input: {
    backgroundColor: "#1c1c1e",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  terms: { color: "#aaa", fontSize: 13, lineHeight: 18, marginBottom: 30 },
  link: { color: "#fff", textDecorationLine: "underline" },
  button: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#000", fontWeight: "600", fontSize: 16 },
});
