'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/generate';
  const error = searchParams.get('error');
  const [loading, setLoading] = useState<'google' | 'kakao' | null>(null);

  if (error === 'auth') {
    toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
  }

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-sm pt-20">
      <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">로그인</h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        소셜 계정으로 간편하게 시작하세요
      </p>
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading === 'google' ? '연결 중...' : 'Google로 계속하기'}
        </button>

        <button
          type="button"
          onClick={() => handleSocialLogin('kakao')}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] px-4 py-2.5 text-sm font-medium text-[#191919] transition hover:bg-[#FDD835] disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#191919">
            <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.8 5.108 4.509 6.457-.196.734-.71 2.66-.813 3.073-.127.508.186.5.39.364.16-.107 2.55-1.736 3.585-2.44.764.107 1.553.164 2.329.164 5.523 0 10-3.463 10-7.691C22 6.463 17.523 3 12 3z" />
          </svg>
          {loading === 'kakao' ? '연결 중...' : '카카오로 계속하기'}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">
        로그인 시 서비스 이용약관에 동의하게 됩니다
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[300px] items-center justify-center"><p className="text-sm text-gray-400">로딩 중...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
