import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadGoogleMapsPlacesApi } from "@/lib/google-places";

type GoogleAddressSelection = {
  address: string;
  city: string;
};

type GoogleAddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (selection: GoogleAddressSelection) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const getCityFromAddressComponents = (components?: Array<{ long_name?: string; types?: string[] }>) => {
  if (!components?.length) return "";

  const typePriority = [
    "locality",
    "postal_town",
    "administrative_area_level_2",
    "administrative_area_level_1",
  ];

  for (const type of typePriority) {
    const match = components.find((component) => component.types?.includes(type));
    if (match?.long_name) return match.long_name;
  }

  return "";
};

export function GoogleAddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  id,
  name,
  placeholder,
  disabled,
  className,
}: GoogleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onAddressSelectRef = useRef(onAddressSelect);
  const [autocompleteAvailable, setAutocompleteAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect;
  }, [onAddressSelect]);

  useEffect(() => {
    let active = true;

    loadGoogleMapsPlacesApi()
      .then(() => {
        if (!active || !inputRef.current) return;

        const googleMaps = window.google?.maps;
        if (!googleMaps?.places?.Autocomplete) {
          setAutocompleteAvailable(false);
          return;
        }

        autocompleteRef.current = new googleMaps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          fields: ["formatted_address", "address_components"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace?.();
          const typedAddress = inputRef.current?.value?.trim() ?? "";
          const selectedAddress =
            (typeof place?.formatted_address === "string" && place.formatted_address.trim()) || typedAddress;

          if (!selectedAddress) return;

          onChangeRef.current(selectedAddress);
          const city = getCityFromAddressComponents(place?.address_components);
          onAddressSelectRef.current?.({ address: selectedAddress, city });
        });

        setAutocompleteAvailable(true);
      })
      .catch(() => {
        if (!active) return;
        setAutocompleteAvailable(false);
      });

    return () => {
      active = false;
      if (window.google?.maps?.event && autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, []);

  return (
    <>
      <Input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChangeRef.current(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="street-address"
        className={className}
      />
      {autocompleteAvailable === false && (
        <p className="mt-1 text-xs text-muted-foreground">
          Saisie manuelle active. Ajoutez `VITE_GOOGLE_MAPS_API_KEY` pour l'autocompletion Google Maps.
        </p>
      )}
    </>
  );
}
