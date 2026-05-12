import { create } from "zustand";
import { z } from "zod";
import api from "@/lib/axios";
import { trackEvent } from "@/lib/activity";

export const TenantSchema = z.object({
  id: z.number().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().optional().nullable(),
  backgroundColor: z.string(),
  textColor: z.string(),
  initials: z.string().optional(),
});

export const PropertySchema = z.object({
  id: z.number(),
  name: z.string(),
  image: z.string().optional().nullable(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  rent: z.number(),
  currency: z.enum(["RON", "EUR", "USD", "GBP"]),
  status: z.enum(["Vacant", "Occupied"]),
  tenants: z.array(TenantSchema),
  dateAdded: z.string(),
  lastUpdated: z.string(),
});

export const PropertyFormSchema = PropertySchema.omit({
  id: true,
  dateAdded: true,
  lastUpdated: true,
});

export type Tenant = z.infer<typeof TenantSchema>;
export type Property = z.infer<typeof PropertySchema>;
export type PropertyFormData = z.infer<typeof PropertyFormSchema>;

type PropertyStore = {
  properties: Property[];
  isLoading: boolean;
  totalCount: number;
  fetchProperties: (params?: {
    page?: number;
    pageSize?: number;
    city?: string;
    status?: string;
  }) => Promise<void>;
  addProperty: (data: PropertyFormData) => Promise<void>;
  updateProperty: (id: number, data: PropertyFormData) => Promise<void>;
  deleteProperty: (id: number) => Promise<void>;
  getPropertyById: (id: number) => Promise<Property | undefined>;
};

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  isLoading: false,
  totalCount: 0,

  fetchProperties: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/api/properties", { params });
      set({
        properties: response.data.items || [],
        totalCount: response.data.totalCount || 0,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, properties: [] });
    }
  },

  addProperty: async (data) => {
    try {
      const response = await api.post<Property>("/api/properties", data);
      trackEvent("property_created", data.name);
      set((state) => ({ properties: [...state.properties, response.data] }));
    } catch {}
  },

  updateProperty: async (id, data) => {
    try {
      const response = await api.put<Property>(`/api/properties/${id}`, data);
      trackEvent("property_edited", `ID: ${id} - ${data.name}`);
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === id ? response.data : p,
        ),
      }));
    } catch {}
  },

  deleteProperty: async (id) => {
    try {
      const property = get().properties.find((p) => p.id === id);
      await api.delete(`/api/properties/${id}`);
      trackEvent("property_deleted", property?.name || `ID: ${id}`);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
      }));
    } catch {}
  },

  getPropertyById: async (id) => {
    const local = get().properties.find((p) => p.id === id);
    if (local) return local;
    try {
      const response = await api.get<Property>(`/api/properties/${id}`);
      return response.data;
    } catch {
      return undefined;
    }
  },
}));