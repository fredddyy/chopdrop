const STORAGE_KEY = "chopdrop-customer";

export interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  preferredFulfillment: "PICKUP" | "DELIVERY";
  officeCode?: string;
  officeId?: string;
  officeName?: string;
  collectionPoint?: string;
  reminders?: boolean;
}

export function getCustomerProfile(): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveCustomerProfile(profile: CustomerProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearCustomerProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}
