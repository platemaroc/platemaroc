import type { ReactNode } from 'react';
import { BrandBar } from '../../components/Brand.tsx';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BrandBar href="/" />
      {children}
    </>
  );
}
