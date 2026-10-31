import { useState, useEffect, useRef } from "react";
import { Loader2, X } from "lucide-react";
import { useWatch } from "react-hook-form";
import axiosInstance from "../axiosInstance";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/field";
import { categoryLabel } from "@/lib/categories";

const SubcategoryRow = ({
  index,
  register,
  errors,
  remove,
  clearErrors,
  unregister,
  control,
  setValue,
  selectedCategory,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const timeoutRef = useRef(null);

  const currentSubcategory = useWatch({
    control,
    name: `subcategories.${index}.name`,
  });

  useEffect(() => {
    if (currentSubcategory) {
      setInputValue(currentSubcategory);
    }
  }, [currentSubcategory]);

  const searchSuggestions = async (searchTerm) => {
    if (!selectedCategory || searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/subcategory-suggestions?search=${encodeURIComponent(
          searchTerm
        )}&category=${encodeURIComponent(selectedCategory)}&limit=4`
      );
      setSuggestions(response.data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setValue(`subcategories.${index}.name`, value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchSuggestions(value), 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setValue(`subcategories.${index}.name`, suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputFocus = () => {
    if (inputValue.length >= 2 && selectedCategory && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
  }, [selectedCategory]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const rowErrors = errors.subcategories?.[index];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_2.25rem] sm:grid-cols-[minmax(0,1fr)_7.5rem_2.25rem] items-start gap-2">
      <div className="relative">
        <Input
          aria-label="Item name"
          placeholder={selectedCategory ? "e.g. Vegetables" : "Item name"}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoComplete="off"
        />

        {showSuggestions && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            {isLoading ? (
              <p className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Searching...
              </p>
            ) : suggestions.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">No suggestions found</p>
            ) : (
              <>
                <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                  Suggestions for {categoryLabel(selectedCategory)}
                </p>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {suggestion}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        <FieldError className="mt-1">{rowErrors?.name?.message}</FieldError>
      </div>

      <div>
        <Input
          type="number"
          step="any"
          aria-label="Amount in KES"
          placeholder="KES"
          {...register(`subcategories.${index}.amount`, {
            required: "Amount is required",
            min: { value: 1, message: "Must be greater than 0" },
            valueAsNumber: true,
          })}
        />
        <FieldError className="mt-1">{rowErrors?.amount?.message}</FieldError>
      </div>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Remove item"
        className="mt-0.5"
        onClick={() => {
          clearErrors(`subcategories.${index}`);
          unregister(`subcategories.${index}`);
          remove(index);
        }}
      >
        <X />
      </Button>
    </div>
  );
};

export default SubcategoryRow;
