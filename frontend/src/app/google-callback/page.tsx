'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveToken } from '@/lib/auth';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params?.get('token');
  const error = params?.get('error');

  useEffect(() => {
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }
    if (token) {
      saveToken(token);
      router.replace('/');
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
