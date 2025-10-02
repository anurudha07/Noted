'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import Link from 'next/link';
import Image from 'next/image';

type Pos = { x: number; y: number };

export default function Home(): React.ReactElement {
  const [catPos, setCatPos] = useState<Pos>({ x: 200, y: 200 });
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch('/developer-animation.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load animation');
        return res.json();
      })
      .then((data) => setAnimationData(data))
      .catch(() => setAnimationData(null));
  }, []);

  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setCatPos({
      x: e.clientX - 50,
      y: e.clientY - 50,
    });
  };

  return (
    <div
      onClick={handleClick}
      className="w-full min-h-screen bg-black-950 text-white flex flex-col relative overflow-hidden cursor-pointer"
    >
      {/* Logo */}
      <header className="w-full bg-black-950 relative z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-20 py-3">
          <div className="flex items-center gap-2 text-base font-bold text-blue-600">
            <span className="text-lg text-gray-600">Noted</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 text-center max-w-3xl mx-auto px-4 relative z-10" style={{ marginTop: '8.2rem' }}>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-sm sm:text-sm  text-white mb-10 "
        >
          Welcome to <span className="text-gray-600">Noted,</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-gray-400 text-sm"
          style={{ marginTop: '0.5rem' }}
        >
          <p className="mb-3">A clean, minimal yet secured note taking app.</p>

          <ul className="list-disc text-gray-400 text-left max-w-md mx-auto pl-5 space-y-1 text-xs mb-3">
            <li>Sign up at ease</li>
            <li>Take notes</li>
            <li>Enjoy !</li>
          </ul>

          <div className="mt-12 flex justify-center">
            <Link
              href="/login"

              className="text-sm xs:text-lg text-gray-600  inline-flex items-center gap-1 transform transition-transform duration-150 hover:translate-x-1"
            >
              Continue →
            </Link>
          </div>
        </motion.div>

        {/* Lottie */}
        <div className="mt-15 flex justify-center pb-12">
          <div className="w-48 h-28">
            {animationData ? (
              <Lottie animationData={animationData} loop autoplay style={{ width: '100%', height: '100%' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Animation</div>
            )}
          </div>
        </div>
      </main>

      {/* Walking Cat */}
      <motion.div
        className="pointer-events-none z-0"
        animate={{ left: catPos.x, top: catPos.y }}
        transition={{ type: 'spring', stiffness: 40, damping: 12 }}
        style={{ position: 'absolute', left: catPos.x, top: catPos.y, width: 90, height: 70 }}
      >
        <Image src="/walking-cat.gif" alt="walking cat" width={90} height={70} unoptimized />
      </motion.div>

      {/* Footer */}
      <footer className="bg-black-950 py-4 relative z-10">
        <div className="text-center text-gray-500 text-sm">
          Developed by{' '}
          <Link href="https://portfolio-kxhf.onrender.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            Anurudha
          </Link>
        </div>
      </footer>
    </div>
  );
}
