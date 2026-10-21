import { z } from "zod";

export const createOrderSchema = z.object({
  dailyMenuId: z.string().min(1),
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z
    .string()
    .min(10, "Enter a valid phone number")
    .max(15),
  customerEmail: z.string().email().optional().or(z.literal("")),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().optional(),
  officeId: z.string().optional(),
  dropPointId: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
  captainTip: z.number().int().min(0).optional(),
  serviceFee: z.number().int().min(0).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "READY", "COMPLETED", "CANCELLED"]),
});

export const createMealSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  price: z.number().int().min(0),
  originalPrice: z.number().int().min(0).optional().nullable(),
  maxDeals: z.number().int().min(0).default(20),
  claimedPad: z.number().int().min(0).default(0),
  tag: z.enum(["REGULAR", "DEAL"]).default("REGULAR"),
  type: z.enum(["FIXED", "BUILD_YOUR_PLATE"]).default("FIXED"),
});

export const createDailyMenuSchema = z.object({
  date: z.string().min(1),
  mealId: z.string().min(1),
  timeSlotId: z.string().min(1),
  maxOrders: z.number().int().min(1),
});
