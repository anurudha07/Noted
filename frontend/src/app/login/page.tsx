'use client';
import API from "@/lib/api";
import { saveToken } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  const googleUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        { email, password }
      );

      const token = res?.data?.token;
      const user = res?.data?.user;

      saveToken(token);

      if (user) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name, // ✅ fix: store username
          })
        );
      }

      router.replace('/dashboard');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Error');
      } else {
        setError('Error');
      }
    }
  };

  return (
    <div className="min-h-150 flex items-center justify-center bg-black-950 text-white">
      <form onSubmit={submit} className="w-full max-w-xs space-y-3">
        <h1 className="text-2xl text-left mb-14 ">Login</h1>

        <input
          className="w-full p-3 text-sm bg-transparent border border-white focus:border-gray-400 focus:ring-0 outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 text-sm bg-transparent border border-white focus:border-gray-400 focus:ring-0 outline-none"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between pt-2">
          <button className="px-5 py-4 text-m bg-gray-600 hover:bg-gray-700 transition-colors">
            Sign in
          </button>
          <Link
            className="text-s text-gray-400 hover:underline"
            href="/register"
          >
            Need an account? Sign up
          </Link>
        </div>

        {error && <div className="mt-2 text-red-400 text-xs">{error}</div>}

        <div className="my-6 flex items-center gap-2 text-gray-400 text-xs">
          <hr className="flex-1 border-gray-700" />
          <span>OR</span>
          <hr className="flex-1 border-gray-700" />
        </div>

        <a
          href={googleUrl}
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-600 text-white rounded bg-transparent hover:bg-gray-800/40 transition-colors"
          aria-label="Google"
        >
          <Image src="/Google_logo.png" alt="Google" width={18} height={18} />
          <span className="leading-none font-medium">Google</span>
        </a>
      </form>
    </div>
  );
}
