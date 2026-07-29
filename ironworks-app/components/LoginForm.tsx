"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-body text-sm text-off-white/70">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-off-white/20 bg-graphite px-3 py-2 font-body text-off-white outline-none focus:border-iron-orange"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="font-body text-sm text-off-white/70">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-off-white/20 bg-graphite px-3 py-2 font-body text-off-white outline-none focus:border-iron-orange"
        />
      </div>
      {error && <p className="font-body text-sm text-iron-orange">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded bg-iron-orange px-4 py-2 font-heading uppercase tracking-wide text-off-white transition hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "Logging In..." : "Log In"}
      </button>
    </form>
  );
}
