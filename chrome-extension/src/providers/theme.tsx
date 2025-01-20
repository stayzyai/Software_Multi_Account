
import { ThemeProvider as NextThemeProvider } from "next-themes";
import React from "react";

/**
 * @interface ThemeProviderProps
 * @property {ReactNode} children
 * @property {string} [attribute="class"]
 * @property {string} [defaultTheme="system"]
 * @property {boolean} [enableSystem=true]
 * @property {boolean} [disableTransitionOnChange=true]
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}


/**
 * @param {ThemeProviderProps} props
 * @returns {React.ReactElement}
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  enableSystem = true,
  disableTransitionOnChange = true,
}) => {
  return (
    <NextThemeProvider
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      <div>{children}</div>
    </NextThemeProvider>
  );
};
