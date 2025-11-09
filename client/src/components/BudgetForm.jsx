import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Row, Col, Card } from "react-bootstrap";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetSchema } from "../zodSchemas/schemas";
import axiosInstance from "../axiosInstance";
import { useMemo, useState, useEffect, useRef } from "react";
import { FaMinusCircle } from "react-icons/fa";

const BudgetForm = () => {
  const queryClient = useQueryClient();

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
    resolver: zodResolver(budgetSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      category: "",
      subcategories: [{ name: "", amount: "" }],
      email: false,
      timeLimit: false,
      startDate: null,
      endDate: null,
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
    mutationFn: async (data) => {
      return await axiosInstance.post("/budget", data);
    },
    onSuccess: (data) => {
      toast.success(data.data.message, "Scroll to view list of all budgets.");
      reset();
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: () => {
      toast.error("Error creating budget");
    },
  });

  const addBudget = (data) => {
    try {
      const formattedData = {
        ...data,
        amount: totalAmount,
      };
      mutate(formattedData);
    } catch (error) {
      toast.error("Error creating budget");
    }
  };

  return (
    <Form
      onSubmit={handleSubmit(addBudget)}
      className=" p-4  bg-white w-100"
      style={{ maxWidth: "500px" }}
    >
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold float-left">Budget Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter budget name"
          {...register("name")}
          isInvalid={!!errors.name}
        />
        <Form.Control.Feedback type="invalid">
          {errors.name?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Category */}
      <Form.Group className="mb-4">
        <Form.Label className="font-medium">Category</Form.Label>
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
          <option value="emergency">Emergency / Unexpected Expenses</option>
          <option value="taxes">Taxes & Fees</option>
          <option value="retirement">Retirement</option>
          <option value="miscellaneous">Miscellaneous / Other</option>
        </Form.Select>

        {errors.category && (
          <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
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

      <Form.Group className="mb-6">
        <div className="space-y-3">
          {/* Clean header */}
          <div>
            <Form.Label className="font-semibold text-gray-800 text-base block mb-2">
              Budget Duration
            </Form.Label>
          </div>

          {/* Minimal checkbox design */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <Form.Check
              type="checkbox"
              id="timeLimit"
              {...register("timeLimit")}
              isInvalid={!!errors.timeLimit}
              className="mt-0.5"
            />
            <div>
              <label
                htmlFor="timeLimit"
                className="text-gray-700 font-medium cursor-pointer"
              >
                Set specific start and end dates
              </label>
              <p className="text-gray-500 text-sm mt-1">
                Uncheck for ongoing budget
              </p>
            </div>
          </div>

          {/* Error state */}
          <Form.Control.Feedback type="invalid" className="d-block">
            {errors.timeLimit?.message}
          </Form.Control.Feedback>
        </div>
      </Form.Group>

      {watch("timeLimit") && (
        <div className="mt-4 mb-4">
          <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <i className="bi bi-calendar-check text-blue-600"></i>
              <span className="font-semibold text-gray-800">
                Set Time Period
              </span>
            </div>

            {/* Date inputs side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Group>
                <Form.Label className="font-medium text-sm text-gray-700 mb-2">
                  Start Date
                </Form.Label>
                <Form.Control
                  type="date"
                  {...register("startDate", { valueAsDate: true })}
                  className="border-gray-300 rounded-lg"
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.startDate.message}
                  </p>
                )}
              </Form.Group>

              <Form.Group>
                <Form.Label className="font-medium text-sm text-gray-700 mb-2">
                  End Date
                </Form.Label>
                <Form.Control
                  type="date"
                  {...register("endDate", { valueAsDate: true })}
                  className="border-gray-300 rounded-lg"
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.endDate.message}
                  </p>
                )}
              </Form.Group>
            </div>
          </div>
        </div>
      )}

      <Form.Group className="mb-6">
        {/* Card container with border */}
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          {/* Checkbox */}
          <div className="flex items-start gap-3 mb-2">
            <Form.Check
              type="checkbox"
              id="emailReminders"
              {...register("email")}
              isInvalid={!!errors.email}
              className="mt-0.5"
            />
            <label
              htmlFor="emailReminders"
              className="text-gray-800 font-medium cursor-pointer"
            >
              Receive email reminders
            </label>
          </div>

          {/* Description paragraph */}
          <p className="text-gray-600 text-sm leading-relaxed mb-0">
            Get notified via email when your expenses are approaching or exceed
            your budget limits.
          </p>

          {/* Error message */}
          {errors.email && (
            <div className="mt-2 text-red-600 text-sm">
              {errors.email.message}
            </div>
          )}
        </div>
      </Form.Group>

      <Button
        type="submit"
        disabled={isPending}
        className="w-100 fw-bold"
        style={{
          backgroundColor: "#9D00FF",
          borderColor: "#9D00FF",
        }}
      >
        {isPending ? "Creating..." : "Create Budget"}
      </Button>
    </Form>
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

export default BudgetForm;
