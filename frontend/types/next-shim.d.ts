// frontend/types/next-shim.d.ts

declare module "next/navigation" {
    export function redirect(url: string): never;
  
    // TabsLayoutで使ってるなら
    export function usePathname(): string;
  
    // 今後使うかも（必要なら）
    export function useRouter(): {
      push(url: string): void;
      replace(url: string): void;
      back(): void;
      refresh(): void;
    };
  }
  
  declare module "next/link" {
    import * as React from "react";
    const Link: React.ComponentType<any>;
    export default Link;
  }
  