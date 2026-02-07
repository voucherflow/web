"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/new-deal", label: "New Deal" },
  { href: "/hud-rent", label: "HUD Rent Lookup" },
  { href: "/inspection", label: "Inspection Readiness" },
  { href: "/inspection-reports", label: "Inspection Reports" },
  { href: "/resources", label: "Resources" },
  { href: "/zip-insights", label: "ZIP Insights" },
  { href: "/assistant", label: "Assistant" },
  { href: "/deals", label: "My Deals" },
];

export default function NavBar() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold">
          VoucherFlow
        </Link>

        <div className="flex items-center gap-5">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-gray-700 hover:text-black">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">
                Sign in
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90">
                Sign up
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
