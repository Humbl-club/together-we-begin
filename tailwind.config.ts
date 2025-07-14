import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			// Modern responsive system with mobile-first approach
			screens: {
				'mobile': {'max': '767px'}, // mobile-only styles
				'xs': '475px',
				'sm': '768px', 
				'md': '1024px',
				'lg': '1280px',
				'xl': '1536px',
				'2xl': '1792px',
			},
			// Container query support
			supports: {
				'container-queries': '@supports (container-type: inline-size)',
			},
			// Fluid typography using clamp()
			fontSize: {
				'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
				'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
				'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
				'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
				'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
				'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
				'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
				'fluid-4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
			},
			// Fluid spacing
			spacing: {
				'fluid-1': 'clamp(0.25rem, 0.2rem + 0.25vw, 0.375rem)',
				'fluid-2': 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)',
				'fluid-3': 'clamp(0.75rem, 0.6rem + 0.75vw, 1.125rem)',
				'fluid-4': 'clamp(1rem, 0.8rem + 1vw, 1.5rem)',
				'fluid-5': 'clamp(1.25rem, 1rem + 1.25vw, 1.875rem)',
				'fluid-6': 'clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)',
				'fluid-8': 'clamp(2rem, 1.6rem + 2vw, 3rem)',
				'fluid-10': 'clamp(2.5rem, 2rem + 2.5vw, 3.75rem)',
				'fluid-12': 'clamp(3rem, 2.4rem + 3vw, 4.5rem)',
			},
			// Modern grid systems
			gridTemplateColumns: {
				'auto-fit-xs': 'repeat(auto-fit, minmax(200px, 1fr))',
				'auto-fit-sm': 'repeat(auto-fit, minmax(250px, 1fr))',
				'auto-fit-md': 'repeat(auto-fit, minmax(300px, 1fr))',
				'auto-fit-lg': 'repeat(auto-fit, minmax(350px, 1fr))',
				'auto-fill-xs': 'repeat(auto-fill, minmax(200px, 1fr))',
				'auto-fill-sm': 'repeat(auto-fill, minmax(250px, 1fr))',
				'auto-fill-md': 'repeat(auto-fill, minmax(300px, 1fr))',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Editorial Brand Colors
				editorial: {
					charcoal: 'hsl(var(--editorial-charcoal))',
					'warm-grey': 'hsl(var(--editorial-warm-grey))',
					cream: 'hsl(var(--editorial-cream))',
					sage: 'hsl(var(--editorial-sage))',
					blush: 'hsl(var(--editorial-blush))',
					navy: 'hsl(var(--editorial-navy))'
				}
			},
			backgroundImage: {
				'editorial-gradient': 'linear-gradient(135deg, hsl(var(--editorial-cream)), hsl(var(--editorial-warm-grey)))',
				'editorial-hero': 'linear-gradient(135deg, hsl(var(--editorial-cream) / 0.9), hsl(var(--editorial-sage) / 0.7))',
				'editorial-subtle': 'linear-gradient(180deg, hsl(var(--background)), hsl(var(--muted)))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			// Premium Typography System
			fontFamily: {
				'sans': ['Inter', 'system-ui', 'sans-serif'],
				'serif': ['Playfair Display', 'serif'],
				'display': ['Playfair Display', 'serif'],
			},
			// Enhanced Animations
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fadeIn 0.6s ease-out',
				'slide-up': 'slideUp 0.4s ease-out',
				'slide-down': 'slideDown 0.4s ease-out',
				'scale-in': 'scaleIn 0.3s ease-out',
				'shimmer': 'shimmer 2s linear infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'float': 'float 3s ease-in-out infinite',
				'bounce-gentle': 'bounceGentle 2s infinite',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				slideUp: {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				slideDown: {
					'0%': { transform: 'translateY(-100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				scaleIn: {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				shimmer: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				glow: {
					'0%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.1)' },
					'100%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.3)' }
				},
				float: {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				bounceGentle: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;