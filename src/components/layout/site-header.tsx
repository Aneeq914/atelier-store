"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BagIcon,
  CloseIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { menuLinks } from "@/lib/sample-data";

// Pages whose first section is a full-bleed image the header floats over.
const OVERLAY_PATHS = new Set(["/"]);

export function SiteHeader() {
  const pathname = usePathname();
  const overlay = OVERLAY_PATHS.has(pathname);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const transparent = overlay && !scrolled;
  const openMenu = () => menuRef.current?.showModal();
  const closeMenu = () => menuRef.current?.close();

  return (
    <>
      <header
        data-transparent={transparent || undefined}
        className="group fixed inset-x-0 top-0 z-40 border-b border-divider bg-background text-foreground transition-[background-color,color,border-color] duration-500 ease-luxe data-transparent:border-transparent data-transparent:bg-transparent data-transparent:text-white"
      >
        {/* Keeps white icons legible over bright photos. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/50 to-transparent opacity-0 transition-opacity duration-500 ease-luxe group-data-transparent:opacity-100"
        />
        <div className="container-page relative flex h-header items-center justify-between lg:grid lg:grid-cols-3">
          <Link
            href="/contact"
            className="type-caption-strong link-quiet hidden items-center gap-1.5 lg:inline-flex lg:justify-self-start"
          >
            <PlusIcon width={14} height={14} />
            Contact us
          </Link>

          <Link
            href="/"
            className="type-wordmark [--wordmark-size:1.5rem] lg:justify-self-center lg:[--wordmark-size:1.75rem]"
          >
            Atelier
          </Link>

          <nav
            aria-label="Account and shopping"
            className="-mr-2 flex items-center lg:justify-self-end"
          >
            <Link href="/bag" aria-label="Shopping bag" className="btn-icon-ghost">
              <BagIcon />
            </Link>
            <Link href="/account" aria-label="Account" className="btn-icon-ghost">
              <UserIcon />
            </Link>
            <Link href="/search" aria-label="Search" className="btn-icon-ghost">
              <SearchIcon />
            </Link>
            <button
              type="button"
              onClick={openMenu}
              aria-haspopup="dialog"
              className="btn-icon-ghost lg:ml-2 lg:inline-flex lg:w-auto lg:gap-2 lg:px-2"
            >
              <MenuIcon />
              <span className="type-cta sr-only lg:not-sr-only">Menu</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Reserve header space on pages that don't start with a full-bleed image. */}
      {!overlay && <div aria-hidden="true" className="h-header" />}

      <dialog
        ref={menuRef}
        aria-label="Main menu"
        onClick={(e) => e.target === e.currentTarget && closeMenu()}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md translate-x-full bg-background p-0 text-foreground transition-all transition-discrete duration-500 ease-luxe backdrop:bg-backdrop open:translate-x-0 starting:open:translate-x-full"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-header shrink-0 items-center justify-between px-gutter">
            <span className="type-title-s">Menu</span>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              autoFocus
              className="btn-icon"
            >
              <CloseIcon />
            </button>
          </div>

          <nav aria-label="Main" className="flex-1 overflow-y-auto px-gutter py-6">
            <ul className="flex flex-col gap-5">
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="type-title-m link-quiet"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-3 border-t px-gutter py-6">
            <Link href="/account" onClick={closeMenu} className="type-caption link">
              Sign in or create an account
            </Link>
            <Link href="/contact" onClick={closeMenu} className="type-caption link">
              Contact a client advisor
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
