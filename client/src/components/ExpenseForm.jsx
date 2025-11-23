import Form from "react-bootstrap/Form";
import Navbar from "./Navbar.jsx";
import { toast, ToastContainer } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/axiosInstance";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Card } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema } from "@/zodSchemas/schemas.js";
import { useMemo, useState } from "react";
import LimitNotification from "./LimitNotification.jsx";
import SubcategoryRow from "./SubcategoryRow.jsx";
import UploadReceipt from "./UploadReceipt.jsx";
import UploadMpesaPdf from "./UploadMpesaPdf.jsx";
import { Camera, FileText, Smartphone, Plus, X } from "lucide-react";

const ExpenseForm = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeUploadMethod, setActiveUploadMethod] = useState(null); // 'receipt', 'mpesa', or null

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
      budgetNames: "",
      budgeted: false,
    },
    shouldUnregister: true,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subcategories",
  });

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

  const { data: budgetData } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      return await axiosInstance.get(`/budget/names`);
    },
    keepPreviousData: true,
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

  const handleUploadMethodSelect = (method) => {
    setActiveUploadMethod(method);
  };

  const handleUploadClose = () => {
    setActiveUploadMethod(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64">
        <Navbar />
      </div>

      <div className="flex-1 p-6">
        <LimitNotification />
        <ToastContainer position="top-right" autoClose={3000} theme="light" />

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              Add New Expense
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose your preferred method to record expenses - manual entry,
              receipt upload, or M-Pesa statement analysis
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Manual Entry Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Manual Expense Entry
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUploadMethodSelect("receipt")}
                      className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-600 font-medium rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      Upload Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUploadMethodSelect("mpesa")}
                      className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-600 font-medium rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                    >
                      <Smartphone className="w-4 h-4" />
                      M-Pesa PDF
                    </button>
                  </div>
                </div>

                <Form onSubmit={handleSubmit(addExpense)}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Form.Group className="mb-4">
                      <Form.Label className="block text-sm font-medium text-gray-700 mb-2">
                        Expense Category
                      </Form.Label>
                      <Form.Select
                        {...register("category")}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      >
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
                        <option value="entertainment">
                          Entertainment & Leisure
                        </option>
                        <option value="gifts">Gifts & Donations</option>
                        <option value="householdSupplies">
                          Household Supplies
                        </option>
                        <option value="family">Childcare & Family</option>
                        <option value="pets">Pets & Pet Care</option>
                        <option value="work">Work & Business</option>
                        <option value="technology">
                          Technology & Subscriptions
                        </option>
                        <option value="travel">Travel & Vacations</option>
                        <option value="emergency">
                          Emergency / Unexpected Expenses
                        </option>
                        <option value="taxes">Taxes & Fees</option>
                        <option value="retirement">Retirement</option>
                        <option value="miscellaneous">
                          Miscellaneous / Other
                        </option>
                      </Form.Select>

                      {errors.category && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.category.message}
                        </p>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        {...register("date", { valueAsDate: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                      {errors.date && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.date.message}
                        </p>
                      )}
                    </Form.Group>
                  </div>

                  <Card className="mb-6 border border-gray-200 rounded-xl shadow-sm">
                    <Card.Body className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-semibold text-gray-800">
                          Subcategories
                        </h5>
                        <div className="text-lg font-bold text-green-600">
                          KES{" "}
                          {(totalAmount || 0).toLocaleString("en-KE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>

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
                        className="flex items-center gap-2 border-purple-200 text-purple-600 hover:bg-purple-50 mt-4"
                      >
                        <Plus className="w-4 h-4" />
                        Add Subcategory
                      </Button>
                    </Card.Body>
                  </Card>

                  <Form.Group className="mb-6">
                    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-start gap-3 mb-2">
                        <Form.Check
                          type="checkbox"
                          id="budgeted"
                          {...register("budgeted")}
                          isInvalid={!!errors.budgeted}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="budgeted"
                          className="text-gray-800 font-medium cursor-pointer"
                        >
                          Track against budget?
                        </label>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-0">
                        Monitor this expense against your set budget limits.
                      </p>

                      {errors.budgeted && (
                        <div className="mt-2 text-red-600 text-sm">
                          {errors.budgeted.message}
                        </div>
                      )}
                    </div>
                  </Form.Group>

                  {watch("budgeted") && (
                    <Form.Group className="mb-6">
                      <Form.Label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Budgets
                      </Form.Label>
                      <Form.Select
                        {...register("budgetNames")}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      >
                        <option value="">Choose a Budget</option>
                        {budgetData?.data?.data?.map((budget) => {
                          return (
                            <option key={budget.budget_id} value={budget.name}>
                              {budget.name.toUpperCase()}
                            </option>
                          );
                        })}
                      </Form.Select>

                      {errors.budgetNames && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.budgetNames.message}
                        </p>
                      )}
                    </Form.Group>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl"
                  >
                    {isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      "Submit Expense"
                    )}
                  </button>
                </Form>
              </div>
            </div>

            {/* Upload Methods Sidebar */}
            <div className="space-y-6">
              {/* Quick Upload Options */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Quick Upload
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={() => handleUploadMethodSelect("receipt")}
                    className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
                  >
                    <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-all">
                      <Camera className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800">
                        Upload Receipt
                      </div>
                      <div className="text-sm text-gray-500">
                        Scan or photo of receipt
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleUploadMethodSelect("mpesa")}
                    className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
                  >
                    <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-all">
                      <Smartphone className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800">
                        M-Pesa Statement
                      </div>
                      <div className="text-sm text-gray-500">
                        PDF statement analysis
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Benefits Card */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Upload Benefits
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Automatic data extraction
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Faster expense recording
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Digital receipt storage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Smart categorization
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modals */}
        {activeUploadMethod === "receipt" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Upload Receipt
                </h3>
                <button
                  onClick={handleUploadClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <UploadReceipt />
              </div>
            </div>
          </div>
        )}

        {activeUploadMethod === "mpesa" && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Upload M-Pesa Statement
                </h3>
                <button
                  onClick={handleUploadClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <UploadMpesaPdf />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseForm;
