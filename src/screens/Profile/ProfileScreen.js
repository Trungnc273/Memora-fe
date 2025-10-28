import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { jwtDecode } from "jwt-decode";
export default function ProfileScreen({
  onGoHome,
  refreshFlag,
  onOpenFriend,
  onOpenSetting,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayImages, setDayImages] = useState({});
  const [months, setMonths] = useState([]);
  const [firstPostDate, setFirstPostDate] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const fetchPosts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ Không có token, người dùng chưa đăng nhập.");
        setLoading(false);
        return;
      }

      const res = await fetch("https://memora-be.onrender.com/post/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data?.data) {
        const posts = data.data.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setPosts(posts);

        if (posts.length > 0) {
          const firstDate = new Date(posts[0].created_at);
          setFirstPostDate(firstDate);
          generateMonths(firstDate);
        }
      }
    } catch (error) {
      console.log("❌ Lỗi khi fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonths = (startDate) => {
    const now = new Date();
    const monthsList = [];

    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();

    let year = startYear;
    let month = startMonth;

    while (
      year < now.getFullYear() ||
      (year === now.getFullYear() && month <= now.getMonth())
    ) {
      monthsList.push({
        name: `tháng ${month + 1} ${year}`,
        year,
        monthIndex: month,
      });

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    setMonths(monthsList);
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshFlag]);

  //Load user
  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.log("❌ Lỗi decode token:", err);
      }
    };

    loadUser();
  }, []);

  // 🔹 Lấy ảnh mới nhất mỗi ngày
  useEffect(() => {
    if (posts.length === 0 || months.length === 0) return;
    const images = {};
    for (const m of months) {
      const daysArray = getDaysArray(m.year, m.monthIndex);
      for (const day of daysArray) {
        if (!day) continue;
        const dayPosts = posts
          .filter((p) => {
            const d = new Date(p.created_at);
            return (
              d.getFullYear() === m.year &&
              d.getMonth() === m.monthIndex &&
              d.getDate() === day &&
              p.media?.url
            );
          })
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

        if (dayPosts.length > 0) {
          images[`${m.year}-${m.monthIndex}-${day}`] = dayPosts[0].media.url;
        }
      }
    }
    setDayImages(images);
  }, [posts, months]);

  const getDaysArray = (year, monthIndex) => {
    const days = [];
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const lastDate = new Date(year, monthIndex + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    return days;
  };

  const splitWeeks = (daysArray) => {
    const weeks = [];
    for (let i = 0; i < daysArray.length; i += 7) {
      const week = daysArray.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Đang tải ảnh...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.display_name
                ? user.display_name.charAt(0).toUpperCase()
                : "?"}
            </Text>
          </View>
          <Text style={styles.username}>
            {user?.display_name || "Người dùng"}
          </Text>
        </View>
        <View style={styles.icons}>
          <TouchableOpacity onPress={onOpenFriend}>
            <Ionicons name="people-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenSetting}>
            <Ionicons
              name="settings-outline"
              size={28}
              color="#fff"
              style={{ marginLeft: 30 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onGoHome} style={{ marginLeft: 30 }}>
            <Ionicons name="chevron-forward-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scroll Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {firstPostDate ? (
          <Text style={styles.infoText}>
            Locket đầu tiên của bạn đã được gửi vào{" "}
            <Text style={{ fontWeight: "600" }}>
              ngày {firstPostDate.getDate()} tháng{" "}
              {firstPostDate.getMonth() + 1}, {firstPostDate.getFullYear()}
            </Text>
          </Text>
        ) : (
          <Text style={styles.infoText}>Chưa có Locket nào được gửi.</Text>
        )}

        {months.map((m, i) => {
          const daysArray = getDaysArray(m.year, m.monthIndex);
          const weeks = splitWeeks(daysArray);

          return (
            <View key={i} style={styles.monthBox}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{m.name}</Text>
              </View>
              <View style={{ padding: 10 }}>
                {weeks.map((week, wIndex) => (
                  <View key={wIndex} style={styles.weekRow}>
                    {week.map((day, dIndex) => {
                      const key = day
                        ? `${m.year}-${m.monthIndex}-${day}`
                        : null;
                      const imageUrl = key ? dayImages[key] : null;

                      return (
                        <View key={dIndex} style={styles.dayCell}>
                          {imageUrl ? (
                            <Image
                              source={{ uri: `${imageUrl}?t=${Date.now()}` }}
                              style={styles.dotImage}
                            />
                          ) : day ? (
                            <View style={styles.dot} />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d", paddingTop: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2f2f2f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: { color: "#fff", fontWeight: "bold" },
  username: { color: "#fff", fontSize: 17, fontWeight: "600" },
  icons: { flexDirection: "row", alignItems: "center" },
  infoText: {
    color: "#aaa",
    textAlign: "center",
    marginVertical: 25,
    fontSize: 15,
    paddingHorizontal: 25,
  },
  monthBox: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  monthHeader: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  monthTitle: { color: "#fff", fontWeight: "600", fontSize: 16 },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  dayCell: {
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#444",
  },
  dotImage: {
    width: 40,
    height: 40,
    borderRadius: 5,
  },
});
