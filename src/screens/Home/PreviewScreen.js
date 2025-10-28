import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Dimensions,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Keyboard,
} from "react-native";
import { useState } from "react";

const { height, width } = Dimensions.get("window");

export default function PreviewScreen({ photoUri, onSend, onCancel }) {
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");

  const sendPost = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ Không có token, người dùng chưa đăng nhập.");
        return;
      }

      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("visibility", visibility);
      formData.append("media", {
        uri: photoUri,
        type: "image/jpeg",
        name: `photo_${Date.now()}.jpg`,
      });

      const response = await fetch("https://memora-be.onrender.com/post", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("❌ Lỗi gửi bài:", result);
        return;
      }

      console.log("✅ Upload thành công:", result);
      if (onSend) onSend();
    } catch (error) {
      console.error("❌ Lỗi kết nối:", error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar hidden />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.picFrame}>
            <Image source={{ uri: photoUri }} style={styles.camera} />

            <View style={styles.inlineCaptionContainerPreview}>
              <TextInput
                placeholder="Thêm một tin nhắn"
                placeholderTextColor="#ccc"
                value={caption}
                onChangeText={setCaption}
                style={styles.inlineCaptionInput}
                multiline
                blurOnSubmit
              />
            </View>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close-outline" size={40} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendButton} onPress={sendPost}>
              <Ionicons name="send-outline" size={30} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.visibilityToggle}
              onPress={() =>
                setVisibility(visibility === "public" ? "private" : "public")
              }
            >
              <Ionicons
                name={
                  visibility === "public"
                    ? "earth-outline"
                    : "lock-closed-outline"
                }
                size={22}
                color="#FFCC00"
              />
              <Text style={styles.visibilityText}>
                {visibility === "public" ? "Công khai" : "Riêng tư"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { height, width, backgroundColor: "#000" },
  picFrame: {
    top: "-10%",
    borderRadius: 50,
    width: "100%",
    overflow: "hidden",
    alignSelf: "center",
    position: "relative",
  },
  camera: {
    marginTop: "39.5%",
    borderRadius: 50,
    width: "100%",
    height: "61.7%",
    overflow: "hidden",
    alignSelf: "center",
  },
  inlineCaptionContainerPreview: {
    position: "absolute",
    bottom: 100,
    width: "100%",
    alignItems: "center",
    zIndex: 20,
  },
  inlineCaptionInput: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 25,
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    textAlign: "center",
    fontSize: 16,
    alignSelf: "center",
    maxWidth: "90%",
  },
  bottomControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  sendButton: {
    backgroundColor: "#FFCC00",
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  visibilityToggle: { alignItems: "center" },
  visibilityText: { color: "#FFCC00", fontSize: 14, marginTop: 4 },
});
