import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import PreviewScreen from "./PreviewScreen";
import {
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Webcam from "react-webcam";

const { height, width } = Dimensions.get("window");

export default function HomeScreen({ refreshProfile, onOpenPreview }) {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [flash, setFlash] = useState("off");
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionSafeArea} edges={["top", "bottom"]}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Cần cấp quyền truy cập camera
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={styles.permissionButton}
          >
            <Text style={styles.permissionButtonText}>Cấp quyền</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleFlash = () => {
    setFlash((prev) => (prev === "off" ? "on" : "off"));
  };

  const takePicture = async () => {
    if (Platform.OS === "web") {
      const screenshot = cameraRef.current?.getScreenshot();
      if (screenshot) {
        setCapturedPhoto(screenshot);
        onOpenPreview?.(true);
      }
    } else if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true,
        quality: 1,
      });
      setCapturedPhoto(photo.uri);
      onOpenPreview?.(true);
    }
  };

  const toggleCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  // ⬇️ Nếu có ảnh chụp — render PreviewScreen thay cho camera
  if (capturedPhoto) {
    return (
      <PreviewScreen
        photoUri={capturedPhoto}
        onSend={() => {
          if (refreshProfile) refreshProfile();
          setCapturedPhoto(null);
          onOpenPreview?.(false);
        }}
        onCancel={() => {
          setCapturedPhoto(null);
          onOpenPreview?.(false);
        }}
      />
    );
  }

  // ================== CAMERA VIEW ==================
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.cameraFrame}>
          {Platform.OS === "web" ? (
            <Webcam
              audio={false}
              ref={cameraRef}
              screenshotFormat="image/jpeg"
              style={styles.camera}
            />
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              zoom={zoom}
              flash={flash}
            >
              <View style={styles.cameraTopRow}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={toggleFlash}
                >
                  <Ionicons
                    name={flash === "on" ? "flash" : "flash-off-outline"}
                    size={22}
                    color={flash === "on" ? "#FFD700" : "#C9B37F"}
                  />
                </TouchableOpacity>

                <View style={styles.zoomButton}>
                  <Text style={{ color: "#C9B37F", fontWeight: "600" }}>
                    {(1 + zoom * 2).toFixed(1)}x
                  </Text>
                </View>
              </View>
            </CameraView>
          )}
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton}>
            <Ionicons name="image-outline" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleCamera}>
            <Ionicons name="camera-reverse-outline" size={36} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.arrowDown}>
          <Ionicons name="chevron-down-outline" size={30} color="#fff" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height, width, backgroundColor: "#000" },
  permissionSafeArea: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 40,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 40,
  },
  permissionText: { color: "#fff", fontSize: 18, marginBottom: 10 },
  permissionButton: {
    backgroundColor: "#FFCC00",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionButtonText: { fontWeight: "600" },
  camera: {
    marginTop: "20%",
    borderRadius: 50,
    width: "100%",
    height: "66%",
    overflow: "hidden",
    alignSelf: "center",
  },
  cameraTopRow: {
    position: "absolute",
    top: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  iconButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 25,
  },
  zoomButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 25,
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
  galleryButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: "#FFCC00",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  arrowDown: { position: "absolute", bottom: 20, alignSelf: "center" },
});
