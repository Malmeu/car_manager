declare module './Layout' {
  import React from 'react';
  
  interface LayoutProps {
    children: React.ReactNode;
  }
  
  const Layout: React.FC<LayoutProps>;
  export default Layout;
}
