import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socket from "../../socket/socket";

const DEFAULT_AVATAR = (id) =>
  `https://i.pravatar.cc/150?u=${id || "default_id"}`;
const DEFAULT_USER_NAME = "Thông tin người dùng";
const ChatDetailScreen = ({ navigation, chat }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const flatListRef = useRef(null);
  const [userInfo, setUserInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    AsyncStorage.getItem("user").then((u) => {
      if (u) setCurrentUser(JSON.parse(u));
    });
  }, []);
  const fetchUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch("https://memora-be.onrender.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        setUserInfo(data.data);
        await AsyncStorage.setItem("user", JSON.stringify(data.data));
      }
    } catch (err) {
      console.log("❌ Lỗi lấy user info:", err);
    }
  }, []);

  // 🧠 Lấy danh sách tin nhắn từ API
  useEffect(() => {
    if (!chat?._id) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(
          `https://memora-be.onrender.com/message/${chat._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await res.json();

        if (json.status === "OK") {
          setMessages(json.data || []);
        } else {
          Alert.alert("Lỗi", json.message || "Không thể tải tin nhắn");
        }
      } catch (err) {
        console.log("❌ Lỗi tải tin nhắn:", err);
        Alert.alert("Lỗi", "Không thể tải tin nhắn");
      } finally {
        setLoading(false);
      }
    };

    // 👉 Gọi API lấy tin nhắn
    fetchMessages();
    fetchUser();

    // 👉 Tham gia room
    socket.emit("join_room", chat._id);
    console.log("📡 Joined room:", chat._id);

    socket.on("new_message", (data) => {
      if (data.conversationId === chat._id) {
        const msg = data.message;

        if (
          msg.sender?._id === currentUser?._id ||
          msg.sender === currentUser?._id
        )
          return;

        console.log("📩 Tin nhắn realtime:", msg);
        setMessages((prev) => {
          const updated = [...prev, msg];
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
          return updated;
        });
      }
    });

    // 👉 Rời room khi thoát
    return () => {
      socket.emit("leave_room", chat._id);
      socket.off("new_message");
    };
  }, [chat]);

  // 🧠 Cuộn xuống khi bàn phím mở
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    });
    return () => showSub.remove();
  }, []);

  // 🧠 Gửi tin nhắn
  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `https://memora-be.onrender.com/message/${chat._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );
      const json = await res.json();

      if (json.status === "OK") {
        // const newMsg = {
        //   _id: json.data._id,
        //   sender: {
        //     _id: currentUser?._id,
        //     display_name: currentUser?.display_name || "Tôi",
        //   },
        //   content: json.data.content,
        //   created_at: json.data.created_at,
        // };
        // setMessages((prev) => [...prev, newMsg]);
      } else {
        Alert.alert("Gửi thất bại", json.message || "Đã có lỗi xảy ra");
      }
    } catch (err) {
      console.log("❌ Lỗi gửi tin nhắn:", err);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const sender = item?.sender || null;

    // Xác định xem tin nhắn có phải của mình
    const isMine =
      !!sender &&
      (sender._id === currentUser?._id ||
        sender?.display_name === currentUser?.display_name);

    // Avatar logic: nếu sender có avatar dùng nó, nếu là mình dùng currentUser, còn không fallback bằng DEFAULT_AVATAR
    const senderId = sender?._id || null;
    const senderAvatarFromSender = sender?.avatar_url || null;

    let avatarForMessage;
    if (isMine) {
      avatarForMessage =
        currentUser?.avatar_url ||
        userInfo?.avatar_url ||
        DEFAULT_AVATAR(currentUser?._id);
    } else {
      avatarForMessage = senderAvatarFromSender || DEFAULT_AVATAR(senderId);
    }

    const postUrl = item?.post?.url;
    const postCaption = item?.post?.caption;

    // Khi isMine = true thì đặt row theo row-reverse (avatar ở phải, bubble trước => hiện bên phải)
    const containerDirection = isMine ? "row-reverse" : "row";
    const avatarVisible = !isMine; // chỉ hiện avatar của người khác ở bên trái

    return (
      <View
        style={[styles.messageContainer, { flexDirection: containerDirection }]}
      >
        {avatarVisible && (
          <Image source={{ uri: avatarForMessage }} style={styles.msgAvatar} />
        )}

        <View
          style={[
            styles.bubble,
            isMine ? styles.myBubble : styles.theirBubble,
            // nhỏ tweak: nếu có ảnh, giảm padding dưới
            { paddingBottom: postUrl ? 0 : 8 },
          ]}
        >
          {postUrl ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: postUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              {postCaption ? (
                <View style={styles.imageCaptionContainer}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.imageCaptionText}
                  >
                    {postCaption}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {item?.content ? (
            <Text style={styles.text}>{item.content}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  let headerAvatarUrl;
  let headerDisplayName;

  if (!chat?.user) {
    // Nếu chat.user không có (chat 1-on-1 chưa nạp đầy) -> hiển thị thông tin current user (an toàn)
    headerAvatarUrl = userInfo?.avatar_url || DEFAULT_AVATAR(currentUser?._id);
    headerDisplayName = userInfo?.display_name || DEFAULT_USER_NAME;
  } else {
    // Nếu chat.user tồn tại:
    // - Nếu chat.user là chính bạn (lý thuyết ít xảy ra) -> dùng currentUser
    const isChatUserCurrent =
      currentUser && chat.user._id && chat.user._id === currentUser._id;

    if (isChatUserCurrent) {
      headerAvatarUrl =
        currentUser?.avatar_url ||
        userInfo?.avatar_url ||
        DEFAULT_AVATAR(currentUser?._id);
      headerDisplayName =
        currentUser?.display_name ||
        userInfo?.display_name ||
        DEFAULT_USER_NAME;
    } else {
      // Người khác: nếu avatar/tên có thì dùng, nếu không thì dùng default (không dùng userInfo)
      headerAvatarUrl = chat.user?.avatar_url || DEFAULT_AVATAR(chat.user?._id);
      headerDisplayName = chat.user?.display_name || DEFAULT_USER_NAME;
    }
  }

  return (
    <LinearGradient colors={["#214E14", "#2E5E1C"]} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={-20}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation?.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Image
                source={{
                  uri: headerAvatarUrl, // Sửa: Dùng biến đã tính toán
                }}
                style={styles.avatar}
              />
              <Text style={styles.headerName}>{headerDisplayName}</Text>
            </View>
            <Entypo name="dots-three-horizontal" size={18} color="#fff" />
          </View>

          {/* Messages */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#fff"
              style={{ marginTop: 100 }}
            />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
            />
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Gửi tin nhắn..."
                placeholderTextColor="#ccc"
                value={input}
                onChangeText={setInput}
                style={[
                  styles.input,
                  {
                    height: Math.min(
                      120,
                      Math.max(40, input.split("\n").length * 22)
                    ),
                  },
                ]}
                multiline={true}
                blurOnSubmit={false}
                returnKeyType="default"
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!input.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name="send"
                    size={22}
                    color={input.trim() ? "#FFD700" : "#aaa"}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerName: { color: "#fff", fontSize: 17, fontWeight: "600" },
  avatar: { width: 35, height: 35, borderRadius: 20 },
  messageContainer: {
    marginVertical: 6,
    alignItems: "flex-end",
    width: "100%",
    paddingHorizontal: 6,
  },
  theirMessageContainer: { justifyContent: "flex-start" },
  myMessageContainer: { justifyContent: "flex-end" },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  theirBubble: { backgroundColor: "rgba(255,255,255,0.1)" },
  myBubble: {
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "flex-end",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    marginTop: 3,
    marginBottom: 3,
    marginLeft: "auto",
    marginRight: "auto",
  },
  inputContainer: { width: "100%", paddingHorizontal: 12, paddingBottom: 30 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 6 },
  messageImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
  },

  imageWrapper: {
    marginTop: 8,
    marginBottom: 6,
    overflow: "hidden",
    borderRadius: 12,
    position: "relative",
  },

  imageCaptionContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  imageCaptionText: {
    backgroundColor: "rgba(200,200,200,0.9)", // nền xám mờ
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#000",
    fontSize: 13,
    textAlign: "center",
  },
});
