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
const firebaseConfig = {
  apiKey: "AIzaSyDZVAxSNVaAzCdZBS-5Wx1r_1aFNQgl5tE",
  authDomain: "ebikerental-e1178.firebaseapp.com",
  projectId: "ebikerental-e1178",
  storageBucket: "ebikerental-e1178.appspot.com", // sửa lại đúng .app**spot**
  messagingSenderId: "319881394948",
  appId: "1:319881394948:web:a2141deb07a03c5054ae51",
};

// ✅ Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Khởi tạo các dịch vụ Firebase cần dùng
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ✅ Export các thành phần cần dùng
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
