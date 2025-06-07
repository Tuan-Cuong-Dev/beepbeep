import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/src/firebaseConfig";

/**
 * Custom hook để lấy thông tin user hiện tại từ Firebase Authentication.
 * @returns { currentUser, loading } - currentUser: thông tin user, loading: trạng thái đang tải.
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe(); // Clean up listener khi component unmount
  }, []);

  return { currentUser, loading };
}
