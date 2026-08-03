// ============================================================
// CORE TYPES
// ============================================================

export type UserRole = 'super_admin' | 'gym_owner' | 'staff' | 'trainer' | 'customer';

export type MembershipStatus = 'active' | 'expired' | 'suspended' | 'frozen' | 'pending';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled' | 'refunded';

export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'maintenance';

// ============================================================
// AUTH TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  gymId?: string;
  gymName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}

export interface OTPPayload {
  email: string;
  otp: string;
}

// ============================================================
// MEMBER TYPES
// ============================================================

export interface Member {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  membershipPlan: string;
  membershipStatus: MembershipStatus;
  renewDate: string;
  attendance: number;
  visits: number;
  trainerId?: string;
  trainerName?: string;
  gymId: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile extends Member {
  dateOfBirth?: string;
  address?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  emergencyContact?: EmergencyContact;
  documents?: Document[];
  qrCode?: string;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

// ============================================================
// MEMBERSHIP PLAN TYPES
// ============================================================

export interface MembershipPlan {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'student' | 'premium' | 'vip';
  price: number;
  duration: number; // in days
  benefits: string[];
  entryLimit?: number;
  isActive: boolean;
  gymId: string;
  createdAt: string;
}

// ============================================================
// TRAINER TYPES
// ============================================================

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialization: string[];
  rating: number;
  clients: number;
  workingHours: string;
  availability: boolean;
  salary: number;
  gymId: string;
  joinedAt: string;
}

// ============================================================
// STAFF TYPES
// ============================================================

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'receptionist' | 'manager' | 'cashier' | 'support';
  shift: string;
  salary: number;
  attendance: number;
  gymId: string;
  joinedAt: string;
}

// ============================================================
// CLASS TYPES
// ============================================================

export interface GymClass {
  id: string;
  name: string;
  trainerId: string;
  trainerName: string;
  capacity: number;
  enrolled: number;
  waitingList: number;
  schedule: string;
  duration: number; // minutes
  date: string;
  gymId: string;
}

// ============================================================
// EQUIPMENT TYPES
// ============================================================

export interface Equipment {
  id: string;
  name: string;
  category: string;
  condition: EquipmentCondition;
  purchaseDate: string;
  warrantyExpiry: string;
  nextService: string;
  usageHours: number;
  gymId: string;
  serviceHistory: ServiceRecord[];
}

export interface ServiceRecord {
  id: string;
  date: string;
  description: string;
  technician: string;
  cost: number;
}

// ============================================================
// NUTRITION / PRODUCT TYPES
// ============================================================

export interface Product {
  id: string;
  name: string;
  category: 'protein' | 'creatine' | 'mass_gainer' | 'meal_plan' | 'accessory';
  price: number;
  stock: number;
  discount?: number;
  description?: string;
  image?: string;
  gymId: string;
}

export interface Order {
  id: string;
  orderId: string;
  memberId: string;
  memberName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

// ============================================================
// PAYMENT TYPES
// ============================================================

export interface Payment {
  id: string;
  transactionId: string;
  memberId: string;
  memberName: string;
  amount: number;
  type: 'membership' | 'nutrition' | 'class' | 'other';
  status: PaymentStatus;
  gateway: 'razorpay' | 'cash' | 'card';
  createdAt: string;
}

// ============================================================
// ATTENDANCE TYPES
// ============================================================

export interface CheckIn {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  checkInTime: string;
  checkOutTime?: string;
  gymId: string;
  date: string;
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface RevenueData {
  month: string;
  revenue: number;
  target: number;
}

export interface AttendanceData {
  day: string;
  checkins: number;
}

export interface MembershipGrowthData {
  month: string;
  members: number;
  new: number;
  churned: number;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

// ============================================================
// GYM / BRANCH TYPES
// ============================================================

export interface Gym {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  ownerId: string;
  ownerName: string;
  totalMembers: number;
  activeMembers: number;
  monthlyRevenue: number;
  isActive: boolean;
  createdAt: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// DASHBOARD STATS TYPES
// ============================================================

export interface DashboardStats {
  monthlyRevenue: number;
  revenueGrowth: number;
  todayCheckins: number;
  activeMembers: number;
  memberGrowth: number;
  membershipRenewals: number;
  pendingPayments: number;
  classFillRate: number;
  nutritionOrders: number;
}
