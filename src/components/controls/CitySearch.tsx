import { Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { City } from "../../lib/weather/types";

interface CitySearchProps {
  cities: City[];
  onSelect: (city: City) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
}

function normalize(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("zh-CN")
    .replace(/[市区县自治州地区盟特别行政省]/gu, "");
}

export function CitySearch({
  cities,
  onSelect,
  className,
  placeholder = "搜索城市",
  ariaLabel = "搜索城市",
}: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const composingRef = useRef(false);
  const normalizedQuery = normalize(query);
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return cities
      .filter((city) => {
        const haystack = [city.name, city.shortName, city.province, ...city.aliases]
          .map(normalize)
          .join(" ");
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name, "zh-CN"))
      .slice(0, 8);
  }, [cities, normalizedQuery]);

  const choose = (city: City) => {
    setQuery(city.shortName);
    setFocused(false);
    onSelect(city);
  };

  return (
    <div className={className ? `city-search ${className}` : "city-search"}>
      <Search aria-hidden="true" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={() => {
          composingRef.current = false;
        }}
        onKeyDown={(event) => {
          if (composingRef.current || !results.length) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(results.length - 1, index + 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(0, index - 1));
          } else if (event.key === "Enter") {
            event.preventDefault();
            choose(results[activeIndex]);
          } else if (event.key === "Escape") {
            setFocused(false);
          }
        }}
        placeholder={placeholder}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={focused && results.length > 0}
        aria-controls="city-search-results"
        aria-activedescendant={
          focused && results[activeIndex] ? `city-result-${results[activeIndex].id}` : undefined
        }
      />
      {query && (
        <button
          type="button"
          className="search-clear"
          onClick={() => setQuery("")}
          aria-label="清除城市搜索"
        >
          <X aria-hidden="true" />
        </button>
      )}
      {focused && normalizedQuery && (
        <div className="search-results" id="city-search-results" role="listbox">
          {results.length ? (
            results.map((city, index) => (
              <button
                type="button"
                id={`city-result-${city.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "search-result is-active" : "search-result"}
                key={city.id}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(city)}
              >
                <span>{city.shortName}</span>
                <small>{city.province}</small>
              </button>
            ))
          ) : (
            <div className="search-empty">没有找到这个城市</div>
          )}
        </div>
      )}
    </div>
  );
}
