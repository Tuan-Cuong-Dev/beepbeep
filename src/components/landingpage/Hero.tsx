'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/src/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const data = userDoc.exists() ? userDoc.data() : {};
          const fetchedRole = data?.role || 'Customer';
          setRole(fetchedRole);
        } catch (err) {
          console.error('❌ Error fetching user role:', err);
          setRole('Customer');
        }
      } else {
        setRole('Customer');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
  <section className="relative min-h-[60vh] md:min-h-[80vh] lg:min-h-screen flex items-center justify-center overflow-hidden">

    {/* Mobile image */}
    <div
      className="absolute inset-0 bg-center bg-cover block md:hidden"
      style={{
        backgroundImage: "url('/assets/images/Cover_mobile.jpg')",
      }}
    />

    {/* Desktop image */}
    <div
      className="absolute inset-0 bg-center bg-cover hidden md:block"
      style={{
        backgroundImage: "url('/assets/images/Cover-desktop.jpg')",
      }}
    />

    {/* Overlay */}
    <div className="absolute inset-0 bg-black opacity-30 md:opacity-40" />

    {/* Nội dung */}
    <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 pt-20 pb-12 flex flex-col items-center gap-8 text-center">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white drop-shadow-md">
        <span className="block">Rent your ride</span>
        <span className="block text-[#00d289]">in a beep!</span>
      </h1>

      <Button
        variant="greenOutline"
        onClick={() => router.push('/map')}
        className="text-base sm:text-lg px-6 py-3 rounded shadow-lg"
      >
        🛵 Explore Bíp Bíp
      </Button>
    </div>
  </section>

  );
}
