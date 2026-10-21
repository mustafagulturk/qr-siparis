export const TAGS = {
  acili: { label: "Acılı", icon: "🌶️", className: "bg-red-50 text-red-700" },
  vejetaryen: { label: "Vejetaryen", icon: "🌱", className: "bg-green-50 text-green-700" },
  glutensiz: { label: "Glutensiz", icon: "🌾", className: "bg-amber-50 text-amber-800" },
  sef: { label: "Şefin önerisi", icon: "⭐", className: "bg-violet-50 text-violet-700" },
} as const;

export type Tag = keyof typeof TAGS;
export const TAG_KEYS = Object.keys(TAGS) as Tag[];
export const isTag = (t: string): t is Tag => t in TAGS;
