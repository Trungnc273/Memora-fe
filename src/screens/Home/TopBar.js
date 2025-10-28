import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TopBar({ onGoProfile, friendCount = 0, onGoMess }) {
  return (
    <View style={styles.topBar}>
      {/* Profile (circle) */}
      <TouchableOpacity style={styles.topCircle} onPress={onGoProfile}>
        <Ionicons name="person-circle-outline" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Friends (rectangle with text) */}
      <View style={styles.topItem}>
        <Ionicons name="people-outline" size={20} color="#fff" />
        <Text style={styles.topText}> {friendCount} người bạn </Text>
      </View>

      {/* Messages (circle) */}
      <TouchableOpacity style={styles.topCircle}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={26}
          color="#fff"
          onPress={onGoMess}
        />
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
    backgroundColor: "rgba(128,128,128,0.4)", // ô dài mờ
    minHeight: 40,
  },
  topCircle: {
    width: 40,
    height: 40,
    borderRadius: 20, // tròn
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
