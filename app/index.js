import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const isLoggedIn = false;
      router.replace(isLoggedIn ? "/app" : "/welcome");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
