"use client";

import { useState, useTransition } from "react";
import { login } from "@/app/actions/auth-actions";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-medieval-dark">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-medieval-gold/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-medieval-burgundy/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-medieval-gold/20 border-4 border-medieval-gold flex items-center justify-center">
                <MeepleIcon color="#D4AF37" size={44} />
              </div>
            </div>
          </div>
          <h1 className="font-cinzel text-3xl font-bold text-medieval-gold mb-1">
            Catán Clune
          </h1>
          <p className="font-garamond text-parchment/60 text-base">
            Carcassonne Score Tracker
          </p>
        </div>

        {/* Login form */}
        <div className="bg-parchment rounded-medieval border-4 border-medieval-gold/60 shadow-medieval-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 border-t-2 border-medieval-brown/20" />
            <span className="font-cinzel text-sm text-medieval-stone">
              ⚔️ Enter the Keep ⚔️
            </span>
            <div className="flex-1 border-t-2 border-medieval-brown/20" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="your@email.com"
              required
              autoComplete="email"
              icon={<Mail size={16} />}
            />
            <Input
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              icon={<Lock size={16} />}
            />

            {error && (
              <div className="bg-medieval-burgundy/10 border border-medieval-burgundy/40 rounded-medieval px-3 py-2">
                <p className="text-medieval-burgundy font-garamond text-sm">
                  {error === "Invalid login credentials"
                    ? "Wrong email or password. Try again."
                    : error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              loading={isPending}
              size="lg"
              className="w-full mt-2"
            >
              🏰 Enter
            </Button>
          </form>
        </div>

        <p className="text-center text-parchment/30 font-garamond text-sm mt-6">
          Only the Catán Clun fellowship may enter.
        </p>
      </div>
    </div>
  );
}
