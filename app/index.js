import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        // Nếu không có token thì đưa về welcome ngay
        if (!token) {
          router.replace("/welcome");
          return;
        }

        // Gọi endpoint refresh-token với body { refreshToken: token }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const resp = await fetch(
            "https://memora-be.onrender.com/auth/refresh-token",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: token }),
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);

          if (!resp.ok) {
            // refresh thất bại (401, 400, 500...)
            console.warn("Refresh failed:", resp.status);
            await AsyncStorage.removeItem("token");
            router.replace("/welcome");
            return;
          }

          const json = await resp.json();
          const newToken = json?.data?.token ?? null;

          if (!newToken) {
            console.warn("No token returned from refresh:", json);
            await AsyncStorage.removeItem("token");
            router.replace("/welcome");
            return;
          }

          // Lưu token mới và vào app
          await AsyncStorage.setItem("token", newToken);
          router.replace("/app");
          return;
        } catch (err) {
          // timeout hoặc lỗi mạng
          console.error("Error calling refresh-token:", err);
          await AsyncStorage.removeItem("token");
          router.replace("/welcome");
          return;
        }
      } catch (err) {
        console.error("Error reading token:", err);
        await AsyncStorage.removeItem("token");
        router.replace("/welcome");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
