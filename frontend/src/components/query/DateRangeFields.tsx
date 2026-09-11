import { useQueryDraft } from "../../context/QueryDraftContext";
import type { QueryFieldErrors } from "../../lib/validation";
import { TextField } from "../ui/TextField";

export function DateRangeFields({
  errors,
  disabled,
}: {
  errors?: QueryFieldErrors;
  disabled?: boolean;
}) {
  const { values, patch } = useQueryDraft();

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <TextField
        label="Start date"
        type="date"
        value={values.startDate}
        onChange={(e) => patch({ startDate: e.target.value })}
        error={errors?.startDate}
        disabled={disabled}
      />
      <TextField
        label="End date"
        type="date"
        value={values.endDate}
        onChange={(e) => patch({ endDate: e.target.value })}
        error={errors?.endDate}
        disabled={disabled}
      />
    </div>
  );
}
