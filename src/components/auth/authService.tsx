// Xử lý xác thực đăng nhập với google account
// Xử lý signout

import { auth, provider, db, signInWithPopup } from "@/src/firebaseConfig";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";

const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("✅ Signed out successfully");
    window.location.href = "/"; // hoặc dùng router.push("/") nếu dùng Next.js router
  } catch (error) {
    console.error("❌ Error signing out:", error);
  }
};

const signInWithGoogle = async () => {
  try {
    // Hiển thị popup đăng nhập Google
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Tạo document tham chiếu tới Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // Nếu user chưa tồn tại trong Firestore, thêm mới
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        role: "Customer", // 👈 Gán role mặc định
        createdAt: serverTimestamp(), // ⏱ Dùng timestamp chuẩn
      });
    }

    console.log("✅ User signed in:", user);
    return user; // Trả về user để dùng trong ứng dụng

  } catch (error: any) {
    if (error.code === "auth/popup-closed-by-user") {
      console.warn("⚠️ Người dùng đã đóng cửa sổ đăng nhập trước khi hoàn tất.");
    } else {
      console.error("❌ Lỗi khi đăng nhập:", error);
    }
    return null;
  }
};

export { signInWithGoogle, signOutUser };
