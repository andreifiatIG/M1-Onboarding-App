"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { RefreshCw } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // Redirect signed-in users to My Villas (the new homepage)
        router.replace('/my-villas');
      } else {
        // Redirect non-signed-in users to sign-in
        router.replace('/sign-in');
      }
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading while determining redirect
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card-white-teal p-8 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null; // This component will redirect before rendering content
}
