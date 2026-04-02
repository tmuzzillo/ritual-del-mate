"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { SetCard } from "@/components/shop/set-card";
import type { MateSet } from "@/types";

interface SetsCarouselProps {
  sets: MateSet[];
}

export function SetsCarousel({ sets }: SetsCarouselProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      {/* Track externo para los constraints del drag */}
      <div ref={constraintsRef} className="overflow-hidden">
        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          className="flex gap-4 cursor-grab active:cursor-grabbing px-4 sm:px-6 pb-4"
          style={{ width: "max-content" }}
        >
          {sets.map((set, i) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              className="w-[220px] sm:w-[260px] flex-shrink-0"
            >
              <SetCard set={set} />
            </motion.div>
          ))}

          {/* CTA al final del carrusel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: sets.length * 0.08 }}
            className="w-[160px] flex-shrink-0 flex items-center justify-center"
          >
            <Link
              href="/sets"
              className="flex flex-col items-center gap-2 text-brand-orange font-semibold text-sm hover:gap-3 transition-all group"
            >
              <span className="h-12 w-12 rounded-full border-2 border-brand-orange flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
              Ver todos los sets
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Fade gradiente derecho — hint de scroll */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-brand-cream to-transparent" />
    </div>
  );
}
