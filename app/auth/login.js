import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = username.trim() && password.trim();

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      const res = await axios.post(
        "https://memora-be.onrender.com/auth/sign-in",
        {
          username,
          password,
        }
      );

      const token = res.data?.data?.token; // Lấy token từ data

      if (token) {
        await AsyncStorage.setItem("token", token);

        // Chuyển trang trước
        router.replace("/app");

        // Thông báo
        if (Platform.OS === "web") {
          window.alert("🎉 Đăng nhập thành công!");
        } else {
          Alert.alert("🎉 Thành công", "Đăng nhập thành công!");
        }
      } else {
        if (Platform.OS === "web") {
          window.alert("Đăng nhập thất bại, hãy thử lại!");
        } else {
          Alert.alert("Lỗi", "Đăng nhập thất bại, hãy thử lại!");
        }
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === "web") {
        window.alert("Sai tên đăng nhập hoặc mật khẩu!");
      } else {
        Alert.alert("Lỗi", "Sai tên đăng nhập hoặc mật khẩu!");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Đăng nhập</Text>

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
            placeholder="Mật khẩu"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.terms}>
            Bằng cách nhấn “Tiếp tục”, bạn đồng ý với{" "}
            <Text style={styles.link}>Điều khoản dịch vụ</Text> và{" "}
            <Text style={styles.link}>Chính sách quyền riêng tư</Text> của chúng
            tôi.
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
              {loading ? "Đang đăng nhập..." : "Tiếp tục →"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    marginTop: 40,
  },
  backText: {
    color: "#fff",
    fontSize: 28,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    marginTop: 60,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 25,
  },
  input: {
    backgroundColor: "#1c1c1e",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  terms: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 30,
  },
  link: {
    color: "#fff",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 16,
  },
});
