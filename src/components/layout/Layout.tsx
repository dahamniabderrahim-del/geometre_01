import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingSocial } from "@/components/social/FloatingSocial";
import { ChatWidget } from "@/components/chat/ChatWidget";

export type ThemeTokens = {
  background?: string;
  foreground?: string;
  card?: string;
  cardForeground?: string;
  muted?: string;
  mutedForeground?: string;
  border?: string;
  input?: string;
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  accent?: string;
  accentForeground?: string;
  ring?: string;
  gradientHero?: string;
  gradientGold?: string;
};

interface LayoutProps {
  children: ReactNode;
  theme?: ThemeTokens;
}

const buildThemeStyle = (theme?: ThemeTokens) => {
  if (!theme) return undefined;

  const accent = theme.accent ?? theme.secondary;
  const accentForeground = theme.accentForeground ?? theme.secondaryForeground;
  const ring = theme.ring ?? theme.primary;
  const gradientHero =
    theme.gradientHero ??
    (theme.primary
      ? `linear-gradient(135deg, hsl(${theme.primary}) 0%, hsl(${theme.primary}) 65%, hsl(${theme.primary}) 100%)`
      : undefined);
  const gradientGold =
    theme.gradientGold ??
    (theme.secondary
      ? `linear-gradient(135deg, hsl(${theme.secondary}) 0%, hsl(${theme.secondary}) 100%)`
      : undefined);

  const entries: Array<[string, string | undefined]> = [
    ["--background", theme.background],
    ["--foreground", theme.foreground],
    ["--card", theme.card],
    ["--card-foreground", theme.cardForeground],
    ["--muted", theme.muted],
    ["--muted-foreground", theme.mutedForeground],
    ["--border", theme.border],
    ["--input", theme.input],
    ["--primary", theme.primary],
    ["--primary-foreground", theme.primaryForeground],
    ["--secondary", theme.secondary],
    ["--secondary-foreground", theme.secondaryForeground],
    ["--accent", accent],
    ["--accent-foreground", accentForeground],
    ["--ring", ring],
    ["--gradient-hero", gradientHero],
    ["--gradient-gold", gradientGold],
  ];

  const style: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (value) {
      style[key] = value;
    }
  }

  return style as React.CSSProperties;
};

export function Layout({ children, theme }: LayoutProps) {
  const themeStyle = buildThemeStyle(theme);
  return (
    <div className="min-h-screen flex flex-col" style={themeStyle}>
      <Header />
      <main className="flex-1 pt-16 md:pt-[88px]">
        {children}
      </main>
      <Footer />
      <FloatingSocial />
      <ChatWidget />
    </div>
  );
}
