// src/components/handleEmailLoginAndStoreUser.ts
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/src/firebaseConfig"; 

export const handleEmailLoginAndStoreUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
      });
    }
  }

  return user;
};

