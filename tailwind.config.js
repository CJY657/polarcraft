/** @type {import('tailwindcss').Config} */

// 这是 Tailwind CSS 配置文件
// 它定义了项目中使用的样式和主题扩展
// 有关配置选项的详细信息，请参阅 https://tailwindcss.com/docs/configuration

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom game colors
        cyan: {
          400: '#64c8ff',
          500: '#4090ff',
        },
        orange: {
          400: '#ffb464',
          500: '#ff9030',
        },
        // Polarization colors
        polarization: {
          0: '#ff4444',    // 0° horizontal - red
          45: '#ffaa00',   // 45° diagonal - orange
          90: '#44ff44',   // 90° vertical - green
          135: '#4444ff',  // 135° diagonal - blue
        },
        // Clay claymation palette
        clay: {
          canvas: '#fffaf0',
          'surface-soft': '#faf5e8',
          'surface-card': '#f5f0e0',
          'surface-strong': '#ebe6d6',
          ink: '#0a0a0a',
          body: '#3a3a3a',
          muted: '#6a6a6a',
          pink: '#ff4d8b',
          teal: '#1a3a3a',
          lavender: '#b8a4ed',
          peach: '#ffb084',
          ochre: '#e8b94a',
          mint: '#a4d4c5',
          coral: '#ff6b5a',
        },
        // Tech/Future Theme Palette
        tech: {
          cyan: {
            DEFAULT: '#00f0ff',
            dim: 'rgba(0, 240, 255, 0.1)',
            glow: 'rgba(0, 240, 255, 0.5)',
          },
          violet: {
            DEFAULT: '#7000ff',
            dim: 'rgba(112, 0, 255, 0.1)',
            glow: 'rgba(112, 0, 255, 0.5)',
          },
          dark: {
            bg: '#050510',
            card: 'rgba(10, 10, 25, 0.6)',
            border: 'rgba(100, 200, 255, 0.1)',
          }
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
        'fade-in-up': 'fadeInUp 0.3s ease',
        'beam-move': 'beamMove 8s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        beamMove: {
          '0%, 100%': { opacity: '0.3', transform: 'scaleY(0.8)' },
          '50%': { opacity: '0.8', transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
