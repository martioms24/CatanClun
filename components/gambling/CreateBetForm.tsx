"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createBet } from "@/app/actions/gambling-actions";
import { Check, X, Plus, Minus } from "lucide-react";

export function CreateBetForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addOption() {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    setOptions(options.map((o, i) => (i === index ? value : o)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!title.trim()) {
      setError("Escriu una pregunta per l'aposta.");
      return;
    }
    if (validOptions.length < 2) {
      setError("Cal almenys 2 opcions.");
      return;
    }

    startTransition(async () => {
      const result = await createBet(title, validOptions);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="font-cinzel text-medieval-dark text-sm">
          Nova aposta
        </label>

        <div>
          <label className="font-garamond text-medieval-stone text-sm mb-1 block">
            Pregunta
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Qui guanyarà avui?"
            autoFocus
            maxLength={200}
            className="w-full px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors"
          />
        </div>

        <div>
          <label className="font-garamond text-medieval-stone text-sm mb-2 block">
            Opcions ({options.length})
          </label>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-cinzel text-medieval-stone text-xs w-5 text-center shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Opció ${i + 1}`}
                  maxLength={100}
                  className="flex-1 px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark focus:outline-none focus:border-medieval-gold transition-colors text-sm"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="p-1 text-medieval-stone hover:text-medieval-burgundy transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1 mt-2 font-garamond text-medieval-gold text-sm hover:underline"
            >
              <Plus size={12} />
              Afegir opció
            </button>
          )}
        </div>

        <p className="font-garamond text-medieval-stone text-xs">
          Multiplicador: x{options.filter((o) => o.trim()).length || 2} (el
          guanyador rep l&apos;aposta multiplicada pel nombre d&apos;opcions)
        </p>

        {error && (
          <p className="font-garamond text-red-700 text-sm">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isPending}
            disabled={!title.trim()}
          >
            <Check size={14} />
            Crear aposta
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X size={14} />
            Cancel·lar
          </Button>
        </div>
      </form>
    </Card>
  );
}
