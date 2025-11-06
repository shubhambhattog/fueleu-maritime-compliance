"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { ThemeAnimationType, useModeAnimation } from 'react-theme-switch-animation'

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { ref, toggleSwitchTheme, isDarkMode } = useModeAnimation({
                                                                    animationType: ThemeAnimationType.CIRCLE,
                                                                    blurAmount: 4, // Optional: adjust blur intensity
                                                                    duration: 1000,    // Optional: adjust animation duration
                                                                  })

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={toggleSwitchTheme}
      className="cursor-pointer"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
