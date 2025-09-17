'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import React, { useRef } from 'react';

interface ContainerScrollProps {
  children: React.ReactNode;
  titleComponent?: React.ReactNode | null;
  className?: string;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  children,
  titleComponent,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);

  return (
    <div
      ref={containerRef}
      className={`relative flex h-[60rem] items-center justify-center p-2 md:h-[80rem] md:p-20 ${className}`}
    >
      <div className='relative w-full py-10 md:py-40'>
        {titleComponent && (
          <motion.div
            style={{
              scale,
            }}
            className='div mx-auto max-w-5xl text-center'
          >
            {titleComponent}
          </motion.div>
        )}
        <motion.div
          style={{
            scale,
            rotateX: rotate,
          }}
          className='mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-2xl bg-gray-100 shadow-2xl md:h-[40rem]'
        >
          <div className='h-full w-full overflow-hidden rounded-2xl bg-gray-100 md:rounded-2xl md:p-4'>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
