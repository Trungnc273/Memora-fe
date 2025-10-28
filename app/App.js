// App.js
import { Text, View } from "react-native";

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f2f2f2",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}>
        Hello HandyGo 👋
      </Text>
    </View>
  );
}
