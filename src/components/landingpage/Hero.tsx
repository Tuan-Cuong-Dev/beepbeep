'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';

export default function Hero() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const data = userDoc.exists() ? userDoc.data() : {};
          const fetchedRole = data?.role || 'Customer';
          console.log('✅ Role from Firestore:', fetchedRole);
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
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-75"
        style={{ backgroundImage: "url('/assets/images/Cover2.jpg')" }}
      />
      <div className="absolute inset-0 bg-black opacity-40" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl px-4 pt-16 pb-12 flex flex-col items-center gap-10 text-center">
        <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] text-white">
          <span className="block">Rent your ride</span>
          <span className="block text-[#00d289]"> in a beep!</span>
        </h1>
        {/* Button with variant */}
        <Link href="/rent" passHref>
          <Button variant="greenOutline" className="mt-2 text-lg px-6 py-3 rounded-sm shadow-lg">
          🛵 RENT A RIDE
          </Button>
        </Link>
      </div>
    </section>
  );
}
