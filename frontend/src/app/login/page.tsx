'use client';
import API from "@/lib/api";
import { saveToken } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [password, setPassword] = useState('')
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await API.post('/api/auth/login', { email, password })
            saveToken(res.data.token)
            router.replace('/')
        } catch (error: any) {
            setError(error?.response?.data?.message || 'Error')
        }
    }

    return (
        <div className="min-h-150 flex items-center justify-center bg-black-950 text-white">
            <form onSubmit={submit} className="w-full max-w-xs space-y-3">
                <h1 className="text-2xl text-left mb-14 ">Login</h1>

                <input
                    className="w-full p-3 text-sm bg-transparent border border-white"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="w-full p-3 text-sm bg-transparent border border-white"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center justify-between pt-2">
                    <button
                        className="px-5 py-4 text-m bg-gray-600 hover:bg-gray-700 transition-colors"
                    >
                        Sign in
                    </button>
                    <Link
                        className="text-s text-gray-400 hover:underline"
                        href="/register"
                    >
                        Need an account?Sign up
                    </Link>
                </div>
                {error && <div className="mt-2 text-red-400 text-xs">{error}</div>}
            </form>
        </div>

    )
}