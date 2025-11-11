import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import socket from "../../socket/socket";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TopBar({ onGoProfile, onGoMess }) {
  const [friendCount, setFriendCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const userIdRef = useRef(null); // keep latest userId for socket handlers

  // init: load token -> user -> friend count
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        // fetch user
        const res = await fetch("https://memora-be.onrender.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        const user =
          res.ok && (data.data || data.user) ? data.data || data.user : null;

        if (mounted && user) {
          setUserId(user.id || user._id); // handle _id vs id
          userIdRef.current = user.id || user._id;
        }

        // fetch friend list (your BE uses /follow/friend-list)
        const res2 = await fetch(
          "https://memora-be.onrender.com/follow/friend-list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data2 = await res2.json();
        if (mounted && res2.ok && Array.isArray(data2.friendList)) {
          setFriendCount(data2.friendList.length);
        }
      } catch (err) {
        console.error("TopBar init error:", err);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // socket handlers: use refs so handlers always see latest userId
  useEffect(() => {
    // helper to join room with latest id
    const tryJoinRoom = () => {
      const id = userIdRef.current;
      if (id && socket && socket.connected) {
        socket.emit("join_room", `user:${id}`);
        console.log("[TopBar] emitted join_room user:" + id);
      } else {
        // debug info
        console.log(
          "[TopBar] tryJoinRoom skipped; id:",
          id,
          "connected:",
          socket?.connected
        );
      }
    };

    // on connect -> join using latest id
    const onConnect = () => {
      tryJoinRoom();
    };
    socket.on("connect", onConnect);

    // friend:update handler (always uses setState)
    const onFriendUpdate = (payload) => {
      console.log("📡 [Socket] friend:update", payload);
      if (payload?.newCount !== undefined) {
        setFriendCount(payload.newCount);
      } else if (Array.isArray(payload?.friendList)) {
        setFriendCount(payload.friendList.length);
      } else if (typeof payload?.count === "number") {
        setFriendCount(payload.count);
      } else {
        // last resort: refetch friend list from API (optional)
        console.log(
          "[TopBar] friend:update payload unrecognized, consider refetching."
        );
      }
    };
    socket.on("friend:update", onFriendUpdate);

    // immediately try joining in case we already have id + socket connected
    tryJoinRoom();

    // cleanup
    return () => {
      socket.off("connect", onConnect);
      socket.off("friend:update", onFriendUpdate);
      // attempt leave room with latest id
      const id = userIdRef.current;
      if (id && socket && socket.connected) {
        socket.emit("leave_room", `user:${id}`);
        console.log("[TopBar] emitted leave_room user:" + id);
      }
    };
  }, []); // register socket listeners once

  // keep userIdRef in sync with state whenever it changes
  useEffect(() => {
    userIdRef.current = userId;
    // if userId just became available, try to join immediately
    if (userId) {
      if (socket && socket.connected) {
        socket.emit("join_room", `user:${userId}`);
        console.log("[TopBar] join_room from userId effect:", userId);
      }
    }
  }, [userId]);

  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.topCircle} onPress={onGoProfile}>
        <Ionicons name="person-circle-outline" size={30} color="#fff" />
      </TouchableOpacity>

      <View style={styles.topItem}>
        <Ionicons name="people-outline" size={20} color="#fff" />
        <Text style={styles.topText}> {friendCount} người bạn </Text>
      </View>

      <TouchableOpacity style={styles.topCircle} onPress={onGoMess}>
        <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  topItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    backgroundColor: "rgba(128,128,128,0.4)",
    minHeight: 40,
  },
  topCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(128,128,128,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  topText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 6,
  },
});
