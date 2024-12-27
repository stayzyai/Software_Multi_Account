import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}
