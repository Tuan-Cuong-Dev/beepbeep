// src/firebaseConfig.ts
// ✅ Cấu hình và khởi tạo Firebase (Client SDK)

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

// 🔐 Cấu hình Firebase (nên dùng biến môi trường trong production)
// Cần chuyển đổi 2 authDomain này : "ebikerental-e1178.firebaseapp.com","auth.beepbeep.vn",
// Khi nào trả tiền thì vào Verify : "auth.beepbeep.vn" trong firebase là xong
export const firebaseConfig = {
  apiKey: "AIzaSyDZVAxSNVaAzCdZBS-5Wx1r_1aFNQgl5tE",
  authDomain: "ebikerental-e1178.firebaseapp.com",
  projectId: "ebikerental-e1178",
  storageBucket: "ebikerental-e1178.appspot.com", // sửa lại đúng .app**spot**
  messagingSenderId: "319881394948",
  appId: "1:319881394948:web:a2141deb07a03c5054ae51",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export {
  auth,
  db,
  provider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  doc,
  setDoc,
  getDoc,
};