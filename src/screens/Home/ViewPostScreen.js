import React, { useState, useRef, useEffect } from "react";
import {
  Dimensions,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height, width } = Dimensions.get("window");

export default function ViewPostScreen({
  post,
  scrollToHome,
  onKeyboardToggle,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const inputRef = useRef(null);
  const animValue = useRef(new Animated.Value(0)).current;

  // 🕒 Format thời gian
  const formatPostTime = (createdAt) => {
    if (!createdAt) return "";
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    return `${created.getDate()} tháng ${created.getMonth() + 1}`;
  };

  const postTime = formatPostTime(post?.created_at);

  // 🧠 Kiểm tra xem bài có phải của chính người dùng không
  useEffect(() => {
    const checkOwner = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !post?.user_id?._id) return;

        const decoded = jwtDecode(token);
        const userId = decoded?.id;
        if (userId === post.user_id._id) setIsOwner(true);
        else setIsOwner(false);
      } catch (err) {
        console.warn("⚠️ Lỗi khi decode token:", err);
      }
    };
    checkOwner();
  }, [post]);

  // 🎬 Animation bàn phím
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        setIsFocused(true);
        animate(true);
      }, 75);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      animate(false);
      setTimeout(() => setIsFocused(false), 200);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const animate = (focusState) => {
    animValue.stopAnimation();
    if (focusState) {
      Animated.spring(animValue, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  const chatBarTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });
  const chatBarOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const replyTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });
  const replyOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!post) return null;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* 🖼 Nếu là bài của mình → chỉ hiển thị dòng thông báo */}
        <>
          {/* Ảnh chính */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: post.media?.url }} style={styles.image} />
            {post?.caption && (
              <Text style={styles.caption}>{post.caption}</Text>
            )}
          </View>

          {/* Info */}
          <View style={styles.userInfo}>
            <Image
              source={{
                uri: post.user?.avatar || "https://i.pravatar.cc/150?img=47",
              }}
              style={styles.avatar}
            />
            <Text style={styles.name}>
              {post.user_id?.display_name || "Người dùng"}
            </Text>
            <Text style={styles.time}>{postTime}</Text>
          </View>
        </>

        {/* Chat bar */}
        {/* Chat bar (hiển thị khung cho cả chủ bài viết và người khác) */}
        <Animated.View
          style={[
            styles.messageBarContainer,
            {
              opacity: chatBarOpacity,
              transform: [{ translateY: chatBarTranslateY }],
            },
          ]}
        >
          <View style={styles.messageBar}>
            {isOwner ? (
              <Text style={styles.noActivityText}>Chưa có hoạt động nào!</Text>
            ) : (
              <>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                  onPress={() => {
                    setIsFocused(true);
                    setTimeout(() => inputRef.current?.focus(), 80);
                  }}
                >
                  <Text style={styles.placeholderText}>Gửi tin nhắn...</Text>
                </TouchableOpacity>
                <View style={styles.emojis}>
                  <Text style={styles.emoji}>💛</Text>
                  <Text style={styles.emoji}>🔥</Text>
                  <Text style={styles.emoji}>😍</Text>
                  <Ionicons name="happy-outline" size={22} color="#fff" />
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Bottom row */}
        {!isFocused && (
          <View style={styles.bottomRow}>
            <TouchableOpacity>
              <MaterialCommunityIcons
                name="view-grid-outline"
                size={32}
                color="#bdbdbd"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={scrollToHome}
            >
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity>
              <Ionicons
                name="arrow-up-circle-outline"
                size={36}
                color="#bdbdbd"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Reply bar */}
        {!isOwner && (
          <Animated.View
            style={[
              styles.replyContainer,
              {
                transform: [{ translateY: replyTranslateY }],
                opacity: replyOpacity,
              },
            ]}
          >
            <View style={styles.replyBar}>
              <TextInput
                ref={inputRef}
                value={message}
                onChangeText={setMessage}
                placeholder={`Trả lời ${
                  post.user_id?.display_name || "người dùng"
                }...`}
                placeholderTextColor="#bdbdbd"
                style={styles.replyInput}
                onFocus={() => onKeyboardToggle(true)}
                onBlur={() => onKeyboardToggle(false)}
                onSubmitEditing={() => {
                  if (!message.trim()) return;
                  console.log("💬 gửi:", message);
                  setMessage("");
                  Keyboard.dismiss();
                }}
              />
              <Ionicons
                name="arrow-up-circle"
                size={28}
                color={message ? "#ffcc00" : "#bdbdbd"}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { height, width, backgroundColor: "#000" },
  noActivityText: {
    color: "#bdbdbd",
    fontSize: 14,
    textAlign: "center",
    flex: 1,
  },

  imageContainer: {
    marginTop: "50%",
    borderRadius: 40,
    height: "45%",
    overflow: "hidden",
    backgroundColor: "#222",
  },
  image: { width: "100%", height: "100%" },
  caption: {
    position: "absolute",
    bottom: 15,
    alignSelf: "center",
    color: "#fff",
    fontSize: 17,
    fontWeight: "500",
  },
  userInfo: {
    position: "absolute",
    bottom: 220,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  name: { color: "#fff", fontWeight: "600", fontSize: 16 },
  time: { color: "#aaa", fontSize: 14 },
  messageBarContainer: {
    position: "absolute",
    bottom: 120,
    width: "100%",
    alignItems: "center",
  },
  messageBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 25,
    width: "90%",
    height: 50,
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },
  placeholderText: { color: "#bdbdbd", fontSize: 14 },
  emojis: { flexDirection: "row", alignItems: "center", gap: 6 },
  emoji: { fontSize: 18, marginHorizontal: 2 },
  bottomRow: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  cameraButton: { alignSelf: "center" },
  outerCircle: {
    width: 50,
    height: 50,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#ffcc00",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 38,
    height: 38,
    borderRadius: 25,
    backgroundColor: "#999595ff",
  },
  replyContainer: {
    position: "absolute",
    bottom: 310,
    width: "100%",
    alignItems: "center",
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#535151c8",
    borderRadius: 25,
    width: "95%",
    height: 50,
    paddingHorizontal: 15,
  },
  replyInput: { flex: 1, color: "#fff", fontSize: 15 },
});
