"use client"

import { useState } from "react"
import Link from "next/link"
import { MenuIcon, PlaneIcon, BuildingIcon, MapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface NavbarProps {
  session: {
    user?: {
      id?: string
      name?: string | null
      email?: string | null
    }
  } | null
}

const navLinks = [
  { href: "/flights", label: "Flights", icon: PlaneIcon },
  { href: "/hotels", label: "Hotels", icon: BuildingIcon },
  { href: "/trips", label: "My Trips", icon: MapIcon },
]

export function Navbar({ session }: NavbarProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <PlaneIcon className="size-6" style={{ color: "#1a56db" }} />
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: "#1a56db" }}
          >
            Jexpedia
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <span className="text-sm text-muted-foreground">
                Hi, {session.user?.name}
              </span>
              <Link href="/api/auth/signout">
                <Button variant="outline" size="sm">
                  Sign Out
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="sm"
                  className="bg-[#1a56db] text-white hover:bg-[#1648c0]"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <span style={{ color: "#1a56db" }}>Jexpedia</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <link.icon className="size-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 border-t pt-6">
                {session ? (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm text-muted-foreground">
                      Hi, {session.user?.name}
                    </span>
                    <Link
                      href="/api/auth/signout"
                      onClick={() => setOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        Sign Out
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/auth/signin"
                      onClick={() => setOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setOpen(false)}
                    >
                      <Button className="w-full bg-[#1a56db] text-white hover:bg-[#1648c0]">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
