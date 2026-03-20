"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
    const { theme, setTheme, systemTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])
    if (!mounted) return <div className="w-14 h-7 rounded-full bg-secondary shadow-inner" />

    const currentTheme = theme === "system" ? systemTheme : theme
    const isDark = currentTheme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center w-14 h-7 rounded-full relative transition-colors duration-300 shadow-inner overflow-hidden outline-none bg-secondary/80 border border-border cursor-pointer hover:border-primary/50"
            aria-label="Toggle Theme"
        >
            <div
                className={cn(
                    "absolute transition-all duration-300 w-5 h-5 rounded-full flex items-center justify-center pointer-events-none transform",
                    isDark 
                        ? "translate-x-[calc(3.5rem-1.25rem-0.25rem)] bg-[#0B0E14] border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]" 
                        : "translate-x-1 bg-[#FACC15] shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                )}
            >
                {isDark ? (
                    <Moon className="w-3 h-3 text-slate-200" />
                ) : (
                    <Sun className="w-3 h-3 text-white" />
                )}
            </div>
        </button>
    )
}
