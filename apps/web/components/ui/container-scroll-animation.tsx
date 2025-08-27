"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ContainerScrollProps {
  children: React.ReactNode;
  titleComponent?: React.ReactNode | null;
  className?: string;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  children,
  titleComponent,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);

  return (
    <div
      ref={containerRef}
      className={`h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20 ${className}`}
    >
      <div className="py-10 md:py-40 w-full relative">
        {titleComponent && (
          <motion.div
            style={{
              scale,
            }}
            className="div max-w-5xl mx-auto text-center"
          >
            {titleComponent}
          </motion.div>
        )}
        <motion.div
          style={{
            scale,
            rotateX: rotate,
          }}
          className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full bg-gray-100 rounded-2xl shadow-2xl"
        >
          <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 md:rounded-2xl md:p-4">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};