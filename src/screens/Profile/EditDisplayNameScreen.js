import React, { useState, useEffect, memo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Cấu hình Style constants ---
const ACCENT_COLOR = "#007AFF";
const BACKGROUND_COLOR = "#2C2C2E";
const SEPARATOR_COLOR = "#48484A";
const OVERLAY_COLOR = "rgba(0, 0, 0, 0.6)";
const API_URL = "https://memora-be.onrender.com/user/displayName";

// --- Component Hỗ trợ: ActionButton ---
const ActionButton = ({
  text,
  color,
  onPress,
  isFirst = false,
  isDisabled = false,
  isSaving = false,
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      !isFirst && styles.actionButtonSeparator,
      isDisabled && styles.disabledButton,
    ]}
    onPress={onPress}
    disabled={isDisabled || isSaving}
    accessibilityRole="button"
  >
    {isSaving ? (
      <ActivityIndicator color={color} />
    ) : (
      <Text style={[styles.actionText, { color: color }]}>{text}</Text>
    )}
  </TouchableOpacity>
);

// --- Component Chính: EditDisplayNameScreen ---
const EditDisplayNameScreen = memo(({ isVisible, onClose, onUpdateUser }) => {
  const [displayName, setDisplayName] = useState("");
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const inputRef = useRef(null);

  // 🧠 Logic load data và Tự động Focus
  useEffect(() => {
    if (!isVisible) return;

    const loadUserData = async () => {
      setLoading(true);

      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const user = JSON.parse(userString);
          const currentName = user.display_name || "";
          setDisplayName(currentName);
          setInitialDisplayName(currentName);
        }
      } catch (error) {
        console.log("❌ Lỗi đọc user data:", error);
      } finally {
        setLoading(false);

        // Tự động Focus sau khi Modal đã render
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 50);
      }
    };
    loadUserData();

    // Cleanup: Ẩn bàn phím khi Modal đóng
    return () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    };
  }, [isVisible]);

  // 🧠 Logic gọi API PUT để cập nhật display_name
  const handleSave = useCallback(async () => {
    if (saving || !displayName.trim() || loading) return;
    const newDisplayName = displayName.trim();

    if (newDisplayName === initialDisplayName) {
      onClose();
      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Authen Bearer
        },
        body: JSON.stringify({ display_name: newDisplayName }),
      });

      const json = await res.json();

      if (res.ok) {
        Alert.alert("Thành công", "Tên hiển thị đã được cập nhật.");

        // ✅ Cập nhật lại AsyncStorage và gọi callback
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const user = JSON.parse(userString);
          user.display_name = newDisplayName;
          await AsyncStorage.setItem("user", JSON.stringify(user));

          // Thông báo cho component cha (ProfileScreen) cập nhật lại
          if (onUpdateUser) onUpdateUser(user);
        }

        setInitialDisplayName(newDisplayName);
        onClose();
      } else {
        Alert.alert("Lỗi", json.message || `Cập nhật thất bại (${res.status})`);
      }
    } catch (error) {
      console.log("❌ Lỗi gọi API:", error);
      Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
      setSaving(false);
    }
  }, [displayName, initialDisplayName, loading, saving, onClose, onUpdateUser]);

  const isSaveDisabled = !displayName.trim() || saving || loading;
  const isChanged = displayName.trim() !== initialDisplayName;

  if (!isVisible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* KeyboardAvoidingView để đẩy nội dung lên trên bàn phím */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingContainer}
        >
          {/* Vùng không chạm (để đóng Modal) */}
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.touchableArea} />
          </TouchableWithoutFeedback>

          {/* Nội dung Pop-up */}
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Phần Header/Title */}
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Sửa tên</Text>
                <Text style={styles.headerSubtitle}>
                  Tên của bạn sẽ hiển thị cho bạn bè.
                </Text>
              </View>

              {/* Nhóm Nội dung và Nút Lưu/Hủy */}
              <View style={styles.actionGroup}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : (
                  <>
                    {/* 1. Ô nhập liệu hiển thị display_name hiện tại */}
                    <View style={styles.inputContainer}>
                      <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Tên hiển thị"
                        placeholderTextColor="#aaa"
                        value={displayName} // Hiển thị tên hiện tại
                        onChangeText={setDisplayName}
                        maxLength={50}
                        returnKeyType="done"
                        autoCorrect={false}
                        autoCapitalize="words"
                      />
                    </View>

                    {/* 2. Nút Lưu */}
                    <ActionButton
                      text="Lưu"
                      color={
                        isSaveDisabled || !isChanged ? "#aaa" : ACCENT_COLOR
                      }
                      onPress={handleSave}
                      isFirst={true}
                      isDisabled={isSaveDisabled || !isChanged}
                      isSaving={saving}
                    />
                  </>
                )}
              </View>

              {/* Nút Hủy */}
              <View style={styles.cancelGroup}>
                <ActionButton
                  text="Hủy"
                  color={ACCENT_COLOR}
                  onPress={onClose}
                  isFirst={true}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

EditDisplayNameScreen.displayName = "EditDisplayNameScreen";

export default EditDisplayNameScreen;

// --- Stylesheet ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },

  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  touchableArea: {
    flex: 1,
  },

  modalContent: {
    paddingHorizontal: 10,
    // 🔥 Loại bỏ padding đáy Modal
  },
  headerContainer: {
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 15,
    padding: 15,
    marginBottom: 8,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  actionGroup: {
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 8,
  },
  loadingContainer: {
    paddingVertical: 15,
    alignItems: "center",
  },
  actionButton: {
    paddingVertical: 15,
    alignItems: "center",
  },
  actionButtonSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SEPARATOR_COLOR,
  },
  actionText: {
    fontSize: 20,
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Style cho Input
  inputContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR_COLOR,
  },
  input: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontSize: 17,
    color: "#fff",
  },
  cancelGroup: {
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 15,
    // 🔥 Điều chỉnh marginBottom để tạo khoảng cách với đáy màn hình/bàn phím
    marginBottom: 20,
  },
});
