// src/screens/Profile/FriendScreen.js
import React, { useEffect, useState, useRef, useMemo } from "react";
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
  Alert,
  Modal,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import jwtDecode from "jwt-decode"; // note: you had `import { jwtDecode } from "jwt-decode";` which is incorrect

export default function FriendScreen({ refreshFlag = 0 }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(true);

  const [followList, setFollowList] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(true);

  const [isSearching, setIsSearching] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const debounceRef = useRef(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [actionLoadingMap, setActionLoadingMap] = useState({});
  const [inputWidth] = useState(new Animated.Value(1));

  const friendIdSet = useMemo(() => {
    const s = new Set();
    friends.forEach((f) => f._id && s.add(String(f._id)));
    return s;
  }, [friends]);

  const followerIdSet = useMemo(() => {
    const s = new Set();
    followers.forEach((f) => f._id && s.add(String(f._id)));
    return s;
  }, [followers]);

  const followListIdSet = useMemo(() => {
    const s = new Set();
    followList.forEach((f) => f._id && s.add(String(f._id)));
    return s;
  }, [followList]);

  // ------------------- modal state for "X" menu and confirm -------------------
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [unfollowLoading, setUnfollowLoading] = useState(false);

  // ------------------ API fetchers ------------------
  const fetchFriends = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await fetch(
        "https://memora-be.onrender.com/follow/friend-list",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json && json.friendList) setFriends(json.friendList);
      else setFriends([]);
    } catch (err) {
      console.log("❌ Lỗi khi tải danh sách bạn bè:", err);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    setFollowersLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await fetch(
        "https://memora-be.onrender.com/follow/follower-list",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json && json.followerList) setFollowers(json.followerList);
      else setFollowers([]);
    } catch (err) {
      console.log("❌ Lỗi khi tải follower-list:", err);
      setFollowers([]);
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchFollowList = async () => {
    setFollowListLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await fetch(
        "https://memora-be.onrender.com/follow/follow-list",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (json && json.followList) setFollowList(json.followList);
      else if (Array.isArray(json)) setFollowList(json);
      else setFollowList([]);
    } catch (err) {
      console.log("❌ Lỗi khi tải follow-list:", err);
      setFollowList([]);
    } finally {
      setFollowListLoading(false);
    }
  };

  // ------------------ get id from token using jwt-decode ------------------
  const getIdFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return (
        decoded.sub ||
        decoded._id ||
        decoded.id ||
        decoded.userId ||
        decoded.uid ||
        (decoded.data && (decoded.data._id || decoded.data.id)) ||
        null
      );
    } catch (e) {
      console.warn("jwtDecode failed:", e);
      return null;
    }
  };

  const fetchCurrentUserId = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return null;
      const idFromToken = getIdFromToken(token);
      if (idFromToken) {
        setCurrentUserId(String(idFromToken));
        return String(idFromToken);
      }
      // fallback: /user
      try {
        const res = await fetch("https://memora-be.onrender.com/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const id =
            (json && (json._id || (json.data && json.data._id))) || null;
          if (id) {
            setCurrentUserId(String(id));
            return String(id);
          }
        }
      } catch (e) {}
      return null;
    } catch (err) {
      console.log("Không thể lấy current user id:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchCurrentUserId().catch(() => {});
    fetchFriends();
    fetchFollowers();
    fetchFollowList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshFlag]);

  // ------------------ search ------------------
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
    setSearchResults([]);
    Keyboard.dismiss();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    Animated.timing(inputWidth, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (!searchValue || searchValue.trim() === "") {
      setSearchResults([]);
      setSearchLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(searchValue);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue]);

  const doSearch = async (query) => {
    setSearchLoading(true);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setSearchLoading(false);
        return;
      }

      if (!currentUserId) {
        await fetchCurrentUserId();
      }

      const res = await fetch(
        `https://memora-be.onrender.com/user/search?query=${encodeURIComponent(
          query
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );

      if (!res.ok) throw new Error("Network response not ok");
      const json = await res.json();
      setSearchResults(Array.isArray(json) ? json : []);
    } catch (err) {
      if (err.name === "AbortError") {
      } else {
        console.log("❌ Lỗi search:", err);
      }
    } finally {
      setSearchLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSelectUser = (user) => {
    setSearchValue("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  // ------------------ follow actions ------------------
  const doFollowAction = async (followeeId) => {
    if (!followeeId) return;
    setActionLoadingMap((p) => ({ ...p, [followeeId]: true }));

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token");

      const res = await fetch("https://memora-be.onrender.com/follow/follow", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followeeId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server lỗi: ${res.status} ${text}`);
      }

      await Promise.all([fetchFriends(), fetchFollowers(), fetchFollowList()]);
    } catch (err) {
      console.log("❌ Lỗi follow action:", err);
      Alert.alert("Lỗi", "Không thể thực hiện hành động. Thử lại sau.");
    } finally {
      setActionLoadingMap((p) => ({ ...p, [followeeId]: false }));
    }
  };

  const handleAccept = async (followerId) => {
    await doFollowAction(followerId);
  };

  const handleDecline = async (followerId) => {
    try {
      setFollowers((prev) => prev.filter((f) => f._id !== followerId));
      await Promise.all([fetchFollowers(), fetchFollowList()]);
    } catch (err) {
      console.log("❌ Lỗi decline:", err);
      Alert.alert("Lỗi", "Không thể từ chối yêu cầu. Thử lại sau.");
    }
  };

  const handleAddFromSearch = async (userId) => {
    await doFollowAction(userId);
    setSearchValue("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  // ------------------ UNFOLLOW (xóa bạn) ------------------
  const doUnfollow = async (userBId) => {
    if (!userBId) return;
    setUnfollowLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No token");

      const res = await fetch(
        "https://memora-be.onrender.com/follow/unfollow",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userB: userBId }),
        }
      );

      const text = await res.text();
      if (!res.ok) {
        console.error("Unfollow error:", res.status, text);
        throw new Error(text || "Unfollow failed");
      }

      // remove friend locally
      setFriends((prev) =>
        prev.filter((f) => String(f._id) !== String(userBId))
      );
      // refresh lists to be safe
      await Promise.all([fetchFriends(), fetchFollowers(), fetchFollowList()]);

      Alert.alert("Xóa bạn", "Đã xóa bạn thành công.");
    } catch (err) {
      console.error("❌ Unfollow failed:", err);
      Alert.alert("Lỗi", "Không thể xóa bạn. Thử lại sau.");
    } finally {
      setUnfollowLoading(false);
      setConfirmModalVisible(false);
      setActionModalVisible(false);
      setSelectedFriend(null);
    }
  };

  // ------------------ UI handlers for action sheet ------------------
  const onPressRemoveIcon = (friend) => {
    setSelectedFriend(friend);
    setActionModalVisible(true);
  };

  const onChooseHide = () => {
    // placeholder: thực hiện hide friend nếu bạn có endpoint
    Alert.alert("Ẩn bạn bè", "Chức năng ẩn chưa được triển khai.");
    setActionModalVisible(false);
    setSelectedFriend(null);
  };

  const onChooseBlock = async () => {
    // placeholder block: bạn có thể gọi API blockUser ở đây
    Alert.alert("Chặn bạn bè", "Chức năng chặn chưa được triển khai.");
    setActionModalVisible(false);
    setSelectedFriend(null);
  };

  const onChooseDelete = () => {
    // show confirm modal
    setActionModalVisible(false);
    setConfirmModalVisible(true);
  };

  // ------------------ render items ------------------
  const renderResultItem = ({ item }) => {
    const itemId = item && item._id ? String(item._id) : null;
    const isSelf = currentUserId && itemId && String(currentUserId) === itemId;
    const isFriend = itemId ? friendIdSet.has(itemId) : false;
    const isFollower = itemId ? followerIdSet.has(itemId) : false;
    const isFollowingPending = itemId ? followListIdSet.has(itemId) : false;
    const actionLoading = !!actionLoadingMap[itemId];

    return (
      <View style={styles.friendItem}>
        <TouchableOpacity
          style={styles.friendLeft}
          onPress={() => handleSelectUser(item)}
        >
          {item?.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <FontAwesome5 name="user" size={20} color="#fff" />
            </View>
          )}

          <Text style={styles.friendName}>
            {item.display_name || item.username || "Người dùng"}
          </Text>
        </TouchableOpacity>

        {isSelf ? (
          <View style={{ width: 1, height: 1 }} />
        ) : isFriend ? (
          <Text style={styles.mutedText}>Bạn bè</Text>
        ) : isFollower || isFollowingPending ? (
          <Text style={styles.mutedText}>Chờ chấp nhận</Text>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddFromSearch(item._id)}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.addText}>+ Thêm</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFollowerItem = ({ item }) => {
    const actionLoading = !!actionLoadingMap[item._id];
    return (
      <View style={styles.requestItem}>
        <View style={styles.friendLeft}>
          <View style={styles.avatarSmall}>
            <FontAwesome5 name="user" size={16} color="#fff" />
          </View>
          <Text style={styles.friendName}>
            {item.display_name || item.username}
          </Text>
        </View>

        <View style={styles.requestButtons}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(item._id)}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.acceptText}>Chấp nhận</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDecline(item._id)}
            disabled={actionLoading}
          >
            <Text style={styles.declineText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ------------------ main UI ------------------
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
            returnKeyType="search"
          />
          {searchLoading && (
            <ActivityIndicator size="small" style={{ marginLeft: 8 }} />
          )}
        </Animated.View>

        {isSearching && (
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchValue ? (
        <>
          {searchLoading && searchResults.length === 0 ? (
            <Text style={styles.emptyText}>Đang tìm...</Text>
          ) : searchResults.length === 0 ? (
            <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={renderResultItem}
              style={styles.searchResultList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.findOtherApp}>
            <View style={styles.findInnerBox}>
              <Ionicons name="person-add" size={16} color="#aaa" />
              <Text style={styles.findText}>Find friends from other apps</Text>
            </View>

            <View style={styles.appRow}>
              {[
                {
                  uri: "https://cdn-icons-png.flaticon.com/512/5968/5968771.png",
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
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.appIcon}
                      />
                    ) : (
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    )}
                  </View>
                  <Text style={styles.appLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {followersLoading ? null : followers && followers.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
              <FlatList
                data={followers}
                keyExtractor={(item) => item._id}
                renderItem={renderFollowerItem}
                style={{ marginBottom: 10 }}
              />
            </>
          ) : null}

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

                  <TouchableOpacity onPress={() => onPressRemoveIcon(item)}>
                    <Ionicons name="close" size={20} color="#aaa" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Bạn chưa có bạn nào</Text>
              }
            />
          )}
        </>
      )}

      {/* Action sheet modal (like image1 + image2) */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setActionModalVisible(false);
            setSelectedFriend(null);
          }}
        />
        <View style={styles.actionSheet}>
          <Text style={styles.actionTitle}> </Text>

          <TouchableOpacity style={styles.actionRow} onPress={onChooseHide}>
            <View style={styles.actionIcon}>
              <Ionicons name="eye-off-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.actionText}>Ẩn bạn bè</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={onChooseDelete}>
            <View style={styles.actionIcon}>
              <Ionicons name="person-remove-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.actionText}>Xóa bạn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
            onPress={onChooseBlock}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="ban-outline" size={20} color="#ff4444" />
            </View>
            <Text style={[styles.actionText, { color: "#ff4444" }]}>
              Chặn bạn bè
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Confirm delete modal (image 3) */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>
              {`Xóa ${
                selectedFriend?.display_name || "người này"
              } khỏi Locket của bạn?`}
            </Text>
            <Text style={styles.confirmText}>
              Các bạn sẽ không còn có thể gửi ảnh cho nhau trên Locket. Lịch sử
              của bạn sẽ có thể được phục hồi nếu các bạn thêm lại nhau.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => {
                  setConfirmModalVisible(false);
                  setSelectedFriend(null);
                }}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={() => doUnfollow(selectedFriend?._id)}
                disabled={unfollowLoading}
              >
                {unfollowLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Xóa</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// styles (kept and added modal styles)
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
  avatarSmall: {
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
  searchResultList: {
    maxHeight: 300,
    marginBottom: 10,
  },
  requestItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#444",
  },
  requestButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#2E8A57",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  acceptText: {
    color: "#fff",
    fontSize: 13,
  },
  declineButton: {
    backgroundColor: "#444",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  declineText: {
    color: "#fff",
    fontSize: 13,
  },
  addButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addText: {
    color: "#fff",
    fontSize: 13,
  },
  mutedText: {
    color: "#aaa",
    fontSize: 13,
  },

  // modal / action sheet styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  actionSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  actionIcon: {
    width: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionText: {
    color: "#fff",
    fontSize: 18,
  },

  // confirm modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  confirmBox: {
    width: "100%",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 20,
  },
  confirmTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  confirmText: {
    color: "#ddd",
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmCancel: {
    flex: 1,
    marginRight: 8,
    backgroundColor: "#2C2C2C",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmCancelText: {
    color: "#fff",
    fontSize: 16,
  },
  confirmDelete: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#d9534f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmDeleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
