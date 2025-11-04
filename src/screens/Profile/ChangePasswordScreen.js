// File: ChangePasswordScreen.js (UI Nâng cấp)

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Cấu hình Style constants ---
const ACCENT_COLOR = "#007AFF";
const BACKGROUND_COLOR = "#2C2C2E";
const SEPARATOR_COLOR = "#48484A";
const OVERLAY_COLOR = "rgba(0, 0, 0, 0.6)";
const CHANGE_PASSWORD_URL = "https://memora-be.onrender.com/user/password";

// --- Component Hỗ trợ: ActionButton (Tương tự EditDisplayNameScreen) ---
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

// --- Component Hỗ trợ: PasswordInput ---
const PasswordInput = ({
  value,
  onChangeText,
  placeholder,
  showPassword,
  toggleShowPassword,
  inputRef,
  onSubmitEditing,
  returnKeyType,
  autoFocus = false,
}) => (
  <View style={styles.inputGroup}>
    <TextInput
      ref={inputRef}
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#aaa"
      secureTextEntry={!showPassword}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      returnKeyType={returnKeyType || "default"}
      onSubmitEditing={onSubmitEditing}
      autoFocus={autoFocus}
    />
    <TouchableOpacity onPress={toggleShowPassword} style={styles.toggleButton}>
      <Ionicons
        name={showPassword ? "eye-off-outline" : "eye-outline"}
        size={22}
        color="#999"
      />
    </TouchableOpacity>
  </View>
);

// --- Component Chính: ChangePasswordScreen ---
const ChangePasswordScreen = ({ isVisible, onClose, userToken }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const newPasswordRef = useRef(null);

  // Logic kiểm tra nút "Đổi mật khẩu" có bị disable không
  const isSaveDisabled =
    !oldPassword.trim() || !newPassword.trim() || isLoading;

  // Xử lý đổi mật khẩu
  const handleChangePassword = useCallback(async () => {
    if (isSaveDisabled) return;

    if (oldPassword === newPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới phải khác Mật khẩu hiện tại.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(CHANGE_PASSWORD_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          oldPassword: oldPassword,
          newPassword: newPassword,
        }),
      });

      const json = await response.json();

      if (response.ok) {
        Alert.alert(
          "Thành công",
          "Mật khẩu của bạn đã được thay đổi thành công!"
        );
        setOldPassword("");
        setNewPassword("");
        onClose();
      } else {
        Alert.alert(
          "Thất bại",
          json.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại."
        );
      }
    } catch (error) {
      console.error("❌ Lỗi API đổi mật khẩu:", error);
      Alert.alert(
        "Lỗi mạng",
        "Không thể kết nối đến server. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  }, [oldPassword, newPassword, onClose, userToken, isSaveDisabled]);

  // Đóng modal và reset input
  const handleCancel = useCallback(() => {
    setOldPassword("");
    setNewPassword("");
    onClose();
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        {/* KeyboardAvoidingView để đẩy nội dung lên trên bàn phím */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingContainer}
        >
          {/* Vùng không chạm (để đóng Modal) */}
          <TouchableWithoutFeedback onPress={handleCancel}>
            <View style={styles.touchableArea} />
          </TouchableWithoutFeedback>

          {/* Nội dung Pop-up */}
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Phần Header/Title */}
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                <Text style={styles.headerSubtitle}>
                  Nhập mật khẩu hiện tại và mật khẩu mới của bạn.
                </Text>
              </View>

              {/* Nhóm Nội dung và Nút Lưu/Hủy */}
              <View style={styles.actionGroup}>
                {/* 1. Mật khẩu hiện tại */}
                <PasswordInput
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Mật khẩu hiện tại"
                  showPassword={showOldPassword}
                  toggleShowPassword={() =>
                    setShowOldPassword(!showOldPassword)
                  }
                  onSubmitEditing={() => newPasswordRef.current?.focus()}
                  returnKeyType="next"
                  autoFocus={true}
                />

                {/* 2. Mật khẩu mới */}
                <PasswordInput
                  inputRef={newPasswordRef}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mật khẩu mới"
                  showPassword={showNewPassword}
                  toggleShowPassword={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                  onSubmitEditing={handleChangePassword}
                  returnKeyType="done"
                />

                {/* 3. Nút Đổi mật khẩu */}
                <ActionButton
                  text="Đổi mật khẩu"
                  color={isSaveDisabled ? "#aaa" : ACCENT_COLOR}
                  onPress={handleChangePassword}
                  isFirst={true}
                  isDisabled={isSaveDisabled}
                  isSaving={isLoading}
                />
              </View>

              {/* Nút Hủy (Tách biệt) */}
              <View style={styles.cancelGroup}>
                <ActionButton
                  text="Hủy"
                  color={ACCENT_COLOR}
                  onPress={handleCancel}
                  isFirst={true}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ChangePasswordScreen;

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
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR_COLOR,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontSize: 17,
    color: "#fff",
  },
  toggleButton: {
    padding: 5,
    marginLeft: 10,
  },
  // Style cho Action Button
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
  cancelGroup: {
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 15,
    // Khoảng cách an toàn ở đáy (tương tự iOS)
    marginBottom: 20,
  },
});
