const admin = require("firebase-admin");

// Khởi tạo Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdminRole(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: "Admin" });
    console.log(`✅ Đã gán quyền ADMIN cho user có UID: ${uid}`);
  } catch (error) {
    console.error("❌ Lỗi khi gán quyền:", error);
  }
}

// 🔁 Thay bằng UID thật của user (lấy trong Firebase Console > Authentication)
const userUID = "wXSSUNf2YcfcqihfhWxZXUgfspz2";
setAdminRole(userUID);
