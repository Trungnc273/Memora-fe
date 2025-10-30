import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dimensions,
  View,
  StyleSheet,
  Keyboard,
  FlatList,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler"; // Giữ lại Gesture cho panGestureHorizontal
import {
  GestureHandlerRootView,
  GestureDetector,
} from "react-native-gesture-handler";
import Home from "../../src/screens/Home/HomeScreen";
import Profile from "../../src/screens/Profile/ProfileScreen";
import ViewPost from "../../src/screens/Home/ViewPostScreen";
import Mess from "../../src/screens/Home/MessScreen";
import ChatDetail from "../../src/screens/Home/ChatDetailScreen";
import TopBar from "../../src/screens/Home/TopBar";
import socket from "../../src/socket/socket";

// ✅ Import BottomSheet và component cần thiết từ thư viện @gorhom
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import FriendScreen from "../../src/screens/Profile/FriendScreen";
import SettingScreen from "../../src/screens/Profile/SettingScreen";

const { width, height } = Dimensions.get("window");

export default function Index() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const keyboardOpen = useSharedValue(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const prevPostsRef = useRef([]);
  const flatListRef = useRef(null);
  const [friendCount, setFriendCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  // 🆕 Thêm ref để điều khiển BottomSheet
  const bottomSheetRef = useRef(null);

  // 🆕 Định nghĩa các điểm neo (snap points) cho BottomSheet
  const snapPoints = useMemo(() => ["93%"], []);
  const initialSnapIndex = -1; // -1: Ẩn hoàn toàn

  // 🆕 Hàm mở màn hình bạn bè
  const openFriendScreen = () => {
    // Kích hoạt snap point 90% (gần đầy màn hình)
    bottomSheetRef.current?.snapToIndex(1);
  };

  const settingsSheetRef = useRef(null);

  const openSettingScreen = () => {
    settingsSheetRef.current?.snapToIndex(0);
    setIsSettingOpen(true);
  };

  const closeSettingScreen = () => {
    settingsSheetRef.current?.close();
  };

  // ============= PHẦN LOGIC KHÔNG ĐỔI =============

  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch("https://memora-be.onrender.com/post/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === "OK") {
        const visiblePosts = json.data
          .filter((p) => !p.is_deleted)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const prev = prevPostsRef.current;
        const hasNew =
          visiblePosts.length !== prev.length ||
          visiblePosts.some((p, i) => p._id !== prev[i]?._id);
        if (hasNew) {
          setPosts(visiblePosts);
          prevPostsRef.current = visiblePosts;
          console.log("📩 Cập nhật danh sách bài viết mới.");
        }
      }
    } catch (err) {
      console.log("❌ Lỗi tải post:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      console.log("🔔 Nhận emit new_post_update — fetch lại bài viết");
      fetchPosts();
    };
    socket.on("new_post", handleUpdate);
    return () => socket.off("new_post", handleUpdate);
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardOpen(true);
      keyboardOpen.value = true;
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardOpen(false);
      keyboardOpen.value = false;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchFriends = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        "https://memora-be.onrender.com/follow/friend-list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      if (json.friendList) {
        setFriendCount(json.friendList.length);
      }
    } catch (err) {
      console.log("❌ Lỗi tải danh sách bạn bè:", err);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const currentIndex = useSharedValue(1);
  const translateX = useSharedValue(-width);
  const startX = useSharedValue(translateX.value);

  const panGestureHorizontal = Gesture.Pan()
    .enabled(!isPreviewOpen && !isKeyboardOpen && !isSettingOpen)
    .activeOffsetX([-5, 5])
    .onBegin(() => (startX.value = translateX.value))
    .onUpdate((event) => {
      if (isKeyboardOpen) return;
      let nextX = startX.value + event.translationX;
      const maxLeft = 0;
      const maxRight = -width * 3;
      if (currentIndex.value === 2 && event.translationX < 0) return;
      if (nextX > maxLeft) nextX = maxLeft;
      if (nextX < maxRight) nextX = maxRight;
      translateX.value = nextX;
    })
    .onEnd((event) => {
      const threshold = width / 10;
      if (event.translationX < -threshold) {
        if (currentIndex.value === 2) return;
        if (currentIndex.value < 3) currentIndex.value += 1;
      } else if (event.translationX > threshold && currentIndex.value > 0) {
        currentIndex.value -= 1;
      }
      translateX.value = withTiming(-currentIndex.value * width, {
        duration: 220,
      });
    });

  const horizontalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const [profileRefreshFlag, setProfileRefreshFlag] = useState(0);
  const refreshProfilePosts = () => setProfileRefreshFlag((p) => p + 1);

  const goToProfile = () => {
    currentIndex.value = 0;
    translateX.value = withTiming(0, { duration: 250 });
  };

  const goToHome = () => {
    currentIndex.value = 1;
    translateX.value = withTiming(-width, { duration: 250 });
  };

  const goToMess = () => {
    currentIndex.value = 2;
    translateX.value = withTiming(-width * 2, { duration: 250 });
  };

  const goToChat = (chat) => {
    setSelectedChat(chat);
    currentIndex.value = 3;
    translateX.value = withTiming(-width * 3, { duration: 250 });
  };

  const handleInputFocus = (focused) => {
    setIsKeyboardOpen(focused);
    keyboardOpen.value = focused;
  };

  // ============= PHẦN RENDER =============

  return (
    // ⚠️ BỌC TOÀN BỘ APP BẰNG GestureHandlerRootView
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.root}>
        <GestureDetector
          gesture={isKeyboardOpen ? Gesture.Tap() : panGestureHorizontal}
        >
          <Animated.View style={[styles.container, horizontalAnimatedStyle]}>
            {/* Profile */}
            <View style={{ width, height }}>
              <Profile
                onGoHome={goToHome}
                refreshFlag={profileRefreshFlag}
                onOpenFriend={openFriendScreen}
                onOpenSetting={openSettingScreen}
              />
            </View>

            {/* Home */}
            <View style={{ width, height }}>
              <TopBar
                onGoProfile={goToProfile}
                friendCount={friendCount}
                onGoMess={goToMess}
              />
              <FlatList
                ref={flatListRef}
                data={[{ isHome: true }, ...posts]}
                keyExtractor={(item, index) => item._id || `item-${index}`}
                renderItem={({ item }) =>
                  item.isHome ? (
                    <Home
                      refreshProfile={refreshProfilePosts}
                      onOpenPreview={setIsPreviewOpen}
                      onGoMess={goToMess}
                    />
                  ) : (
                    <ViewPost
                      post={item}
                      scrollToHome={() =>
                        flatListRef.current?.scrollToIndex({ index: 0 })
                      }
                      onKeyboardToggle={handleInputFocus}
                    />
                  )
                }
                pagingEnabled
                showsVerticalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={height}
                getItemLayout={(data, index) => ({
                  length: height,
                  offset: height * index,
                  index,
                })}
                scrollEnabled={!isKeyboardOpen && !isPreviewOpen}
              />
            </View>

            {/* Mess */}
            <View style={{ width, height }}>
              <Mess
                onGoHome={goToHome}
                onGoChat={goToChat}
                onOpenChat={(chat) => goToChat(chat)}
              />
            </View>

            {/* Chat Detail */}
            <View style={{ width, height }}>
              <ChatDetail
                navigation={{ goBack: goToMess }}
                chat={selectedChat}
              />
            </View>
          </Animated.View>
        </GestureDetector>

        {/* 🆕 BottomSheet cho FriendScreen (Đã dùng thư viện chuyên dụng) */}
        <BottomSheet
          ref={bottomSheetRef}
          index={initialSnapIndex} // Bắt đầu ẩn hoàn toàn
          snapPoints={snapPoints}
          enablePanDownToClose={true} // ✅ Cho phép vuốt xuống để đóng an toàn
          handleIndicatorStyle={styles.handleIndicator}
          backgroundStyle={styles.bottomSheetBackground}
        >
          {/* BottomSheetView tối ưu hóa cho nội dung cuộn bên trong */}
          <FriendScreen />
        </BottomSheet>

        {/* 2. 🆕 BottomSheet cho SettingScreen (ĐÃ SỬA LỖI CẤU TRÚC) */}
        <BottomSheet
          ref={settingsSheetRef} // 🆕 Ref mới, dùng cho SettingScreen
          index={initialSnapIndex}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          handleIndicatorStyle={styles.handleIndicator}
          backgroundStyle={styles.bottomSheetBackground}
          onChange={(index) => setIsSettingOpen(index !== -1)}
        >
          {/* ✅ SỬA: Đặt SettingScreen vào bên trong BottomSheetView */}
          <SettingScreen />
        </BottomSheet>

        {isKeyboardOpen && !isPreviewOpen && currentIndex.value !== 3 && (
          <Pressable
            style={styles.keyboardBlocker}
            onPress={() => Keyboard.dismiss()}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", overflow: "hidden" },
  container: { flexDirection: "row", width: width * 4, height },
  keyboardBlocker: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 9999,
  },
  // 🆕 Styles mới cho BottomSheet
  bottomSheetBackground: {
    backgroundColor: "#2f2f2f",
  },
  handleIndicator: {
    backgroundColor: "#ccc",
  },
  contentContainer: {
    flex: 1,
  },
  // 🗑️ Đã xóa: friendSheet và handleBar styles cũ không cần thiết
});
