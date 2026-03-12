// API Types for MAVI Services

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  taxId?: string;
  openTime: string;
  closeTime: string;
  timezone?: string;
  active: boolean;
}

export interface CreateTenantRequest {
  slug: string;
  name: string;
  taxId?: string;
  openTime: string;
  closeTime: string;
  timezone?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  taxId?: string;
  openTime?: string;
  closeTime?: string;
  timezone?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  cpf: string;
  phone: string;
  name: string;
  email?: string;
  nickname?: string;
  birthDate?: string;
  createdAt: string;
  active: boolean;
}

export interface CreateCustomerRequest {
  cpf: string;
  phone: string;
  name: string;
  nickname?: string;
  birthDate?: string;
}

export interface UpdateCustomerRequest {
  phone?: string;
  name?: string;
  nickname?: string;
  birthDate?: string;
}

export interface UpsertCustomerRequest {
  name: string;
  phone: string;
  email?: string;
}

export interface Professional {
  id: string;
  name: string;
  active: boolean;
  tenantId: string;
}

export interface CreateProfessionalRequest {
  name: string;
}

export interface UpdateProfessionalRequest {
  name?: string;
  active?: boolean;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  tenantId: string;
  professionalsCount?: number;
}

export interface CreateServiceRequest {
  name: string;
  durationMinutes: number;
  price: number;
}

export interface UpdateServiceRequest {
  name?: string;
  durationMinutes?: number;
  price?: number;
  active?: boolean;
}

export interface ProfessionalService {
  id: string;
  serviceId: string;
  serviceName: string;
  baseDurationMinutes: number;
  basePrice: number;
  effectiveDurationMinutes: number;
  effectivePrice: number;
  hasCustomPrice: boolean;
  hasCustomDuration: boolean;
  active: boolean;
}

export interface AssignServiceRequest {
  serviceId: string;
  customPrice?: number;
  customDurationMinutes?: number;
}

export interface Availability {
  id: string;
  professionalId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface CreateAvailabilityRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface ScheduleBlock {
  id: string;
  professionalId: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface CreateScheduleBlockRequest {
  startTime: string;
  endTime: string;
  reason?: string;
}

export type BookingStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface BookingServiceInfo {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  displayOrder: number;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  professionalId: string;
  professionalName: string;
  services: BookingServiceInfo[];
  tenantId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  price?: number;
  totalDurationMinutes?: number;
  createdAt: string;
  cancellationReason?: string;
}

export interface CreateBookingRequest {
  customerId: string;
  serviceIds: string[];
  professionalId: string;
  startTime: string;
  serviceDescription?: string;
}

export interface RescheduleBookingRequest {
  newStartTime: string;
}

export interface CancelBookingRequest {
  reason?: string;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type SlotMode = 'FIXED' | 'INTERVAL' | 'SERVICE_DURATION';

export interface SlotRule {
  id: string;
  mode: SlotMode;
  intervalMinutes?: number;
  bufferBetweenServicesMinutes?: number;
  fixedTimes?: string[];
  active: boolean;
}

export interface CreateSlotRuleRequest {
  mode: SlotMode;
  intervalMinutes?: number;
  bufferBetweenServicesMinutes?: number;
  fixedTimes?: string[];
}

export interface UpdateProfessionalServiceRequest {
  customPrice?: number;
  customDurationMinutes?: number;
}

export interface ServiceProfessional {
  professionalId: string;
  professionalName: string;
  effectivePrice: number;
  effectiveDurationMinutes: number;
  hasCustomPrice: boolean;
  hasCustomDuration: boolean;
  active: boolean;
}

// Formato retornado pela API /api/v1/schedule/availability
export interface AvailabilitySlot {
  startTime: string; // ISO 8601: "2026-01-25T09:00:00"
  endTime: string;   // ISO 8601: "2026-01-25T09:30:00"
  available: boolean;
}

// Formato processado para uso no frontend
export interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
}

export interface GetAvailabilitySlotsParams {
  professionalId: string;
  date: string; // YYYY-MM-DD
  serviceIds?: string[];
}

// Pagination
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Auth types
export type UserRole = 'ADMIN' | 'OWNER' | 'EMPLOYEE' | 'CLIENT';

export interface AuthUserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantIds: string[];
  professionalId: string | null;
  customerId: string | null;
  mustChangePassword: boolean;
}

export interface AuthLoginRequest {
  login: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
  user: AuthUserInfo;
}

// User management types
export interface AppUserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}
