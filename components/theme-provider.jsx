"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

const LayoutThemeContext = React.createContext("enterprise-theme")

export function useLayoutTheme() {
  return React.useContext(LayoutThemeContext)
}

export function ThemeProvider({ 
  children, 
  layoutTheme = "enterprise-theme",
  ...props 
}) {
  // Apply layout theme to ALL portal containers
  React.useEffect(() => {
    const applyThemeToPortals = () => {
      const portals = document.querySelectorAll('[data-radix-portal]')
      portals.forEach(portal => {
        // Remove other layout theme classes
        portal.classList.remove('enterprise-theme', 'mobile-first-theme')
        // Add current layout theme
        portal.classList.add(layoutTheme)
      })
    }

    // Apply immediately
    applyThemeToPortals()

    // Watch for new portals (dialogs, popovers mount dynamically)
    const observer = new MutationObserver(applyThemeToPortals)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      const portals = document.querySelectorAll('[data-radix-portal]')
      portals.forEach(portal => {
        portal.classList.remove(layoutTheme)
      })
    }
  }, [layoutTheme])

  return (
    <LayoutThemeContext.Provider value={layoutTheme}>
      <NextThemesProvider {...props}>
        {children}
      </NextThemesProvider>
    </LayoutThemeContext.Provider>
  )
}