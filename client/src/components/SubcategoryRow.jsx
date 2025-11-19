import { useState, useEffect, useRef } from "react";
import { FaMinusCircle } from "react-icons/fa";
import { Row, Col } from "react-bootstrap";
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
    <Row className="mb-3 align-items-center position-relative" key={index}>
      <Col md={6}>
        <div className="position-relative">
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
          />

          {showSuggestions && (suggestions.length > 0 || isLoading) && (
            <div className="position-absolute top-100 start-0 end-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 mt-1 max-h-32 overflow-y-auto">
              {isLoading ? (
                <div className="p-2 text-center text-gray-500">
                  <div
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Searching...
                </div>
              ) : (
                <>
                  <div className="p-2 bg-purple-50 border-bottom border-gray-200">
                    <small className="text-purple-600 fw-semibold">
                      Suggestions for {selectedCategory}
                    </small>
                  </div>
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-2 hover:bg-purple-50 cursor-pointer border-bottom border-gray-100 last:border-bottom-0"
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="text-sm text-gray-700">{suggestion}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {showSuggestions && !isLoading && suggestions.length === 0 && (
            <div className="position-absolute top-100 start-0 end-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 mt-1 p-2">
              <small className="text-muted">No suggestions found</small>
            </div>
          )}
        </div>

        {errors.subcategories?.[index]?.name && (
          <p className="text-danger small mt-1">
            {errors.subcategories[index].name.message}
          </p>
        )}
      </Col>

      <Col md={4}>
        <Form.Control
          type="number"
          placeholder="Amount (KES)"
          {...register(`subcategories.${index}.amount`, {
            required: "Amount is required",
            min: { value: 1, message: "Must be greater than 0" },
            valueAsNumber: true,
          })}
        />

        {errors.subcategories?.[index]?.amount && (
          <p className="text-danger small mt-1">
            {errors.subcategories[index].amount.message}
          </p>
        )}
      </Col>

      <Col md="auto">
        <Button
          variant="link"
          type="button"
          onClick={() => {
            clearErrors(`subcategories.${index}`);
            unregister(`subcategories.${index}`);
            remove(index);
          }}
          className="p-0 text-danger"
          title="Remove this subcategory"
        >
          <FaMinusCircle size={22} />
        </Button>
      </Col>
    </Row>
  );
};
export default SubcategoryRow;
