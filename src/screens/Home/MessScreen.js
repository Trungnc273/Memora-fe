import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MessScreen({ onGoHome, onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🧩 Hàm định dạng thời gian (vd: "3 ngày", "2 giờ", "vừa xong")
  const formatTimeAgo = (isoString) => {
    if (!isoString) return "";
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút`;
    if (hours < 24) return `${hours} giờ`;
    return `${days} ngày`;
  };

  // 🔥 Gọi API lấy danh sách hội thoại
  const fetchConversations = useCallback(async () => {
    // Chỉ hiển thị loading ban đầu nếu KHÔNG phải đang refresh
    if (!isRefreshing) setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch("https://memora-be.onrender.com/conversation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === "OK") {
        setConversations(json.data || []);
      } else {
        console.log("⚠️ API trả về lỗi:", json);
      }
    } catch (err) {
      console.log("❌ Lỗi tải hội thoại:", err);
    } finally {
      if (!isRefreshing) setLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true); // Bật biểu tượng refresh
    await fetchConversations();
  }, [fetchConversations]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onGoHome?.()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <View style={{ width: 24 }} /> {/* để cân khoảng trống bên phải */}
      </View>

      {/* Loading */}
      {loading && !isRefreshing ? (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={{ marginTop: 100 }}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#FFCC00"
            />
          }
          renderItem={({ item }) => {
            const avatar = item.user?.avatar_url
              ? item.user.avatar_url
              : "https://i.pravatar.cc/150?img=47"; // avatar mặc định

            const name = item.user?.display_name || "Người dùng";
            const lastMsg = item.last_message?.content || " ";
            const time = formatTimeAgo(item.last_message?.created_at);

            return (
              <TouchableOpacity
                style={styles.chatItem}
                activeOpacity={0.7}
                onPress={() => onOpenChat?.(item)}
              >
                <Image source={{ uri: avatar }} style={styles.avatar} />
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.name}>
                      {name}
                      {time ? (
                        <Text style={styles.time}>{"  " + time}</Text>
                      ) : null}
                    </Text>
                  </View>
                  <Text style={styles.lastMessage}>{lastMsg}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có hội thoại nào</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  time: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "400",
  },
  lastMessage: {
    color: "#bdbdbd",
    fontSize: 14,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 100,
    fontSize: 15,
  },
});
