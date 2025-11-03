import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Animated,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

export default function FriendScreen() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [inputWidth] = useState(new Animated.Value(1));

  const fetchFriends = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        "https://memora-be.onrender.com/follow/friend-list",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      if (json.friendList) setFriends(json.friendList);
    } catch (err) {
      console.log("❌ Lỗi khi tải danh sách bạn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleFocus = () => {
    setIsSearching(true);
    Animated.timing(inputWidth, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleCancel = () => {
    setIsSearching(false);
    setSearchValue("");
    Keyboard.dismiss(); // Ẩn bàn phím khi ấn Hủy
    Animated.timing(inputWidth, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{friends.length} / 20 người bạn</Text>
        <Text style={styles.subtitle}>Mời một người bạn để tiếp tục</Text>
      </View>

      <View style={styles.searchContainer}>
        <Animated.View style={[styles.inputWrapper, { flex: inputWidth }]}>
          <Ionicons
            name="search"
            size={18}
            color="#aaa"
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Thêm một người bạn mới"
            placeholderTextColor="#999"
            value={searchValue}
            onChangeText={setSearchValue}
            onFocus={handleFocus}
          />
        </Animated.View>

        {isSearching && (
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Find friends from other apps */}
      <View style={styles.findOtherApp}>
        <View style={styles.findInnerBox}>
          <Ionicons name="person-add" size={16} color="#aaa" />
          <Text style={styles.findText}>Find friends from other apps</Text>
        </View>

        <View style={styles.appRow}>
          {[
            {
              uri: "https://cdn-icons-png.flaticon.com/512/5968/5968771.png", // Messenger chuẩn
              label: "Messenger",
            },
            {
              uri: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png",
              label: "Insta",
            },
            { icon: "chatbubble", label: "Tin nhắn", color: "#4EE44E" },
            { icon: "link", label: "Khác", color: "#aaa" },
          ].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.appItemBox}>
              <View style={styles.iconCircle}>
                {item.uri ? (
                  <Image source={{ uri: item.uri }} style={styles.appIcon} />
                ) : (
                  <Ionicons name={item.icon} size={22} color={item.color} />
                )}
              </View>
              <Text style={styles.appLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Bạn bè của bạn</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.friendItem}>
              <View style={styles.friendLeft}>
                {item?.avatar_url ? (
                  <Image
                    source={{ uri: item.avatar_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <FontAwesome5 name="user" size={20} color="#fff" />
                  </View>
                )}

                <Text style={styles.friendName}>
                  {item.display_name || "Người dùng"}
                </Text>
              </View>

              <TouchableOpacity>
                <Ionicons name="close" size={20} color="#aaa" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Bạn chưa có bạn nào</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2C2C2C",
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A3A3A",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  cancelText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 10,
  },
  findOtherApp: {
    backgroundColor: "#404040",
    borderRadius: 16,
    padding: 14,
    marginTop: 5,
  },
  findInnerBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  findText: {
    color: "#ddd",
    fontSize: 13,
    marginLeft: 6,
  },
  appRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appItemBox: {
    alignItems: "center",
    width: 70,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3C3C3C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  appIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  appLabel: {
    color: "#ccc",
    fontSize: 12,
    textAlign: "center",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    marginTop: 25,
    marginBottom: 10,
  },
  friendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#444",
  },
  friendLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  friendName: {
    color: "#fff",
    fontSize: 15,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
});
