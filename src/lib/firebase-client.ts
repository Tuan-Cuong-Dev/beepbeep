// Client SDK (browser only)
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
} from 'firebase/firestore';

// Đảm bảo chỉ có 1 instance dùng xuyên suốt (kể cả Fast Refresh)
declare global {
  // eslint-disable-next-line no-var
  var __BB_FIRESTORE__: Firestore | undefined;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_MSG_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Nếu đã có cache thì dùng lại
if (!globalThis.__BB_FIRESTORE__) {
  try {
    // ƯU TIÊN init với options (để bật long-polling khi chạy LAN/proxy)
    globalThis.__BB_FIRESTORE__ = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      experimentalAutoDetectLongPolling: true,
      // Nếu môi trường kén, có thể thêm:
      // useFetchStreams: false,
    });
  } catch {
    // Nếu đã có ai đó gọi getFirestore() trước → fallback dùng instance sẵn có
    globalThis.__BB_FIRESTORE__ = getFirestore(app);
  }
}

export const db = globalThis.__BB_FIRESTORE__;
