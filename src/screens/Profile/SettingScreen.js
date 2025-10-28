// File: SettingsScreen.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from "react-native";
import {
  Ionicons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

// Component đại diện cho một mục cài đặt (hàng)
const SettingsItem = ({
  iconName,
  iconLibrary,
  text,
  onPress,
  isDanger = false,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  hideArrow = false,
  isLast = false,
}) => {
  const IconComponent =
    iconLibrary === "Ionicons"
      ? Ionicons
      : iconLibrary === "FontAwesome"
      ? FontAwesome
      : MaterialCommunityIcons;

  // 🔄 Xác định màu icon (Trắng cho mặc định, Đỏ cho Danger)
  const iconColor = isDanger ? "#FF3B30" : "#fff";

  return (
    <TouchableOpacity
      style={[styles.item, isLast && styles.lastItem]}
      onPress={onPress}
      disabled={isSwitch} // Vô hiệu hóa press cho hàng chứa Switch
    >
      <View style={styles.itemLeft}>
        {/* ❌ Đã XÓA iconContainer và defaultIconBg/dangerIconBg */}
        {/* Chỉ giữ lại Icon */}
        <IconComponent
          name={iconName}
          size={22} // Tăng kích thước icon một chút cho dễ nhìn
          color={iconColor}
          style={styles.iconStyle} // 🆕 Thêm style để căn chỉnh
        />

        {/* Text */}
        <Text
          style={[styles.itemText, isDanger && styles.dangerText]}
          numberOfLines={1}
        >
          {text}
        </Text>
      </View>

      {/* Switch hoặc Arrow */}
      {isSwitch ? (
        <Switch
          trackColor={{ false: "#767577", true: "#34C759" }}
          thumbColor={switchValue ? "#fff" : "#f4f3f4"}
          onValueChange={onSwitchChange}
          value={switchValue}
        />
      ) : (
        !hideArrow && <Ionicons name="chevron-forward" size={20} color="#999" />
      )}
    </TouchableOpacity>
  );
};

// Component đại diện cho một nhóm cài đặt (View bo tròn chứa các hàng)
const SettingsGroup = ({ title, children }) => (
  <View style={styles.groupContainer}>
    {title && <Text style={styles.groupTitle}>{title}</Text>}
    <View style={styles.groupList}>{children}</View>
  </View>
);

export default function SettingsScreen() {
  // State giả định cho Switch
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);

  // Hàm xử lý chung (chỉ để hiển thị log hoặc điều hướng)
  const handlePress = (item) => {
    console.log(`Pressed: ${item}`);
    // navigation.navigate(item);
  };

  return (
    // Sử dụng SafeAreaView và ScrollView để tạo hiệu ứng cuộn và đảm bảo hiển thị đúng
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* 🆕 Thay đổi màu nền của HeaderTitle thành màu tối để khớp với nền BottomSheet */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* ======================================================= */}
        {/* Trang 2 (Tổng quát) - Cần cuộn lên để thấy */}
        {/* ======================================================= */}

        <SettingsGroup title="Tổng quát">
          <SettingsItem
            iconName="calendar-outline"
            iconLibrary="Ionicons"
            text="Sửa ngày sinh"
            onPress={() => handlePress("Sửa ngày sinh")}
          />
          <SettingsItem
            iconName="text-outline"
            iconLibrary="Ionicons"
            text="Sửa tên"
            onPress={() => handlePress("Sửa tên")}
          />
          <SettingsItem
            iconName="person-circle-outline"
            iconLibrary="Ionicons"
            text="Edit profile photo"
            onPress={() => handlePress("Edit profile photo")}
          />
          <SettingsItem
            iconName="mail-outline"
            iconLibrary="Ionicons"
            text="Add email address"
            onPress={() => handlePress("Add email address")}
            isLast={true}
          />
        </SettingsGroup>

        <SettingsGroup title="Hỗ trợ">
          <SettingsItem
            iconName="alert-circle-outline"
            iconLibrary="Ionicons"
            text="Báo cáo sự cố"
            onPress={() => handlePress("Báo cáo sự cố")}
          />
          <SettingsItem
            iconName="chatbox-outline"
            iconLibrary="Ionicons"
            text="Gửi đề xuất"
            onPress={() => handlePress("Gửi đề xuất")}
          />
          <SettingsItem
            iconName="refresh-circle-outline"
            iconLibrary="Ionicons"
            text="Khôi phục đơn hàng"
            onPress={() => handlePress("Khôi phục đơn hàng")}
            isLast={true}
          />
        </SettingsGroup>

        <SettingsGroup title="Riêng tư & bảo mật">
          <SettingsItem
            iconName="ios-person-remove-outline"
            iconLibrary="Ionicons"
            text="Tài khoản đã bị chặn"
            onPress={() => handlePress("Tài khoản đã bị chặn")}
          />
          <SettingsItem
            iconName="checkmark-circle-outline"
            iconLibrary="Ionicons"
            text="Send read receipts"
            isSwitch={true}
            switchValue={readReceiptsEnabled}
            onSwitchChange={setReadReceiptsEnabled}
            hideArrow={true}
          />
          {/* Mục "Hiển thị..." có thể được đặt ở đây nếu cần */}
          <SettingsItem
            iconName="eye-outline"
            iconLibrary="Ionicons"
            text="Hiển thị tài khoản"
            onPress={() => handlePress("Hiển thị")}
            isLast={true}
          />
        </SettingsGroup>

        {/* ======================================================= */}
        {/* Trang 1 (Giới thiệu) - Cần cuộn xuống để thấy */}
        {/* ======================================================= */}

        <SettingsGroup title="Giới thiệu">
          <SettingsItem
            iconName="logo-tiktok"
            iconLibrary="Ionicons"
            text="TikTok"
            onPress={() => handlePress("TikTok")}
          />
          <SettingsItem
            iconName="logo-instagram"
            iconLibrary="Ionicons"
            text="Instagram"
            onPress={() => handlePress("Instagram")}
          />
          <SettingsItem
            iconName="logo-twitter"
            iconLibrary="Ionicons"
            text="X (Twitter)"
            onPress={() => handlePress("X (Twitter)")}
          />
          <SettingsItem
            iconName="share-outline"
            iconLibrary="Ionicons"
            text="Chia sẻ Locket"
            onPress={() => handlePress("Chia sẻ Locket")}
          />
          <SettingsItem
            iconName="star-outline"
            iconLibrary="Ionicons"
            text="Đánh giá Locket"
            onPress={() => handlePress("Đánh giá Locket")}
          />
          <SettingsItem
            iconName="document-text-outline"
            iconLibrary="Ionicons"
            text="Điều khoản dịch vụ"
            onPress={() => handlePress("Điều khoản dịch vụ")}
          />
          <SettingsItem
            iconName="lock-closed-outline"
            iconLibrary="Ionicons"
            text="Chính sách quyền riêng tư"
            onPress={() => handlePress("Chính sách quyền riêng tư")}
            isLast={true}
          />
        </SettingsGroup>

        <SettingsGroup title="Vùng nguy hiểm">
          <SettingsItem
            iconName="trash-can-outline"
            iconLibrary="MaterialCommunityIcons"
            text="Xóa tài khoản"
            onPress={() => handlePress("Xóa tài khoản")}
            isDanger={true}
          />
          <SettingsItem
            iconName="logout" // Đã đổi icon cho phù hợp với MaterialCommunityIcons
            iconLibrary="MaterialCommunityIcons"
            text="Đăng xuất"
            onPress={() => handlePress("Đăng xuất")}
            isDanger={true}
            isLast={true}
          />
        </SettingsGroup>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dữ liệu thời tiết được cung cấp bởi  Weather
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // 1. ✅ Nền BottomSheet (được set trong index.js là #2f2f2f)
    // Nhưng vì component này được bọc trong BottomSheetView,
    // chúng ta chỉ cần đảm bảo màu nền chính là màu nền của BottomSheetView
    backgroundColor: "#2C2C2C",
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    // 🆕 Đặt nền ở đây nếu bạn muốn ScrollView có màu nền.
    // Tuy nhiên, việc này thường được xử lý bởi BottomSheetView chứa nó.
  },
  header: {
    paddingTop: 10,
    paddingBottom: 5,
    // 🆕 Giả định bạn không muốn thanh header này có màu nền khác
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    paddingVertical: 12,
  },
  // Nhóm Cài đặt
  groupContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999", // Màu xám nhạt cho tiêu đề nhóm
    marginBottom: 8,
    paddingLeft: 16, // Thụt vào một chút
    textTransform: "uppercase",
  },
  groupList: {
    backgroundColor: "#1C1C1E", // Màu nền cho các nhóm cài đặt (giống FriendScreen)
    borderRadius: 12,
    overflow: "hidden",
  },
  // Hàng Cài đặt
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#38383A",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  // 🆕 Style mới để căn chỉnh icon
  iconStyle: {
    width: 28, // Đảm bảo khoảng cách cố định
    textAlign: "center",
  },
  itemText: {
    fontSize: 17,
    color: "#fff",
    marginLeft: 10,
    flexShrink: 1,
  },
  // ❌ Đã XÓA iconContainer, defaultIconBg, dangerIconBg

  // Danger Zone Styles
  dangerText: {
    color: "#FF3B30", // Màu đỏ cho text vùng nguy hiểm
  },
  // Footer
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#999",
  },
});
