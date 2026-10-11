"use client";

import { useState } from "react";

// Front-end only for now: nothing is sent until a newsletter provider is wired up.
export function NewsletterForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p role="status" className="type-body">
        Thank you. You&apos;ll hear from us soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="Email address"
        className="field sm:flex-1"
      />
      <button type="submit" className="btn btn-primary">
        Subscribe
      </button>
    </form>
  );
}
