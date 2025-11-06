import Form from "react-bootstrap/Form";
import Navbar from "./Navbar.jsx";
import { toast, ToastContainer } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/axiosInstance";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Row, Col, Card } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema } from "@/zodSchemas/schemas.js";
import { useMemo, useState, useEffect, useRef } from "react";
import { FaMinusCircle } from "react-icons/fa";

const ExpenseForm = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    handleSubmit,
    formState: { errors },
    reset,
    register,
    control,
    clearErrors,
    unregister,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(expenseSchema),
    mode: "onSubmit",
    defaultValues: {
      category: "",
      subcategories: [{ name: "", amount: "" }],
      date: "",
    },
    shouldUnregister: true,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subcategories",
  });

  // Watch the category field to use in suggestions
  const selectedCategory = watch("category");
  const subcategories = useWatch({ control, name: "subcategories" });

  const totalAmount = useMemo(() => {
    return subcategories?.reduce((sum, curr) => {
      const value = Number(curr.amount) || 0;
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  }, [subcategories]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => await axiosInstance.post("/expenses", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      toast.success(data.data.message);
      reset();
      setTimeout(() => navigate("/history"), 3000);
    },
    onError: () => toast.error("Error creating expense"),
  });

  const addExpense = (data) => {
    try {
      const formattedData = {
        ...data,
        amount: totalAmount,
      };
      mutate(formattedData);
    } catch {
      toast.error("Something went wrong. Try again later.");
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <ToastContainer position="top-right" autoClose={3000} theme="light" />

        <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-lg">
          <h3 className="text-center text-2xl font-bold text-purple-700 mb-6">
            Add Expense
          </h3>

          <Form onSubmit={handleSubmit(addExpense)}>
            {/* Category */}
            <Form.Group className="mb-4">
              <Form.Label className="font-medium">Expense Category</Form.Label>
              <Form.Select {...register("category")} required>
                <option value="">Choose a Category</option>
                <option value="housing">Housing</option>
                <option value="utilities">Utilities</option>
                <option value="transportation">Transportation</option>
                <option value="food">Food & Groceries</option>
                <option value="healthcare">Healthcare</option>
                <option value="insurance">Insurance</option>
                <option value="debt">Debt & Loans</option>
                <option value="education">Education</option>
                <option value="savings">Savings & Investments</option>
                <option value="personalCare">Personal Care</option>
                <option value="clothing">Clothing & Accessories</option>
                <option value="entertainment">Entertainment & Leisure</option>
                <option value="gifts">Gifts & Donations</option>
                <option value="householdSupplies">Household Supplies</option>
                <option value="family">Childcare & Family</option>
                <option value="pets">Pets & Pet Care</option>
                <option value="work">Work & Business</option>
                <option value="technology">Technology & Subscriptions</option>
                <option value="travel">Travel & Vacations</option>
                <option value="emergency">
                  Emergency / Unexpected Expenses
                </option>
                <option value="taxes">Taxes & Fees</option>
                <option value="retirement">Retirement</option>
                <option value="miscellaneous">Miscellaneous / Other</option>
              </Form.Select>

              {errors.category && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.category.message}
                </p>
              )}
            </Form.Group>

            {/* Subcategories Section */}
            <Card className="mb-3 border-0 shadow-sm">
              <Card.Body>
                <h5 className="fw-semibold mb-3">Subcategories</h5>

                {fields.map((item, index) => (
                  <SubcategoryRow
                    key={item.id}
                    index={index}
                    register={register}
                    errors={errors}
                    remove={remove}
                    clearErrors={clearErrors}
                    unregister={unregister}
                    control={control}
                    setValue={setValue}
                    selectedCategory={selectedCategory}
                  />
                ))}

                <Button
                  variant="outline-primary"
                  type="button"
                  onClick={() => append({ name: "", amount: "" })}
                >
                  + Add Subcategory
                </Button>
              </Card.Body>
            </Card>

            {/* Real-time Total */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <h6 className="mb-0 fw-semibold">Total:</h6>
              <h6 className="mb-0 text-success fw-bold">
                KES{" "}
                {(totalAmount || 0).toLocaleString("en-KE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h6>
            </div>

            {/* Date */}
            <Form.Group className="mb-6 mt-6">
              <Form.Label className="font-medium">Date</Form.Label>
              <Form.Control
                type="date"
                {...register("date", { valueAsDate: true })}
              />
              {errors.date && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.date.message}
                </p>
              )}
            </Form.Group>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-purple-700 hover:bg-purple-800 transition text-white font-semibold py-2 rounded"
            >
              {isPending ? "Submitting..." : "Submit"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
};

// Separate component for each subcategory row with search suggestions
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
  const [inputValue, setInputValue] = useState(""); // Track input value separately
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Get the current value from react-hook-form to initialize
  const currentSubcategory = useWatch({
    control,
    name: `subcategories.${index}.name`,
  });

  // Initialize input value from form data
  useEffect(() => {
    if (currentSubcategory) {
      setInputValue(currentSubcategory);
    }
  }, [currentSubcategory]);

  // Debounced search function with category filtering
  const searchSuggestions = async (searchTerm) => {
    // Don't search if no category is selected
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
    setInputValue(value); // Update local state
    setValue(`subcategories.${index}.name`, value); // Update react-hook-form

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debouncing
    timeoutRef.current = setTimeout(() => {
      searchSuggestions(value);
    }, 300); // 300ms debounce delay
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion); // Update local state
    setValue(`subcategories.${index}.name`, suggestion); // Update react-hook-form
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
    // Delay hiding suggestions to allow for click
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Reset suggestions when category changes
  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
  }, [selectedCategory]);

  // Cleanup timeout on unmount
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
            value={inputValue} // Use local state
            onChange={handleInputChange} // Use custom handler
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            ref={inputRef}
            // REMOVED disabled prop - input is now always enabled
          />

          {/* Search Suggestions Dropdown */}
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
                      onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                    >
                      <div className="text-sm text-gray-700">{suggestion}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* No results message */}
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

export default ExpenseForm;
