import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-2xl font-medium transition duration-200";

const variantStyles = {
  primary:
    "bg-[#5d6bff] text-white shadow-[0_16px_40px_rgba(93,107,255,0.30)] hover:bg-[#7280ff]",
  secondary:
    "bg-white/7 text-white backdrop-blur-sm hover:bg-white/10",
  dark: "bg-[#111827] text-white hover:bg-[#1f2937]",
};

const sizeStyles = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-7 py-4 text-base",
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
