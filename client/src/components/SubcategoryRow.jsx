import { useState, useEffect, useRef } from "react";
import { FaMinusCircle } from "react-icons/fa";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import axiosInstance from "../axiosInstance";
import { useWatch } from "react-hook-form";

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
  const inputRef = useRef(null);

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
    if (!selectedCategory) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTerm.length < 2) {
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

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setValue(`subcategories.${index}.name`, suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputFocus = () => {
    const currentValue = inputValue;
    if (currentValue && currentValue.length >= 2 && selectedCategory) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
  }, [selectedCategory]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="mb-3 relative">
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3 items-start">
        {/* Name Input with Suggestions */}
        <div className="flex-1 w-full relative">
          <Form.Control
            type="text"
            placeholder={
              !selectedCategory ? "Select category first" : "e.g. Vegetables"
            }
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            ref={inputRef}
            size="sm"
            className="text-sm md:text-base w-full"
          />

          {showSuggestions && (suggestions.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-20 mt-1 max-h-40 sm:max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-2 sm:p-3 text-center text-gray-500">
                  <div
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="text-xs sm:text-sm">Searching...</span>
                </div>
              ) : (
                <>
                  <div className="p-2 sm:p-3 bg-purple-50 border-b border-gray-200">
                    <small className="text-purple-600 fw-semibold text-xs sm:text-sm">
                      Suggestions for{" "}
                      <span className="capitalize">{selectedCategory}</span>
                    </small>
                  </div>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full p-2 sm:p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-left transition-colors duration-150"
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="text-sm text-gray-700 truncate">
                        {suggestion}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {showSuggestions && !isLoading && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-20 mt-1 p-2 sm:p-3">
              <small className="text-muted text-xs sm:text-sm">
                No suggestions found
              </small>
            </div>
          )}

          {errors.subcategories?.[index]?.name && (
            <p className="text-danger text-xs md:text-sm mt-1">
              {errors.subcategories[index].name.message}
            </p>
          )}
        </div>

        {/* Amount Input and Remove Button Container */}
        <div className="flex gap-2 md:gap-3 w-full sm:w-auto items-start">
          {/* Amount Input */}
          <div className="flex-1 sm:flex-initial sm:w-32">
            <Form.Control
              type="number"
              placeholder="Amount (KES)"
              {...register(`subcategories.${index}.amount`, {
                required: "Amount is required",
                min: { value: 1, message: "Must be greater than 0" },
                valueAsNumber: true,
              })}
              size="sm"
              className="text-sm md:text-base w-full"
            />

            {errors.subcategories?.[index]?.amount && (
              <p className="text-danger text-xs md:text-sm mt-1">
                {errors.subcategories[index].amount.message}
              </p>
            )}
          </div>

          {/* Remove Button - Just Icon */}
          <div className="flex items-center h-full pt-0.5">
            <Button
              variant="link"
              type="button"
              onClick={() => {
                clearErrors(`subcategories.${index}`);
                unregister(`subcategories.${index}`);
                remove(index);
              }}
              className="p-0 text-danger hover:text-red-700 transition-colors"
              title="Remove this subcategory"
              size="sm"
            >
              <FaMinusCircle size={20} className="sm:size-[22px]" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubcategoryRow;
