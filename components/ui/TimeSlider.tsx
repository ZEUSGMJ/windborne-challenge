'use client';

interface TimeSliderProps {
  trackHours: number;
  onTrackHoursChange: (hours: number) => void;
}

export function TimeSlider({ trackHours, onTrackHoursChange }: TimeSliderProps) {
  // Clamp and update from any string source (input or slider)
  const handleChange = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;

    const clamped = Math.min(24, Math.max(1, num));
    onTrackHoursChange(clamped);
  };

  const increment = () => {
    onTrackHoursChange(Math.min(24, trackHours + 1));
  };

  const decrement = () => {
    onTrackHoursChange(Math.max(1, trackHours - 1));
  };

  return (
    <div className="bg-zinc-950/90 backdrop-blur-sm p-4 rounded-lg border border-zinc-600 w-full">
      {/* Top row: label + custom number box */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-300">
          Track Duration
        </label>

        <div className="flex items-center gap-1">
          {/* Wrapper so we can add our own arrows */}
          <div className="relative w-20">
            <input
              type="number"
              min={1}
              max={24}
              value={trackHours}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1
                         text-right text-sm text-sky-500 pr-6
                         focus:outline-none focus:ring-1 focus:ring-sky-500
                         appearance-none"
            />

            {/* Up button */}
            <button
              type="button"
              onClick={increment}
              className="absolute right-1 top-1 text-gray-400 hover:text-sky-500
                         text-[10px] cursor-pointer select-none leading-none"
            >
              ▲
            </button>

            {/* Down button */}
            <button
              type="button"
              onClick={decrement}
              className="absolute right-1 bottom-1 text-gray-400 hover:text-sky-500
                         text-[10px] cursor-pointer select-none leading-none"
            >
              ▼
            </button>
          </div>

          <span className="text-sm text-gray-400">hours</span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="1"
        max="24"
        step="1"
        value={trackHours}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />

      {/* Optional tick labels under the slider */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Now</span>
        <span>24h</span>
      </div>
    </div>
  );
}
