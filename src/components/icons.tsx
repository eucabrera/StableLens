import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const DashboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="6" height="8" rx="1.5" />
    <rect x="11" y="3" width="6" height="5" rx="1.5" />
    <rect x="3" y="13" width="6" height="4" rx="1.5" />
    <rect x="11" y="10" width="6" height="7" rx="1.5" />
  </Icon>
);

export const PegIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 10h15" strokeDasharray="2 2.2" />
    <path d="M2.5 12c2-0.5 2.6-4 4.5-4s2.4 3.5 4.2 3.5S13.8 7 17.5 8" />
  </Icon>
);

export const DirectoryIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="14" height="13" rx="1.5" />
    <path d="M7 4V2.5M13 4V2.5M6.5 9h7M6.5 12.5h4.5" />
  </Icon>
);

export const RegulationIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 2.5v15M5 17.5h10M4 6h12" />
    <path d="M4 6l-2 5a2.5 2.5 0 0 0 4 0L4 6zM16 6l-2 5a2.5 2.5 0 0 0 4 0l-2-5z" />
  </Icon>
);

export const LibraryIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 3.5h3v13H4zM8.5 3.5h3v13h-3z" />
    <path d="M13 4.2l2.8-0.7 2.6 12.6-2.8 0.7z" />
  </Icon>
);

export const ToolsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 17h14" />
    <path d="M5.5 14V9M10 14V5M14.5 14v-3" />
  </Icon>
);

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 5.5h14M3 10h14M3 14.5h14" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 5l10 10M15 5L5 15" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10" cy="10" r="3.5" />
    <path d="M10 1.8v1.8M10 16.4v1.8M1.8 10h1.8M16.4 10h1.8M4.2 4.2l1.3 1.3M14.5 14.5l1.3 1.3M4.2 15.8l1.3-1.3M14.5 5.5l1.3-1.3" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7z" />
  </Icon>
);
