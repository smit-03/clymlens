import { useCallback, useRef, useState } from "react";

import { ApiError } from "../api/client";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
}

export interface AsyncController<T, Args extends unknown[]> extends AsyncState<T> {
  run: (...args: Args) => Promise<T>;
  reset: () => void;
}

/**
 * Wraps an async function with uniform idle/loading/success/error state so every
 * panel can render all four cases explicitly.
 */
export function useAsync<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
): AsyncController<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
    isLoading: false,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async (...args: Args): Promise<T> => {
    setState((prev) => ({
      status: "loading",
      data: prev.data,
      error: null,
      isLoading: true,
    }));
    try {
      const data = await fnRef.current(...args);
      setState({ status: "success", data, error: null, isLoading: false });
      return data;
    } catch (cause) {
      const error =
        cause instanceof ApiError
          ? cause
          : new ApiError("Something went wrong. Please try again.", 0);
      setState({ status: "error", data: null, error, isLoading: false });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", data: null, error: null, isLoading: false });
  }, []);

  return { ...state, run, reset };
}
