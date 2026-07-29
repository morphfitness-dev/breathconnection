import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import LogoutButton from "@/components/LogoutButton";

type NavBarProps = {
  fullName: string;
};

export default function NavBar({ fullName }: NavBarProps) {
  return (
    <header className="border-b border-off-white/10 bg-graphite">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-body text-sm text-off-white/70">{fullName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
