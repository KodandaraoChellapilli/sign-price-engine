import { FormEvent, useMemo, useState } from "react";

type PredictPayload = {
  width: number;
  height: number;
  sign_type: string;
  material: string;
  complexity: string;
  lighting: boolean;
  installation: boolean;
  quantity: number;
};

type PredictResponse = {
  estimated_price: number;
};

type ApiError = {
  detail?: string;
};

type FormState = {
  width: string;
  height: string;
  sign_type: string;
  material: string;
  complexity: string;
  lighting: boolean;
  installation: boolean;
  quantity: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const initialFormState: FormState = {
  width: "",
  height: "",
  sign_type: "",
  material: "",
  complexity: "",
  lighting: false,
  installation: false,
  quantity: "",
};

function validatePayload(payload: PredictPayload): string | null {
  if (!payload.width || payload.width <= 0) return "Width must be greater than 0.";
  if (!payload.height || payload.height <= 0) return "Height must be greater than 0.";
  if (!payload.sign_type) return "Please select a sign type.";
  if (!payload.material) return "Please select a material.";
  if (!payload.complexity) return "Please select a complexity level.";
  if (!payload.quantity || payload.quantity < 1) return "Quantity must be at least 1.";
  return null;
}

function toPayload(form: FormState): PredictPayload {
  return {
    width: Number(form.width),
    height: Number(form.height),
    sign_type: form.sign_type,
    material: form.material,
    complexity: form.complexity,
    lighting: form.lighting,
    installation: form.installation,
    quantity: Number(form.quantity),
  };
}

function App() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [requestError, setRequestError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultAnimateKey, setResultAnimateKey] = useState<number>(0);

  const formattedPrice = useMemo(() => {
    if (estimatedPrice === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(estimatedPrice);
  }, [estimatedPrice]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError("");
    setRequestError("");

    const payload = toPayload(form);
    const errorMessage = validatePayload(payload);
    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as PredictResponse | ApiError;
      if (!response.ok) {
        const message = "detail" in result ? result.detail : undefined;
        throw new Error(message || "Unable to get prediction right now.");
      }

      if (!("estimated_price" in result)) {
        throw new Error("Invalid API response shape.");
      }

      setEstimatedPrice(result.estimated_price);
      setResultAnimateKey((prev) => prev + 1);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unexpected request error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="card">
        <header className="card-header">
          <h1>Sign Price Predictor</h1>
          <p>Estimate project pricing instantly using trained ML predictions.</p>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid two-col">
            <label className="field">
              <span>Width (ft)</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.width}
                onChange={(event) => setForm((prev) => ({ ...prev, width: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Height (ft)</span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.height}
                onChange={(event) => setForm((prev) => ({ ...prev, height: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="grid two-col">
            <label className="field">
              <span>Sign Type</span>
              <select
                value={form.sign_type}
                onChange={(event) => setForm((prev) => ({ ...prev, sign_type: event.target.value }))}
                required
              >
                <option value="">Select sign type</option>
                <option value="banner">Banner</option>
                <option value="channel_letter">Channel Letter</option>
                <option value="monument">Monument</option>
                <option value="vinyl">Vinyl</option>
              </select>
            </label>
            <label className="field">
              <span>Material</span>
              <select
                value={form.material}
                onChange={(event) => setForm((prev) => ({ ...prev, material: event.target.value }))}
                required
              >
                <option value="">Select material</option>
                <option value="acrylic">Acrylic</option>
                <option value="aluminum">Aluminum</option>
                <option value="pvc">PVC</option>
              </select>
            </label>
          </div>

          <div className="grid two-col">
            <label className="field">
              <span>Complexity</span>
              <select
                value={form.complexity}
                onChange={(event) => setForm((prev) => ({ ...prev, complexity: event.target.value }))}
                required
              >
                <option value="">Select complexity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="toggles">
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.lighting}
                onChange={(event) => setForm((prev) => ({ ...prev, lighting: event.target.checked }))}
              />
              <span>Lighting Included</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.installation}
                onChange={(event) => setForm((prev) => ({ ...prev, installation: event.target.checked }))}
              />
              <span>Installation Included</span>
            </label>
          </div>

          {validationError && <p className="message error">{validationError}</p>}
          {requestError && <p className="message error">{requestError}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Predicting..." : "Predict Price"}
          </button>
        </form>

        <section
          key={resultAnimateKey}
          className={`result ${estimatedPrice !== null ? "show" : "hidden"}`}
          aria-live="polite"
        >
          <p className="result-label">Estimated Price</p>
          <p className="result-value">{formattedPrice}</p>
        </section>
      </section>
    </main>
  );
}

export default App;
