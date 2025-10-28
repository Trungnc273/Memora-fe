import { useRouter } from "expo-router"; // 👈 thêm dòng này
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter(); // 👈 khởi tạo hook điều hướng

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../../src/assets/images/WelcomeScreen/welcome.png")}
        style={[styles.image, { width: width * 0.6, height: height * 0.35 }]}
        resizeMode="contain"
      />
      <Text style={styles.title}>💛 Locket</Text>
      <Text style={styles.subtitle}>
        Ảnh trực tiếp từ bạn bè,{"\n"}ngay trên màn hình chính
      </Text>

      {/* 👉 Khi ấn, điều hướng sang trang đăng ký */}
      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => router.push("/auth/register")}
      >
        <Text style={styles.buttonText}>Tạo một tài khoản</Text>
      </TouchableOpacity>

      {/* 👉 Khi ấn, điều hướng sang trang đăng nhập */}
      <TouchableOpacity onPress={() => router.push("/auth/login")}>
        <Text style={styles.loginText}>Đăng nhập</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonPrimary: {
    backgroundColor: "#FFD700",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 50,
    marginBottom: 16,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
