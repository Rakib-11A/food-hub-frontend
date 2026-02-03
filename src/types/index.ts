// Match backend Prisma/enums and API responses

export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";
export type OrderStatus = "PLACED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";

export interface Category {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image: string | null;
  sortOrder: number | null;
  isActive: boolean;
}

export interface ProviderProfileBasic {
  id: string;
  businessName: string;
  address?: string | null;
}

export interface Meal {
  id: string;
  providerProfileId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: string | number;
  image: string | null;
  dietaryTags: string[];
  isAvailable: boolean;
  providerProfile?: ProviderProfileBasic & { id: string; businessName: string };
  category?: { id: string; name: string } | null;
}

export interface MealWithProvider extends Meal {
  providerProfile?: { id: string; businessName: string };
  category?: { id: string; name: string } | null;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logo: string | null;
  isActive: boolean;
  user?: { name: string; email: string };
  meals?: Meal[];
  _count?: { meals: number };
}

export interface OrderItem {
  id?: string;
  mealId: string;
  quantity: number;
  unitPrice: string | number;
  subtotal?: string | number;
  meal?: Meal;
}

export interface Order {
  id: string;
  customerId: string;
  providerProfileId: string;
  status: OrderStatus;
  deliveryAddress: string;
  contactPhone: string | null;
  totalAmount: string | number;
  paymentMethod: string | null;
  notes: string | null;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
  providerProfile?: ProviderProfileBasic & { id: string; businessName: string };
  customer?: { id: string; name: string; email: string };
}

export interface Review {
  id: string;
  userId: string;
  mealId: string;
  orderId: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { name: string };
}

export interface UserAdmin {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Cart (frontend only)
export interface CartItem {
  mealId: string;
  quantity: number;
  name?: string;
  price?: number;
  image?: string | null;
  providerProfileId?: string;
}

// Create order body
export interface CreateOrderBody {
  providerProfileId: string;
  deliveryAddress: string;
  contactPhone?: string;
  paymentMethod?: string;
  notes?: string;
  items: { mealId: string; quantity: number }[];
}
