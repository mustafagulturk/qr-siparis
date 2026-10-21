import type { ComponentProps } from "react";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition",
        "disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "secondary" && "border border-stone-300 bg-white hover:bg-stone-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-stone-600 hover:bg-stone-100",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none transition",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-stone-200 bg-white p-5 shadow-sm", className)} {...props} />;
}

export { cx };
