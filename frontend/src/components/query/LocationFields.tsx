import { useQueryDraft } from "../../context/QueryDraftContext";
import type { QueryFieldErrors } from "../../lib/validation";
import { TextField } from "../ui/TextField";

interface LocationFieldsProps {
  errors?: QueryFieldErrors;
  onEdit?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

/** The literal case-study-required Latitude/Longitude inputs, reused wherever they appear. */
export function LocationFields({ errors, onEdit, disabled, size = "md" }: LocationFieldsProps) {
  const { values, patch } = useQueryDraft();

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <TextField
        label="Latitude"
        hideLabel={size === "sm"}
        inputMode="decimal"
        placeholder="Latitude (-90 to 90)"
        value={values.latitude}
        onChange={(e) => {
          patch({ latitude: e.target.value });
          onEdit?.();
        }}
        error={errors?.latitude}
        disabled={disabled}
        className={size === "sm" ? "text-sm" : undefined}
      />
      <TextField
        label="Longitude"
        hideLabel={size === "sm"}
        inputMode="decimal"
        placeholder="Longitude (-180 to 180)"
        value={values.longitude}
        onChange={(e) => {
          patch({ longitude: e.target.value });
          onEdit?.();
        }}
        error={errors?.longitude}
        disabled={disabled}
        className={size === "sm" ? "text-sm" : undefined}
      />
    </div>
  );
}
