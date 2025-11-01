// File: SettingsScreen.js

import React, { useState, memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  Ionicons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

// Config dữ liệu cho các nhóm và items (data-driven approach để dễ maintain và giảm hardcode)
const SETTINGS_CONFIG = [
  {
    title: "Tổng quát",
    items: [
      {
        iconName: "calendar-outline",
        iconLibrary: "Ionicons",
        text: "Sửa ngày sinh",
        onPressKey: "Sửa ngày sinh",
      },
      {
        iconName: "text-outline",
        iconLibrary: "Ionicons",
        text: "Sửa tên",
        onPressKey: "Sửa tên",
      },
      {
        iconName: "person-circle-outline",
        iconLibrary: "Ionicons",
        text: "Edit profile photo",
        onPressKey: "Edit profile photo",
      },
      {
        iconName: "mail-outline",
        iconLibrary: "Ionicons",
        text: "Add email address",
        onPressKey: "Add email address",
        isLast: true,
      },
    ],
  },
  {
    title: "Hỗ trợ",
    items: [
      {
        iconName: "alert-circle-outline",
        iconLibrary: "Ionicons",
        text: "Báo cáo sự cố",
        onPressKey: "Báo cáo sự cố",
      },
      {
        iconName: "chatbox-outline",
        iconLibrary: "Ionicons",
        text: "Gửi đề xuất",
        onPressKey: "Gửi đề xuất",
      },
      {
        iconName: "refresh-circle-outline",
        iconLibrary: "Ionicons",
        text: "Khôi phục đơn hàng",
        onPressKey: "Khôi phục đơn hàng",
        isLast: true,
      },
    ],
  },
  {
    title: "Riêng tư & bảo mật",
    items: [
      {
        iconName: "ios-person-remove-outline",
        iconLibrary: "Ionicons",
        text: "Tài khoản đã bị chặn",
        onPressKey: "Tài khoản đã bị chặn",
      },
      {
        iconName: "checkmark-circle-outline",
        iconLibrary: "Ionicons",
        text: "Send read receipts",
        isSwitch: true,
        switchValueKey: "readReceiptsEnabled", // Key để map state
        hideArrow: true,
      },
      {
        iconName: "eye-outline",
        iconLibrary: "Ionicons",
        text: "Hiển thị tài khoản",
        onPressKey: "Hiển thị",
        isLast: true,
      },
    ],
  },
  {
    title: "Giới thiệu",
    items: [
      {
        iconName: "logo-tiktok",
        iconLibrary: "Ionicons",
        text: "TikTok",
        onPressKey: "TikTok",
      },
      {
        iconName: "logo-instagram",
        iconLibrary: "Ionicons",
        text: "Instagram",
        onPressKey: "Instagram",
      },
      {
        iconName: "logo-twitter",
        iconLibrary: "Ionicons",
        text: "X (Twitter)",
        onPressKey: "X (Twitter)",
      },
      {
        iconName: "share-outline",
        iconLibrary: "Ionicons",
        text: "Chia sẻ Locket",
        onPressKey: "Chia sẻ Locket",
      },
      {
        iconName: "star-outline",
        iconLibrary: "Ionicons",
        text: "Đánh giá Locket",
        onPressKey: "Đánh giá Locket",
      },
      {
        iconName: "document-text-outline",
        iconLibrary: "Ionicons",
        text: "Điều khoản dịch vụ",
        onPressKey: "Điều khoản dịch vụ",
      },
      {
        iconName: "lock-closed-outline",
        iconLibrary: "Ionicons",
        text: "Chính sách quyền riêng tư",
        onPressKey: "Chính sách quyền riêng tư",
        isLast: true,
      },
    ],
  },
  {
    title: "Vùng nguy hiểm",
    items: [
      {
        iconName: "trash-can-outline",
        iconLibrary: "MaterialCommunityIcons",
        text: "Xóa tài khoản",
        onPressKey: "Xóa tài khoản",
        isDanger: true,
      },
      {
        iconName: "logout",
        iconLibrary: "MaterialCommunityIcons",
        text: "Đăng xuất",
        onPressKey: "Đăng xuất",
        isDanger: true,
        isLast: true,
      },
    ],
  },
];

// Memoized component cho SettingsItem để tối ưu re-render (chỉ re-render khi props thay đổi)
const SettingsItem = memo(
  ({
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
      {
        Ionicons,
        FontAwesome,
        MaterialCommunityIcons,
      }[iconLibrary] || MaterialCommunityIcons;

    const iconColor = isDanger ? "#FF3B30" : "#fff";

    return (
      <TouchableOpacity
        style={[styles.item, isLast && styles.lastItem]}
        onPress={onPress}
        disabled={isSwitch}
        accessibilityRole="button"
        accessibilityLabel={text}
      >
        <View style={styles.itemLeft}>
          <IconComponent
            name={iconName}
            size={22}
            color={iconColor}
            style={styles.iconStyle}
          />
          <Text
            style={[styles.itemText, isDanger && styles.dangerText]}
            numberOfLines={1}
            accessibilityLabel={text}
          >
            {text}
          </Text>
        </View>
        {isSwitch ? (
          <Switch
            trackColor={{ false: "#767577", true: "#34C759" }}
            thumbColor={switchValue ? "#fff" : "#f4f3f4"}
            onValueChange={onSwitchChange}
            value={switchValue}
            accessibilityRole="switch"
            accessibilityLabel={`${text} ${switchValue ? "on" : "off"}`}
          />
        ) : (
          !hideArrow && (
            <Ionicons name="chevron-forward" size={20} color="#999" />
          )
        )}
      </TouchableOpacity>
    );
  }
);

SettingsItem.displayName = "SettingsItem";

// Memoized component cho SettingsGroup
const SettingsGroup = memo(({ title, children }) => (
  <View style={styles.groupContainer}>
    {title && <Text style={styles.groupTitle}>{title}</Text>}
    <View style={styles.groupList}>{children}</View>
  </View>
));

SettingsGroup.displayName = "SettingsGroup";

export default function SettingsScreen() {
  // State cho switches (dùng object để dễ mở rộng nếu có nhiều switch)
  const [switches, setSwitches] = useState({
    readReceiptsEnabled: true,
  });

  // Hàm xử lý onPress chung
  const handlePress = (key) => {
    console.log(`Pressed: ${key}`);
    // navigation.navigate(key); // Uncomment khi cần
  };

  // Hàm xử lý switch change
  const handleSwitchChange = (key, value) => {
    setSwitches((prev) => ({ ...prev, [key]: value }));
  };

  // Render items từ config
  const renderItems = (items, index) => (
    <>
      {items.map((item, itemIndex) => {
        const isLast = item.isLast || itemIndex === items.length - 1;
        const key = `${index}-${itemIndex}`;

        if (item.isSwitch) {
          return (
            <SettingsItem
              key={key}
              {...item}
              onPress={undefined}
              switchValue={switches[item.switchValueKey]}
              onSwitchChange={(value) =>
                handleSwitchChange(item.switchValueKey, value)
              }
              isLast={isLast}
            />
          );
        }

        return (
          <SettingsItem
            key={key}
            {...item}
            onPress={() => handlePress(item.onPressKey)}
            isLast={isLast}
          />
        );
      })}
    </>
  );

  return (
    <BottomSheetScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {SETTINGS_CONFIG.map((group, index) => (
        <SettingsGroup key={group.title || index} title={group.title}>
          {renderItems(group.items, index)}
        </SettingsGroup>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Dữ liệu thời tiết được cung cấp bởi  Weather
        </Text>
      </View>
    </BottomSheetScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    backgroundColor: "#2C2C2C",
  },
  header: {
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    paddingVertical: 12,
  },
  groupContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
    marginBottom: 8,
    paddingLeft: 16,
    textTransform: "uppercase",
  },
  groupList: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    overflow: "hidden",
  },
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
  iconStyle: {
    width: 28,
    textAlign: "center",
  },
  itemText: {
    fontSize: 17,
    color: "#fff",
    marginLeft: 10,
    flexShrink: 1,
  },
  dangerText: {
    color: "#FF3B30",
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#999",
  },
});
