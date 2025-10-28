import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // ❌ Tắt vuốt-back toàn app
          animation: "fade", // ✅ Chuyển trang mượt, không flash trắng
          contentStyle: { backgroundColor: "#fff" }, // ✅ Nền thống nhất, tránh trắng chớp
        }}
      />
    </GestureHandlerRootView>
  );
}
