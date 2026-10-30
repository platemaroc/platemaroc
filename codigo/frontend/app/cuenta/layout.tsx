import type { ReactNode } from 'react';
import { BrandBar } from '../../components/Brand.tsx';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BrandBar href="/" />
      {children}
    </>
  );
}
