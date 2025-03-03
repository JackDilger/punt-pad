import React, { useEffect } from 'react';

export function SelectProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const interval = setInterval(() => {
      const html = document.documentElement;
      const body = document.body;

      if (html.style.overflow === 'hidden') {
        html.style.overflow = 'scroll';
      }
      if (html.style.paddingRight) {
        html.style.paddingRight = '0';
      }
      if (body.style.overflow === 'hidden') {
        body.style.overflow = '';
      }
      if (body.style.paddingRight) {
        body.style.paddingRight = '0';
      }
      if (body.style.width !== 'calc(100vw - var(--scrollbar-width))') {
        body.style.width = 'calc(100vw - var(--scrollbar-width))';
      }
    }, 10);

    return () => {
      clearInterval(interval);
      document.documentElement.style.overflow = 'scroll';
      document.documentElement.style.paddingRight = '0';
      document.body.style.width = 'calc(100vw - var(--scrollbar-width))';
    };
  }, []);

  return <>{children}</>;
}
