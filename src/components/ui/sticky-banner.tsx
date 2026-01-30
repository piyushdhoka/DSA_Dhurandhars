"use client";
import React, { SVGProps, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyBanner = ({
    className,
    children,
    hideOnScroll = false,
}: {
    className?: string;
    children: React.ReactNode;
    hideOnScroll?: boolean;
}) => {
    const [open, setOpen] = useState(true);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (hideOnScroll && latest > 40) {
            setOpen(false);
        } else {
            setOpen(true);
        }
    });

    if (!open) return null;

    return (
        <motion.div
            className={cn(
                "sticky inset-x-0 top-0 z-50 flex min-h-14 w-full items-center justify-center bg-transparent px-4 py-1",
                className,
            )}
            initial={{
                y: -100,
                opacity: 0,
            }}
            animate={{
                y: 0,
                opacity: 1,
            }}
            exit={{
                y: -100,
                opacity: 0,
            }}
            transition={{
                duration: 0.3,
                ease: "easeInOut",
            }}
        >
            <div className="flex items-center justify-center w-full px-12 text-center text-sm md:text-base font-medium">
                {children}
            </div>

            <button
                className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer p-1.5 hover:bg-black/10 rounded-full transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close banner"
            >
                <CloseIcon className="h-5 w-5 text-current opacity-60 hover:opacity-100 transition-opacity" />
            </button>
        </motion.div>
    );
};

const CloseIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
        </svg>
    );
};
