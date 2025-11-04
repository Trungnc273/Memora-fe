import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 Hàm kiểm tra Token
    const checkAuthStatus = async () => {
      try {
        // 1. Đọc token từ AsyncStorage
        const token = await AsyncStorage.getItem("token");

        // 2. Kiểm tra token có tồn tại và hợp lệ không
        const isLoggedIn = !!token; // Biến thành true nếu token tồn tại, false nếu null/undefined

        // 3. Chuyển hướng
        // Sử dụng setTimeout ngắn để đảm bảo React Router đã sẵn sàng
        const timer = setTimeout(() => {
          router.replace(isLoggedIn ? "/app" : "/welcome");
        }, 50); // Đặt thời gian ngắn (ví dụ: 50ms)

        return () => clearTimeout(timer);
      } catch (error) {
        console.error("❌ Lỗi đọc token:", error);
        // Nếu có lỗi khi đọc, coi như chưa đăng nhập và chuyển hướng đến /welcome
        router.replace("/welcome");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Trong khi chờ đọc token, hiển thị Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
