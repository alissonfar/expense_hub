import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // =============================================
      // 🎨 DESIGN SYSTEM - CORES PERSONALIZADAS
      // =============================================
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          active: "hsl(var(--primary-active))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))"
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
          hover: "hsl(var(--accent-hover))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // === CORES DE ESTADO E FEEDBACK ===
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))"
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))"
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))"
        },
        
        // === CORES ESPECÍFICAS FINANCEIRAS ===
        finance: {
          income: "hsl(var(--finance-income))",
          "income-bg": "hsl(var(--finance-income-bg))",
          expense: "hsl(var(--finance-expense))",
          "expense-bg": "hsl(var(--finance-expense-bg))",
          pending: "hsl(var(--finance-pending))",
          "pending-bg": "hsl(var(--finance-pending-bg))",
          paid: "hsl(var(--finance-paid))",
          "paid-bg": "hsl(var(--finance-paid-bg))"
        }
      },
      
      // =============================================
      // 📐 CONFIGURAÇÕES DE LAYOUT
      // =============================================
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "var(--radius-sm)",
        xl: "var(--radius-lg)",
        "2xl": "var(--radius-xl)"
      },
      
      // =============================================
      // 🎭 ANIMAÇÕES PERSONALIZADAS
      // =============================================
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0%)" }
        },
        "slide-out": {
          from: { transform: "translateX(0%)" },
          to: { transform: "translateX(-100%)" }
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" }
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--primary))" },
          "50%": { boxShadow: "0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out", 
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite"
      },
      
      // =============================================
      // 🔤 TIPOGRAFIA ESPECIALIZADA
      // =============================================
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "Monaco", "monospace"],
        display: ["Cal Sans", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }]
      },
      
      // =============================================
      // 🌈 GRADIENTES E EFEITOS
      // =============================================
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-primary": "var(--gradient-primary)",
        "gradient-secondary": "var(--gradient-secondary)",
        "grid-pattern": "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)"
      },
      
      // =============================================
      // 📏 ESPAÇAMENTOS ESPECÍFICOS
      // =============================================
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '92': '23rem',
        '100': '25rem',
        '104': '26rem',
        '112': '28rem',
        '128': '32rem'
      },
      
      // =============================================
      // 🎯 SOMBRAS TEMÁTICAS
      // =============================================
      boxShadow: {
        'xs': '0 1px 2px 0 hsl(var(--shadow-light))',
        'sm': '0 1px 3px 0 hsl(var(--shadow-light)), 0 1px 2px -1px hsl(var(--shadow-light))',
        'md': '0 4px 6px -1px hsl(var(--shadow-medium)), 0 2px 4px -2px hsl(var(--shadow-light))',
        'lg': '0 10px 15px -3px hsl(var(--shadow-medium)), 0 4px 6px -4px hsl(var(--shadow-light))',
        'xl': '0 20px 25px -5px hsl(var(--shadow-strong)), 0 8px 10px -6px hsl(var(--shadow-light))',
        '2xl': '0 25px 50px -12px hsl(var(--shadow-strong))',
        'glow': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-lg': '0 0 40px hsl(var(--primary) / 0.4)'
      },
      
      // =============================================
      // 📱 BREAKPOINTS CUSTOMIZADOS
      // =============================================
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px',
        '3xl': '1600px'
      },
      
      // =============================================
      // 🔄 TRANSIÇÕES SUAVES
      // =============================================
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms'
      },
      
      // =============================================
      // 📊 CONFIGURAÇÕES PARA GRÁFICOS
      // =============================================
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography")
  ],
} satisfies Config

export default config 