import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  async get(key) {
    const value = await AsyncStorage.getItem(key);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },

  async set(key, value) {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, data);
  },

  async remove(key) {
    await AsyncStorage.removeItem(key);
  },
};
