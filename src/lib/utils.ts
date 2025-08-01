import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

/**
 * A wrapper around the native `fetch` function that automatically adds the
 * API key to the headers for all API requests.
 *
 * @param url The URL to fetch.
 * @param options The options to pass to the `fetch` call.
 * @returns A promise that resolves to the response.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = import.meta.env.VITE_API_KEY || "test-api-key-12345";

  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, fetchOptions);
}
