// Login by email / password

import { auth, db, signInWithEmailAndPassword, doc, getDoc, setDoc } from "@/src/firebaseConfig"; 

const handleEmailLogin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Lưu thông tin user mới vào Firestore
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
        provider: "email"
      });
    }

    console.log('Đăng nhập thành công:', user.email);
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error.message);
  }
};

export { handleEmailLogin };