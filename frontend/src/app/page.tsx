'use client';

import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import developerAnimation from '../../.../../public/developer-animation.json';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Home() {
  // cat position state
  const [catPos, setCatPos] = useState<{ x: number; y: number }>({
    x: 200,
    y: 200,
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setCatPos({
      x: e.clientX - 50, // adjust to center the cat
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
            <span className="text-xl text-gray-600">Noted</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main
        className="flex-1 text-center max-w-3xl mx-auto px-4 relative z-10"
  style={{ marginTop: '8.2rem' }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-xl sm:text-sm md:text-base font-medium text-white mb-10"
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

          <ul className="list-disc text-gray-400 text-left max-w-md mx-auto pl-5 space-y-1 text-sm mb-3">
            <li>Sign up at ease</li>
            <li>Take notes</li>
            <li>Enjoy !</li>
          </ul>

          <div className="mt-12 flex justify-center">
            <Link
              href="/login"
              className="text-gray-600 text-sm font-medium inline-flex items-center gap-1 transform transition-transform duration-150 hover:translate-x-1"
            >
              Continue →
            </Link>
          </div>
        </motion.div>

        {/* Lottie SVG */}
        <div className="mt-1 flex justify-center pb-12">
          <Lottie
            animationData={developerAnimation}
            loop
            autoplay
            style={{ width: 200, height: 220 }}
          />
        </div>
      </main>

{/* Walking Cat */}
<motion.div
  className="absolute pointer-events-none z-0"
  animate={{ left: catPos.x, top: catPos.y }}
  transition={{ type: 'spring', stiffness: 40, damping: 12 }}
  style={{ width: 90, height: 70 }} // ⬅️ slightly bigger
>
  <Image
    src="/walking-cat.gif"
    alt="walking cat"
    width={90}
    height={70}
    unoptimized
  />
</motion.div>



      {/* Footer */}
      <footer className="bg-black-950 py-4 relative z-10">
        <div className="text-center text-gray-500 text-sm">
          Developed by{' '}
          <Link
            href="https://portfolio-kxhf.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Anurudha
          </Link>
        </div>
      </footer>
    </div>
  );
}
