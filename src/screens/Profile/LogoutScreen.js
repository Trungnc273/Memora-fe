// File: LogoutScreen.js (Phiên bản cập nhật)

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";

// Pop-up xác nhận đăng xuất
export default function LogoutScreen({ isVisible, onClose, onConfirmLogout }) {
  if (!isVisible) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          {/* SỬA ĐỔI NỘI DUNG để phù hợp với pop-up ở giữa */}
          <Text style={styles.title}>Bạn có chắc bạn muốn đăng xuất?</Text>
          <View style={styles.buttonSeparator} /> {/* Đường ngăn cách ngang */}
          <View style={styles.buttonContainer}>
            {/* Nút Hủy */}
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <View style={styles.verticalSeparator} />{" "}
            {/* Đường ngăn cách dọc */}
            {/* Nút Đăng xuất */}
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                onClose(); // Đóng modal trước
                onConfirmLogout(); // Gọi hàm xử lý logic đăng xuất
              }}
            >
              <Text style={styles.confirmText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ✅ ĐÃ SỬA: Căn giữa theo cả chiều dọc và chiều ngang
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Mờ nền vừa phải
    justifyContent: "center", // Căn giữa dọc
    alignItems: "center", // Căn giữa ngang
  },
  // ✅ ĐÃ SỬA: Thay đổi kích thước và style cho pop-up
  alertBox: {
    backgroundColor: "#2C2C2E",
    width: "80%", // Chiều rộng cố định cho pop-up
    borderRadius: 14,
    overflow: "hidden", // Quan trọng để đường viền hoạt động
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 18,
    paddingHorizontal: 15,
  },
  buttonSeparator: {
    // Đường ngăn cách ngang
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#444",
    marginTop: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    height: 50,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalSeparator: {
    // Đường ngăn cách dọc
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#444",
    height: "100%",
  },
  cancelText: {
    color: "#0A84FF",
    fontSize: 17,
    fontWeight: "400", // Thường nút Hủy sẽ mờ hơn
  },
  confirmText: {
    color: "#FF3B30",
    fontSize: 17,
    fontWeight: "600", // Nút chính thường đậm hơn
  },
});
