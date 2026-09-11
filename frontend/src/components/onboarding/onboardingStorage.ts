const STORAGE_KEY = "clymlens:onboarding-complete:v1";

export function hasCompletedOnboarding(): boolean {
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function completeOnboarding(): void {
  window.localStorage.setItem(STORAGE_KEY, "true");
}
