'use client';
export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveToken } from '@/lib/auth';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }
    if (token) {
      saveToken(token);
      router.replace('/dashboard');
    } else {
      router.replace('/login?error=missing_token');
    }
  }, [token, error, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Signing you in…</div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
