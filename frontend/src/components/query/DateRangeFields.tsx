import { useQueryDraft } from "../../context/QueryDraftContext";
import type { QueryFieldErrors } from "../../lib/validation";
import { TextField } from "../ui/TextField";

const today = new Date();
const TODAY = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

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
        max={TODAY}
        onChange={(e) => patch({ startDate: e.target.value })}
        error={errors?.startDate}
        disabled={disabled}
      />
      <TextField
        label="End date"
        type="date"
        value={values.endDate}
        max={TODAY}
        onChange={(e) => patch({ endDate: e.target.value })}
        error={errors?.endDate}
        disabled={disabled}
      />
    </div>
  );
}
