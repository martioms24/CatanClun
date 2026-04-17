"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PEAKS_100_CIMS, type Peak } from "@/lib/peaks-100cims";
import type { PeakCompletion, Player } from "@/types";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { completePeak, deletePeakCompletion } from "@/app/actions/cims-actions";
import {
  Search,
  Mountain,
  Check,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  MapPin,
} from "lucide-react";

// Point calculation (base + altitude bonus, excludes the 4pt auto-quedada)
function getPoints(peak: Peak): number {
  const base = peak.essential ? 8 : 6;
  let bonus = 0;
  if (peak.altitude >= 3000) bonus = 20;
  else if (peak.altitude >= 2750) bonus = 14;
  else if (peak.altitude >= 2500) bonus = 12;
  else if (peak.altitude >= 2250) bonus = 10;
  else if (peak.altitude >= 2000) bonus = 8;
  else if (peak.altitude >= 1750) bonus = 6;
  else if (peak.altitude >= 1500) bonus = 4;
  else if (peak.altitude >= 1000) bonus = 2;
  return base + bonus;
}

// SVG pin marker
function createPinIcon(color: string, size: number = 28): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [size, size * 1.3],
    iconAnchor: [size / 2, size * 1.3],
    popupAnchor: [0, -size * 1.1],
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${size}" height="${size * 1.5}">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#3a2a1a" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="5" fill="white" opacity="0.4"/>
    </svg>`,
  });
}

const RED_PIN = createPinIcon("#c0392b");
const BLUE_PIN = createPinIcon("#2980b9");
const GREEN_PIN = createPinIcon("#27ae60");

interface Props {
  completions: PeakCompletion[];
  players: Player[];
}

export function CimsMap({ completions, players }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const [search, setSearch] = useState("");
  const [selectedPeak, setSelectedPeak] = useState<Peak | null>(null);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [completedDate, setCompletedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  // Build completion map: peakName -> PeakCompletion[]
  const completionMap = useMemo(() => {
    const map = new Map<string, PeakCompletion[]>();
    for (const c of completions) {
      const arr = map.get(c.peak_name) ?? [];
      arr.push(c);
      map.set(c.peak_name, arr);
    }
    return map;
  }, [completions]);

  const completedPeakNames = useMemo(
    () => new Set(completionMap.keys()),
    [completionMap]
  );

  // Filter peaks by search
  const filteredPeaks = useMemo(() => {
    if (!search.trim()) return PEAKS_100_CIMS;
    const q = search.toLowerCase();
    return PEAKS_100_CIMS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.comarca.toLowerCase().includes(q)
    );
  }, [search]);

  // Stats
  const totalPeaks = PEAKS_100_CIMS.length;
  const completedCount = completedPeakNames.size;
  const essentialTotal = PEAKS_100_CIMS.filter((p) => p.essential).length;
  const essentialCompleted = PEAKS_100_CIMS.filter(
    (p) => p.essential && completedPeakNames.has(p.name)
  ).length;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [41.8, 1.6],
      zoom: 8,
      zoomControl: true,
      minZoom: 7,
      maxZoom: 16,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const peaksToShow = search.trim() ? filteredPeaks : PEAKS_100_CIMS;

    for (const peak of peaksToShow) {
      const isCompleted = completedPeakNames.has(peak.name);
      const icon = isCompleted
        ? GREEN_PIN
        : peak.essential
        ? RED_PIN
        : BLUE_PIN;

      const marker = L.marker([peak.lat, peak.lng], { icon })
        .addTo(map)
        .on("click", () => {
          setSelectedPeak(peak);
          setShowCompleteForm(false);
          setSelectedPlayers([]);
          setError(null);
        });

      marker.bindTooltip(
        `<strong>${peak.name}</strong><br/>${peak.altitude}m${
          peak.essential ? " ⭐" : ""
        }${isCompleted ? " ✅" : ""}`,
        { direction: "top", offset: [0, -30] }
      );

      markersRef.current.push(marker);
    }
  }, [filteredPeaks, completedPeakNames, search]);

  // Fly to peak when selected from list
  function flyToPeak(peak: Peak) {
    setSelectedPeak(peak);
    setShowCompleteForm(false);
    setSelectedPlayers([]);
    setError(null);
    mapRef.current?.flyTo([peak.lat, peak.lng], 13, { duration: 0.8 });
  }

  // Handle form submission
  async function handleComplete() {
    if (!selectedPeak) return;
    if (selectedPlayers.length === 0) {
      setError("Cal almenys un jugador.");
      return;
    }
    setIsPending(true);
    setError(null);
    const result = await completePeak(
      selectedPeak.name,
      selectedPlayers,
      completedDate
    );
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowCompleteForm(false);
    setSelectedPlayers([]);
  }

  async function handleDeleteCompletion(id: string) {
    setIsPending(true);
    const result = await deletePeakCompletion(id);
    setIsPending(false);
    if (result.error) setError(result.error);
  }

  function togglePlayer(id: string) {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const peakCompletions = selectedPeak
    ? completionMap.get(selectedPeak.name) ?? []
    : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-medieval bg-medieval-green/10 border border-medieval-green/30">
          <Check size={14} className="text-medieval-green" />
          <span className="font-cinzel text-medieval-dark text-sm font-semibold">
            {completedCount}/{totalPeaks}
          </span>
          <span className="font-garamond text-medieval-stone text-xs">
            cims
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-medieval bg-red-50 border border-red-200">
          <Mountain size={14} className="text-red-600" />
          <span className="font-cinzel text-medieval-dark text-sm font-semibold">
            {essentialCompleted}/{essentialTotal}
          </span>
          <span className="font-garamond text-medieval-stone text-xs">
            essencials
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#c0392b] inline-block" />
          <span className="font-garamond text-xs text-medieval-stone">Essencial</span>
          <span className="w-3 h-3 rounded-full bg-[#2980b9] inline-block ml-2" />
          <span className="font-garamond text-xs text-medieval-stone">No essencial</span>
          <span className="w-3 h-3 rounded-full bg-[#27ae60] inline-block ml-2" />
          <span className="font-garamond text-xs text-medieval-stone">Completat</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-medieval-stone"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cercar cim o comarca..."
          className="w-full pl-9 pr-4 py-2.5 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-medieval-stone hover:text-medieval-dark"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="w-full h-[450px] sm:h-[550px] rounded-medieval border-2 border-medieval-brown/30 overflow-hidden z-0"
      />

      {/* Selected peak detail panel */}
      {selectedPeak && (
        <div className="p-4 rounded-medieval border-2 border-medieval-gold/40 bg-parchment-light">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-cinzel text-medieval-dark text-lg font-bold flex items-center gap-2">
                <MapPin
                  size={18}
                  className={
                    completedPeakNames.has(selectedPeak.name)
                      ? "text-medieval-green"
                      : selectedPeak.essential
                      ? "text-red-600"
                      : "text-blue-600"
                  }
                />
                {selectedPeak.name}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="font-garamond text-medieval-stone text-sm">
                  {selectedPeak.altitude}m
                </span>
                <span className="font-garamond text-medieval-stone text-sm">
                  {selectedPeak.comarca}
                </span>
                {selectedPeak.essential && (
                  <span className="font-cinzel text-red-600 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                    Essencial
                  </span>
                )}
                <span className="font-cinzel text-medieval-gold text-xs font-semibold bg-medieval-gold/10 px-2 py-0.5 rounded-full">
                  {getPoints(selectedPeak)} pts
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedPeak(null)}
              className="text-medieval-stone hover:text-medieval-dark p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Completions list */}
          {peakCompletions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-medieval-brown/20">
              <p className="font-cinzel text-medieval-dark text-sm font-semibold mb-2">
                Ascensions completades:
              </p>
              {peakCompletions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 py-1.5 flex-wrap"
                >
                  <span className="font-garamond text-medieval-stone text-sm">
                    {new Date(c.completed_at).toLocaleDateString("ca-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-medieval-stone">—</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {c.players?.map((p) => (
                      <span
                        key={p.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-medieval-green/10 text-xs font-garamond"
                      >
                        <MeepleIcon color={p.color} size={12} name={p.name} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDeleteCompletion(c.id)}
                    disabled={isPending}
                    className="text-red-400 hover:text-red-600 ml-auto disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Complete form */}
          {!showCompleteForm ? (
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => setShowCompleteForm(true)}
            >
              <Mountain size={14} />
              Marcar com a completat
            </Button>
          ) : (
            <div className="mt-3 pt-3 border-t border-medieval-brown/20 flex flex-col gap-3">
              <div>
                <label className="font-garamond text-medieval-stone text-sm mb-1.5 block">
                  Qui hi ha pujat?
                </label>
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlayer(p.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-medieval border-2 text-sm font-garamond transition-all",
                        selectedPlayers.includes(p.id)
                          ? "bg-medieval-gold/20 border-medieval-gold text-medieval-dark font-semibold"
                          : "bg-parchment-light border-medieval-brown/20 text-medieval-stone hover:border-medieval-brown/40"
                      )}
                    >
                      <MeepleIcon color={p.color} size={16} name={p.name} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-garamond text-medieval-stone text-sm mb-1 block">
                  Quan?
                </label>
                <input
                  type="date"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="px-3 py-2 rounded-medieval border-2 border-medieval-brown/30 bg-parchment-light font-garamond text-medieval-dark text-sm focus:outline-none focus:border-medieval-gold transition-colors"
                />
              </div>

              {error && (
                <p className="font-garamond text-red-700 text-sm">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={isPending}
                  onClick={handleComplete}
                >
                  <Check size={14} />
                  Confirmar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCompleteForm(false);
                    setError(null);
                  }}
                >
                  Cancel·lar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsible peaks list */}
      <div className="rounded-medieval border-2 border-medieval-brown/30 overflow-hidden">
        <button
          onClick={() => setListOpen(!listOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-parchment-light hover:bg-parchment-dark/30 transition-colors"
        >
          <span className="font-cinzel text-medieval-dark text-sm font-semibold">
            Llistat de cims ({filteredPeaks.length})
          </span>
          {listOpen ? (
            <ChevronUp size={16} className="text-medieval-stone" />
          ) : (
            <ChevronDown size={16} className="text-medieval-stone" />
          )}
        </button>

        {listOpen && (
          <div className="max-h-[400px] overflow-y-auto divide-y divide-medieval-brown/10">
            {filteredPeaks.map((peak) => {
              const isCompleted = completedPeakNames.has(peak.name);
              return (
                <button
                  key={peak.name}
                  onClick={() => flyToPeak(peak)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-medieval-gold/10 transition-colors",
                    selectedPeak?.name === peak.name && "bg-medieval-gold/15"
                  )}
                >
                  <MapPin
                    size={14}
                    className={
                      isCompleted
                        ? "text-medieval-green shrink-0"
                        : peak.essential
                        ? "text-red-600 shrink-0"
                        : "text-blue-600 shrink-0"
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "font-cinzel text-sm",
                        isCompleted
                          ? "text-medieval-green font-semibold"
                          : "text-medieval-dark"
                      )}
                    >
                      {peak.name}
                    </span>
                    <span className="font-garamond text-medieval-stone text-xs ml-2">
                      {peak.altitude}m · {peak.comarca}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {peak.essential && (
                      <span className="text-xs text-red-500 font-cinzel">
                        ESS
                      </span>
                    )}
                    <span className="font-cinzel text-medieval-gold text-xs font-semibold">
                      {getPoints(peak)}pts
                    </span>
                    {isCompleted && <Check size={14} className="text-medieval-green" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
