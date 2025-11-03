// File: EditAvatarScreen.js

import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker"; // Dùng để chọn/chụp ảnh

// Màu sắc
const ACCENT_COLOR = "#007AFF"; // Màu xanh dương cho các hành động chính
const DANGER_COLOR = "#FF3B30"; // Màu đỏ cho hành động Xóa
const BACKGROUND_COLOR = "#2C2C2E"; // Nền tối cho modal content
const SEPARATOR_COLOR = "#48484A"; // Màu phân cách nhẹ
const OVERLAY_COLOR = "rgba(0, 0, 0, 0.6)"; // Overlay màu đen mờ

// Hàm xử lý chung
const handleAction = async (actionType, onClose, userToken) => {
  console.log(`Action: ${actionType}`);

  if (actionType === "Chọn từ thư viện") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Cần cấp quyền truy cập thư viện ảnh!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      console.log("Ảnh đã chụp:", result.assets[0].uri);
      // THAY ĐỔI: Gọi hàm upload ảnh
      const success = await uploadImage(result.assets[0].uri, userToken);
      if (success) {
        onClose(); // Đóng Modal nếu upload thành công
      }
    }
  } else if (actionType === "Chụp ảnh") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Cần cấp quyền truy cập camera!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      console.log("Ảnh đã chụp:", result.assets[0].uri);
      // THAY ĐỔI: Gọi hàm upload ảnh
      const success = await uploadImage(result.assets[0].uri, userToken);
      if (success) {
        onClose(); // Đóng Modal nếu upload thành công
      }
    }
  } else if (actionType === "Xóa ảnh hồ sơ") {
    // TODO: Xử lý xóa ảnh
    alert("Đã xóa ảnh hồ sơ.");
    onClose();
  } else if (actionType === "Hủy") {
    onClose();
  }
};

// Hàm xử lý Upload ảnh lên API
const uploadImage = async (imageUri, userToken) => {
  if (!userToken) {
    alert("Lỗi: Không tìm thấy token xác thực.");
    return false;
  }

  const uriParts = imageUri.split(".");
  const fileType = uriParts[uriParts.length - 1];

  // 1. Tạo đối tượng FormData
  const formData = new FormData();
  // Tên field phải là 'image' theo yêu cầu API
  formData.append("image", {
    uri: imageUri,
    name: `profile-${Date.now()}.${fileType}`,
    type: `image/${fileType}`,
  });

  const UPLOAD_URL = "https://memora-be.onrender.com/user/image";

  try {
    console.log("Đang tải ảnh lên API...");

    // 2. Gọi API với Fetch
    const response = await fetch(UPLOAD_URL, {
      method: "PUT",
      headers: {
        // Content-Type: 'multipart/form-data' sẽ được tự động thiết lập đúng
        // khi bạn truyền FormData làm body.
        Authorization: `Bearer ${userToken}`, // THÊM AUTHEN BEARER
      },
      body: formData,
    });

    // Xử lý phản hồi JSON
    const data = await response.json();

    if (response.ok) {
      console.log("Upload thành công:", data);
      alert("Đổi ảnh đại diện thành công!");
      return true; // Thành công
    } else {
      console.error("Lỗi Upload (Phản hồi API):", data);
      alert(`Lỗi upload ảnh: ${data.message || response.statusText}`);
      return false; // Thất bại
    }
  } catch (error) {
    console.error("Lỗi Upload (Mạng/Fetch):", error);
    alert("Lỗi kết nối hoặc mạng khi tải ảnh lên.");
    return false; // Thất bại
  }
};

// Component cho từng nút trong Action Sheet
const ActionButton = ({
  text,
  color,
  onPress,
  isFirst = false,
  isDanger = false,
}) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      !isFirst && styles.actionButtonSeparator,
      isDanger && styles.dangerButton,
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={text}
  >
    <Text style={[styles.actionText, { color: color }]}>{text}</Text>
  </TouchableOpacity>
);

// Component chính của Modal
const EditAvatarScreen = memo(({ isVisible, onClose, userToken }) => {
  if (!isVisible) return null;

  // Cấu hình các lựa chọn
  const options = [
    {
      text: "Chọn từ thư viện",
      color: ACCENT_COLOR,
      action: "Chọn từ thư viện",
    },
    { text: "Chụp ảnh", color: ACCENT_COLOR, action: "Chụp ảnh" },
    { text: "Xóa ảnh hồ sơ", color: DANGER_COLOR, action: "Xóa ảnh hồ sơ" },
  ];

  return (
    <Modal
      animationType="fade" // Hiệu ứng tối ưu, có thể dùng slide nếu muốn giống Bottom Sheet hơn
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Phần Header/Title */}
              <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                  Thay đổi ảnh hồ sơ của bạn
                </Text>
                <Text style={styles.headerSubtitle}>
                  Ảnh hồ sơ của bạn sẽ được hiển thị cho tất cả mọi người có số
                  điện thoại của bạn.
                </Text>
              </View>

              {/* Nhóm các Action Button */}
              <View style={styles.actionGroup}>
                {options.map((option, index) => (
                  <ActionButton
                    key={option.text}
                    text={option.text}
                    color={option.color}
                    onPress={() =>
                      handleAction(option.action, onClose, userToken)
                    }
                    isFirst={index === 0}
                    isDanger={option.text === "Xóa ảnh hồ sơ"}
                  />
                ))}
              </View>

              {/* Nút Hủy */}
              <View style={styles.cancelGroup}>
                <ActionButton
                  text="Hủy"
                  color={ACCENT_COLOR}
                  onPress={() => handleAction("Hủy", onClose, userToken)}
                  isFirst={true} // Chỉ có 1 nút trong group này
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

EditAvatarScreen.displayName = "EditAvatarScreen";

export default EditAvatarScreen;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end", // Đẩy nội dung xuống đáy
    backgroundColor: OVERLAY_COLOR,
  },
  modalContent: {
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === "ios" ? 40 : 20, // Padding cho iPhone có notch/thanh home
  },
  headerContainer: {
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 15,
    padding: 15,
    marginBottom: 8,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "600",
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
    overflow: "hidden", // Giúp các nút tròn theo border container
    marginBottom: 8,
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
    fontSize: 20, // Kích thước chữ lớn hơn cho các nút hành động
    fontWeight: "500",
  },
  dangerButton: {
    // Không cần style riêng ngoài màu chữ đã định nghĩa
  },
  cancelGroup: {
    backgroundColor: "#fff", // Nút Hủy có thể khác màu nếu cần nổi bật, dùng nền trắng cho ví dụ
    borderRadius: 15,
  },
});
