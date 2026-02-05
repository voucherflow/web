import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/new-deal", label: "New Deal" },
  { href: "/hud-rent", label: "HUD Rent Lookup" },
  { href: "/inspection", label: "Inspection Readiness" },
  { href: "/resources", label: "Resources" },
];

export default function NavBar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          VoucherFlow
        </Link>

        <nav className="flex gap-4 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-gray-700 hover:text-black"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
