import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CaretDown, Camera, Plus, Trash, UploadSimple, Warning, X } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { CategoryIcon, MerchantTile } from "@/components/ui/category";
import { Dropzone } from "@/components/ui/dropzone";
import { Field, FieldError, Input, Label } from "@/components/ui/field";
import { CategoryPicker } from "@/components/ui/menu";
import { categoryLabel } from "@/lib/categories";
import { formatKES, localToday, titleCase } from "@/lib/format";
import { refreshMoneyData } from "@/lib/refresh";
import { cn } from "@/lib/utils";
import { quickExpenseSchema } from "@/zodSchemas/schemas.js";

const RECENT_MERCHANTS = 6;

const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString("en-CA");
};

const blankForm = (date = localToday()) => ({ amount: "", merchant: "", category: "", date, items: [] });

const chipStyles =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted";

const BudgetHint = ({ budget, amount }) => {
  const after = budget.left - (amount || 0);
  const name = titleCase(budget.name);
  if (after < 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
        <Warning className="size-3.5 shrink-0" aria-hidden />
        This takes {name} {formatKES(-after)} over
      </p>
    );
  }
  return (
    <p className="text-xs text-muted-foreground tabular-nums">
      Counts toward {name} · {formatKES(after)} left
    </p>
  );
};

const AddExpenseForm = ({ startWithScan, onClose }) => {
  const queryClient = useQueryClient();
  const amountRef = useRef(null);
  const fileRef = useRef(null);
  const categoryChosen = useRef(false);
  const [scanning, setScanning] = useState(startWithScan);
  const [receipt, setReceipt] = useState(null);
  const [pickingDate, setPickingDate] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm({ resolver: zodResolver(quickExpenseSchema), defaultValues: blankForm() });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "items" });
  const [amount, merchant, category, date, items] = useWatch({
    control,
    name: ["amount", "merchant", "category", "date", "items"],
  });
  const splitting = fields.length > 0;
  const itemsTotal = items?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) ?? 0;

  useEffect(() => {
    if (splitting) setValue("amount", itemsTotal);
  }, [splitting, itemsTotal, setValue]);

  const { data: quickAdd } = useQuery({
    queryKey: ["quick-add"],
    queryFn: async () => (await axiosInstance.get("/expenses/quick-add")).data,
  });
  const known = quickAdd?.merchants ?? [];

  const fillCategory = (name) => {
    if (categoryChosen.current) return;
    const match = known.find((row) => row.merchant.toLowerCase() === name.trim().toLowerCase());
    if (match) setValue("category", match.category, { shouldValidate: true });
  };

  const pickMerchant = ({ merchant: name, category: remembered }) => {
    setValue("merchant", name, { shouldValidate: true });
    if (!categoryChosen.current) setValue("category", remembered, { shouldValidate: true });
  };

  const readReceipt = useMutation({
    mutationFn: async (file) => {
      const body = new FormData();
      body.append("receiptImage", file);
      const response = await axiosInstance.post("/upload/receipt", body, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 45000,
      });
      return response.data.extractedData;
    },
    onSuccess: (found) => {
      setScanning(false);
      if (found.amount) setValue("amount", Number(found.amount));
      if (found.date && found.date <= localToday()) {
        setValue("date", found.date);
        setPickingDate(![localToday(), yesterday()].includes(found.date));
      }
      if (found.merchant) {
        setValue("merchant", found.merchant);
        fillCategory(found.merchant);
      }
      toast.success("Receipt read. Check the details.");
    },
    onError: (error) => {
      setScanning(false);
      toast.error(error.response?.data?.message || "We couldn't read that receipt. Enter it by hand.");
    },
  });

  const chooseFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setReceipt(URL.createObjectURL(file));
    readReceipt.mutate(file);
  };

  const removeReceipt = () => {
    setReceipt(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = useMutation({
    mutationFn: async ({ values }) => {
      if (receipt) {
        return await axiosInstance.post("/expenses/save", {
          amount: values.amount,
          date: values.date,
          category: values.category,
          merchant: values.merchant,
          description: values.merchant.slice(0, 100),
          budgeted: false,
        });
      }
      return await axiosInstance.post("/expenses", {
        amount: values.amount,
        date: values.date,
        category: values.category,
        merchant: values.merchant,
        subcategories: values.items.length ? values.items : [{ name: values.merchant, amount: values.amount }],
      });
    },
    onSuccess: (_, { values, again }) => {
      toast.success(`${values.merchant} saved`);
      refreshMoneyData(queryClient);
      if (!again) {
        onClose();
        return;
      }
      reset(blankForm(values.date));
      categoryChosen.current = false;
      removeReceipt();
      amountRef.current?.focus();
    },
    onError: (error) => toast.error(error.response?.data?.message || "This expense couldn't be saved."),
  });

  const submit = (again) => handleSubmit((values) => save.mutate({ values, again }));

  const startSplit = () => {
    append({ name: "", amount: Number.isFinite(amount) ? amount : "" });
  };

  const budget = quickAdd?.budgets?.[category];
  const thisMonth = date?.slice(0, 7) === localToday().slice(0, 7);
  const { ref: amountField, ...amountProps } = register("amount", { valueAsNumber: true });

  return (
    <form onSubmit={submit(false)} className="flex flex-1 flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-3 pr-8">
        <h2 className="text-lg">Add expense</h2>
        {!scanning && !receipt && (
          <Button variant="ghost" size="sm" onClick={() => setScanning(true)}>
            <Camera /> Scan receipt
          </Button>
        )}
      </div>

      {scanning && !readReceipt.isPending && (
        <Dropzone
          inputRef={fileRef}
          accept="image/*"
          onFile={chooseFile}
          icon={Camera}
          title="Add a photo of your receipt"
          hint="PNG or JPG, up to 10 MB"
          buttonLabel="Choose image"
        />
      )}

      {receipt && (
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <img src={receipt} alt="Your receipt" className="size-12 rounded-md object-cover" />
          <p className="min-w-0 flex-1 text-sm font-medium">
            {readReceipt.isPending ? "Reading receipt..." : "Details from your receipt"}
          </p>
          <Button variant="ghost" size="icon" aria-label="Remove receipt" className="size-7" onClick={removeReceipt}>
            <X />
          </Button>
        </div>
      )}

      <div>
        <label htmlFor="quickAmount" className="text-sm font-medium">
          Amount
        </label>
        <div className="mt-1 flex items-baseline gap-2 border-b-2 border-input pb-1 focus-within:border-primary">
          <span className="text-lg font-medium text-muted-foreground">KES</span>
          <input
            id="quickAmount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
            readOnly={splitting}
            aria-invalid={!!errors.amount}
            className="w-full min-w-0 [appearance:textfield] bg-transparent text-3xl font-semibold tracking-tight tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            {...amountProps}
            ref={(element) => {
              amountField(element);
              amountRef.current = element;
            }}
          />
        </div>
        <FieldError className="mt-1">{errors.amount?.message}</FieldError>
      </div>

      <Field label="Paid to" htmlFor="quickMerchant" error={errors.merchant?.message}>
        <Input
          id="quickMerchant"
          list="knownMerchants"
          autoComplete="off"
          placeholder="Naivas, Mama Mboga, KPLC"
          aria-invalid={!!errors.merchant}
          {...register("merchant", { onChange: (e) => fillCategory(e.target.value) })}
        />
        <datalist id="knownMerchants">
          {known.map((row) => (
            <option key={row.merchant} value={row.merchant} />
          ))}
        </datalist>
        {!merchant && known.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {known.slice(0, RECENT_MERCHANTS).map((row) => (
              <button key={row.merchant} type="button" className={cn(chipStyles, "pl-1")} onClick={() => pickMerchant(row)}>
                <MerchantTile name={row.merchant} className="size-6 rounded-full text-[10px]" />
                <span className="max-w-32 truncate">{row.merchant}</span>
              </button>
            ))}
          </div>
        )}
      </Field>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <CategoryPicker
          modal
          value={category}
          label="Choose a category"
          onChange={(value) => {
            categoryChosen.current = true;
            setValue("category", value, { shouldValidate: true });
          }}
          triggerClassName={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none",
            errors.category && "border-danger"
          )}
        >
          {category ? (
            <>
              <CategoryIcon category={category} />
              <span className="flex-1 truncate">{categoryLabel(category)}</span>
            </>
          ) : (
            <span className="flex-1 text-muted-foreground">Choose a category</span>
          )}
          <CaretDown className="size-3.5 text-muted-foreground" aria-hidden />
        </CategoryPicker>
        <FieldError>{errors.category?.message}</FieldError>
        {budget && thisMonth && <BudgetHint budget={budget} amount={amount} />}
      </div>

      <div className="space-y-1.5">
        <Label>Date</Label>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["Today", localToday()],
            ["Yesterday", yesterday()],
          ].map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={!pickingDate && date === value}
              className={cn(chipStyles, !pickingDate && date === value && "border-primary bg-accent text-accent-foreground")}
              onClick={() => {
                setPickingDate(false);
                setValue("date", value, { shouldValidate: true });
              }}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={pickingDate}
            className={cn(chipStyles, pickingDate && "border-primary bg-accent text-accent-foreground")}
            onClick={() => setPickingDate(true)}
          >
            Other date
          </button>
        </div>
        {pickingDate && <Input type="date" aria-label="Date" max={localToday()} {...register("date")} />}
        <FieldError>{errors.date?.message}</FieldError>
      </div>

      {!receipt &&
        (splitting ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button variant="ghost" size="sm" onClick={() => replace([])}>
                Remove split
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input aria-label={`Item ${index + 1} name`} placeholder="Item" {...register(`items.${index}.name`)} />
                <Input
                  aria-label={`Item ${index + 1} amount`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0"
                  className="w-28 shrink-0 tabular-nums"
                  {...register(`items.${index}.amount`, { valueAsNumber: true })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label={`Remove item ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash />
                </Button>
              </div>
            ))}
            <FieldError>{errors.items?.message || errors.items?.root?.message}</FieldError>
            <Button variant="ghost" size="sm" onClick={() => append({ name: "", amount: "" })}>
              <Plus /> Add item
            </Button>
          </div>
        ) : (
          <button type="button" className="self-start text-sm font-medium text-primary hover:underline" onClick={startSplit}>
            Split into items
          </button>
        ))}

      <div className="mt-auto space-y-2 pt-2">
        <Button type="submit" className="w-full" loading={save.isPending}>
          {save.isPending ? "Saving..." : "Save expense"}
        </Button>
        <Button variant="secondary" className="w-full" disabled={save.isPending} onClick={submit(true)}>
          Save and add another
        </Button>
        <Link
          to="/import"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <UploadSimple className="size-4" aria-hidden /> Import an M-Pesa statement
        </Link>
      </div>
    </form>
  );
};

export default AddExpenseForm;
