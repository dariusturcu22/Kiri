"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Home, Search, Upload } from "lucide-react";
import {
  usePropertyStore,
  PropertyFormSchema,
  type PropertyFormData,
  type Property,
} from "@/store/properties";
import Sidebar from "@/components/Sidebar";

const INFO_ITEMS = [
  "Deletion is blocked if an active contract exists.",
  "You can assign a tenant after adding the property.",
  "Rent reminders are sent automatically when occupied.",
];

type FormErrors = Partial<Record<keyof PropertyFormData, string>>;

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h3 className="text-xs font-bold text-brown-mid uppercase tracking-widest">
        {label}
      </h3>
      <div className="flex-1 h-px bg-cream-warm" />
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <label className="block text-xs font-bold text-slate uppercase tracking-wider mb-2">
      {label}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-rose-600 mt-1 px-2">{message}</p>;
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-5 py-3 rounded-full border border-cream-warm text-sm font-medium text-brown-dark placeholder:text-brown-muted focus:outline-none focus:ring-2 focus:ring-brown-mid/30"
      />
      <FieldError message={error} />
    </div>
  );
}

function PropertySummary({ values }: { values: PropertyFormData }) {
  const summaryRows = [
    { label: "Address", value: values.address || "—" },
    { label: "City", value: values.city || "—" },
    { label: "Rent", value: values.rent ? `€ ${values.rent}` : "—" },
    { label: "Status", value: values.status },
  ];

  return (
    <div className="bg-brown-dark rounded-3xl p-6 text-white">
      <h3 className="text-base font-semibold mb-1">Property Summary</h3>
      <p className="text-xs text-brown-muted mb-6">Fills as you type</p>
      <dl className="space-y-4">
        {summaryRows.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-brown-muted uppercase mb-1">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ThingsToKnow() {
  return (
    <div className="bg-card-peach rounded-3xl p-6">
      <h3 className="text-base font-semibold text-brown-dark mb-4">
        Things to know
      </h3>
      <ul className="space-y-3">
        {INFO_ITEMS.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-slate">
            <span className="text-brown-mid mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PropertyForm({
  pageTitle,
  defaultValues,
  onSubmit,
  onCancel,
}: {
  pageTitle: string;
  defaultValues?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<PropertyFormData>({
    name: defaultValues?.name ?? "",
    image: defaultValues?.image ?? "",
    address: defaultValues?.address ?? "",
    city: defaultValues?.city ?? "",
    postalCode: defaultValues?.postalCode ?? "",
    rent: defaultValues?.rent ?? 0,
    currency: defaultValues?.currency ?? "EUR",
    status: defaultValues?.status ?? "Vacant",
    tenants: defaultValues?.tenants ?? [],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function updateField<Key extends keyof PropertyFormData>(
    field: Key,
    value: PropertyFormData[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit() {
    const result = PropertyFormSchema.safeParse(values);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      const fieldErrors: FormErrors = {};
      for (const key in flat) {
        const field = key as keyof PropertyFormData;
        const messages = flat[field];
        if (messages && messages.length > 0) {
          fieldErrors[field] = messages[0];
        }
      }
      setErrors(fieldErrors);
      return;
    }
    onSubmit(result.data);
  }

  return (
    <div className="flex min-h-screen bg-cream-bg font-sans">
      <Sidebar />

      <main className="flex-1 pb-16 md:pb-0">
        <header className="h-14 md:h-16 border-b border-cream-warm flex items-center px-4 md:px-9">
          <h2 className="text-xl md:text-2xl font-extrabold text-brown-dark">
            {pageTitle}
          </h2>
        </header>

        <div className="p-4 md:p-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 md:max-w-xl space-y-5">
            <section className="bg-white rounded-3xl p-7 border border-cream-warm shadow-sm">
              <SectionTitle label="Location" />
              <div className="space-y-4">
                <InputField
                  label="Name"
                  placeholder="e.g. Oxygen Residence"
                  value={values.name}
                  onChange={(value) => updateField("name", value)}
                  error={errors.name}
                />
                <InputField
                  label="Full Address"
                  placeholder="e.g. Piața Abator, Nr. 1, Ap. 20"
                  value={values.address}
                  onChange={(value) => updateField("address", value)}
                  error={errors.address}
                />
                <div className="flex gap-4">
                  <div className="flex-3">
                    <InputField
                      label="City"
                      placeholder="e.g. Cluj-Napoca"
                      value={values.city}
                      onChange={(value) => updateField("city", value)}
                      error={errors.city}
                    />
                  </div>
                  <div className="flex-2">
                    <InputField
                      label="Postal Code"
                      placeholder="e.g. 400001"
                      value={values.postalCode}
                      onChange={(value) => updateField("postalCode", value)}
                      error={errors.postalCode}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-7 border border-cream-warm shadow-sm">
              <SectionTitle label="Financials" />
              <div className="flex gap-4">
                <div className="flex-1">
                  <FieldLabel label="Monthly Rent" />
                  <div className="flex items-center px-5 py-3 rounded-full border border-cream-warm focus-within:ring-2 focus-within:ring-brown-mid/30">
                    <span className="text-sm font-medium text-slate mr-2">
                      €
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values.rent === 0 ? "" : String(values.rent)}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/[^0-9]/g, "");
                        updateField("rent", raw === "" ? 0 : Number(raw));
                      }}
                      placeholder="0"
                      className="flex-1 text-sm font-medium text-brown-dark outline-none"
                    />
                  </div>
                  <FieldError message={errors.rent} />
                </div>
                <div className="w-36">
                  <FieldLabel label="Currency" />
                  <select
                    value={values.currency}
                    onChange={(event) =>
                      updateField(
                        "currency",
                        event.target.value as PropertyFormData["currency"],
                      )
                    }
                    className="w-full px-5 py-3 rounded-full border border-cream-warm text-sm font-medium text-brown-dark appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-brown-mid/30"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-7 border border-cream-warm shadow-sm">
              <SectionTitle label="Occupancy" />
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => updateField("status", "Vacant")}
                  className={`flex flex-col items-center justify-center py-8 rounded-2xl border-2 transition-colors ${
                    values.status === "Vacant"
                      ? "border-brown-mid bg-card-peach"
                      : "border-transparent hover:border-cream-warm"
                  }`}
                >
                  <Home
                    className={`w-6 h-6 mb-2 ${values.status === "Vacant" ? "text-brown-mid" : "text-slate"}`}
                  />
                  <span className="text-sm font-bold text-brown-dark">
                    Vacant
                  </span>
                  <span className="text-xs text-brown-muted mt-1">
                    No active tenant.
                  </span>
                </button>
                <button
                  onClick={() => updateField("status", "Occupied")}
                  className={`flex flex-col items-center justify-center py-8 rounded-2xl border-2 transition-colors ${
                    values.status === "Occupied"
                      ? "border-brown-mid bg-card-peach"
                      : "border-transparent hover:border-cream-warm"
                  }`}
                >
                  <Home
                    className={`w-6 h-6 mb-2 ${values.status === "Occupied" ? "text-brown-mid" : "text-slate"}`}
                  />
                  <span className="text-sm font-bold text-brown-dark">
                    Occupied
                  </span>
                  <span className="text-xs text-brown-muted mt-1">
                    Assign a tenant below.
                  </span>
                </button>
              </div>
              <FieldLabel label="Assign Tenant" />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                <input
                  type="text"
                  placeholder="Search tenant by email..."
                  className="w-full pl-11 pr-5 py-3 rounded-full border border-cream-warm text-sm font-medium text-brown-dark placeholder:text-brown-muted focus:outline-none focus:ring-2 focus:ring-brown-mid/30"
                />
              </div>
            </section>

            <section className="bg-white rounded-3xl p-7 border border-cream-warm shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <h3 className="text-xs font-bold text-brown-mid uppercase tracking-widest">
                  Property Image
                </h3>
                <span className="text-xs text-brown-muted">(optional)</span>
                <div className="flex-1 h-px bg-cream-warm" />
              </div>
              <div className="border-2 border-dashed border-cream-warm rounded-2xl p-12 text-center">
                <Upload className="w-6 h-6 text-slate mx-auto mb-3" />
                <p className="text-sm font-medium text-slate mb-1">
                  Drop an image or click to browse
                </p>
                <p className="text-xs text-brown-muted">
                  JPG or PNG, up to 5MB
                </p>
              </div>
            </section>

            <p className="text-xs text-brown-muted italic px-2">
              All fields except image are required.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onCancel}
                className="px-6 py-3 text-sm font-semibold text-slate hover:text-brown-dark transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-brown-mid hover:bg-brown-dark text-white text-sm font-semibold rounded-full transition-colors"
              >
                Save Property
              </button>
            </div>
          </div>

          <aside className="hidden md:block w-80 space-y-5">
            <PropertySummary values={values} />
            <ThingsToKnow />
          </aside>
        </div>
      </main>
    </div>
  );
}

export function NewPropertyPage() {
  const router = useRouter();
  const { addProperty } = usePropertyStore();

  return (
    <PropertyForm
      pageTitle="Add Property"
      onSubmit={async (data) => {
        await addProperty(data);
        router.push("/properties");
      }}
      onCancel={() => router.push("/properties")}
    />
  );
}

export function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const { getPropertyById, updateProperty } = usePropertyStore();

  const propertyId = Number(params.id);
  const [property, setProperty] = useState<Property | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPropertyById(propertyId).then((found) => {
      setProperty(found);
      setIsLoading(false);
    });
  }, [propertyId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-bg">
        <p className="text-slate text-sm">Loading property...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream-bg">
        <p className="text-slate">Property not found.</p>
      </div>
    );
  }

  const defaultValues: Partial<PropertyFormData> = {
    name: property.name,
    image: property.image ?? "",
    address: property.address,
    city: property.city,
    postalCode: property.postalCode,
    rent: property.rent,
    currency: property.currency,
    status: property.status,
    tenants: property.tenants,
  };

  return (
    <PropertyForm
      pageTitle="Edit Property"
      defaultValues={defaultValues}
      onSubmit={async (data) => {
        await updateProperty(propertyId, data);
        router.push(`/properties/${propertyId}`);
      }}
      onCancel={() => router.push(`/properties/${propertyId}`)}
    />
  );
}
