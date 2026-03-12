// API Client for MAVI Services
import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  UpsertCustomerRequest,
  Professional,
  CreateProfessionalRequest,
  UpdateProfessionalRequest,
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  Booking,
  CreateBookingRequest,
  Availability,
  CreateAvailabilityRequest,
  ScheduleBlock,
  CreateScheduleBlockRequest,
  ProfessionalService,
  AssignServiceRequest,
  UpdateProfessionalServiceRequest,
  ServiceProfessional,
  SlotRule,
  CreateSlotRuleRequest,
  AvailabilitySlot,
  GetAvailabilitySlotsParams,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthUserInfo,
  AppUserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''; // Vazio = usa caminho relativo (proxy do Vite em dev, Nginx em prod)
const API_KEY = import.meta.env.VITE_API_KEY as string;
const TOKEN_KEY = 'mavi_token';

class ApiClient {
  private tenantId: string | null = null;
  onUnauthorized: (() => void) | null = null;

  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  getTenantId() {
    return this.tenantId;
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...(this.tenantId && { 'X-Tenant-Id': this.tenantId }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.onUnauthorized?.();
      throw new Error('Não autorizado');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  async login(data: AuthLoginRequest): Promise<AuthLoginResponse> {
    return this.request<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async me(): Promise<AuthUserInfo> {
    return this.request<AuthUserInfo>('/auth/me');
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    return this.request<Tenant[]>('/api/v1/tenants');
  }

  async getTenant(id: string): Promise<Tenant> {
    return this.request<Tenant>(`/api/v1/tenants/${id}`);
  }

  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    return this.request<Tenant>('/api/v1/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenant(id: string, data: UpdateTenantRequest): Promise<Tenant> {
    return this.request<Tenant>(`/api/v1/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Slot Rules
  async getSlotRule(tenantId: string): Promise<SlotRule | null> {
    try {
      return await this.request<SlotRule>(`/api/v1/tenants/${tenantId}/slot-rules/active`);
    } catch {
      return null;
    }
  }

  async createSlotRule(tenantId: string, data: CreateSlotRuleRequest): Promise<SlotRule> {
    return this.request<SlotRule>(`/api/v1/tenants/${tenantId}/slot-rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSlotRule(tenantId: string, ruleId: string, data: CreateSlotRuleRequest): Promise<SlotRule> {
    return this.request<SlotRule>(`/api/v1/tenants/${tenantId}/slot-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/api/v1/customers');
  }

  async upsertCustomer(data: UpsertCustomerRequest): Promise<Customer> {
    return this.request<Customer>('/api/v1/customers/upsert', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/api/v1/customers/${id}`);
  }

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    return this.request<Customer>('/api/v1/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    return this.request<Customer>(`/api/v1/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/api/v1/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Professionals
  async getProfessionals(): Promise<Professional[]> {
    return this.request<Professional[]>('/api/v1/professionals');
  }

  async getActiveProfessionals(): Promise<Professional[]> {
    return this.request<Professional[]>('/api/v1/professionals/active');
  }

  async getProfessional(id: string): Promise<Professional> {
    return this.request<Professional>(`/api/v1/professionals/${id}`);
  }

  async createProfessional(data: CreateProfessionalRequest): Promise<Professional> {
    return this.request<Professional>('/api/v1/professionals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfessional(id: string, data: UpdateProfessionalRequest): Promise<Professional> {
    return this.request<Professional>(`/api/v1/professionals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProfessional(id: string): Promise<void> {
    return this.request<void>(`/api/v1/professionals/${id}`, {
      method: 'DELETE',
    });
  }

  // Professional Services
  async getProfessionalServices(professionalId: string): Promise<ProfessionalService[]> {
    return this.request<ProfessionalService[]>(`/api/v1/professionals/${professionalId}/services`);
  }

  async assignService(professionalId: string, data: AssignServiceRequest): Promise<ProfessionalService> {
    return this.request<ProfessionalService>(`/api/v1/professionals/${professionalId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateServiceAssignment(
    professionalId: string,
    serviceId: string,
    data: UpdateProfessionalServiceRequest
  ): Promise<ProfessionalService> {
    return this.request<ProfessionalService>(
      `/api/v1/professionals/${professionalId}/services/${serviceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async unassignService(professionalId: string, serviceId: string): Promise<void> {
    return this.request<void>(`/api/v1/professionals/${professionalId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // Professional Availability
  async getAvailabilities(professionalId: string): Promise<Availability[]> {
    return this.request<Availability[]>(`/api/v1/professionals/${professionalId}/availabilities`);
  }

  async createAvailability(professionalId: string, data: CreateAvailabilityRequest): Promise<Availability> {
    return this.request<Availability>(`/api/v1/professionals/${professionalId}/availabilities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAvailability(professionalId: string, availabilityId: string): Promise<void> {
    return this.request<void>(`/api/v1/professionals/${professionalId}/availabilities/${availabilityId}`, {
      method: 'DELETE',
    });
  }

  // Schedule Blocks
  async getScheduleBlocks(professionalId: string): Promise<ScheduleBlock[]> {
    return this.request<ScheduleBlock[]>(`/api/v1/professionals/${professionalId}/schedule-blocks`);
  }

  async createScheduleBlock(professionalId: string, data: CreateScheduleBlockRequest): Promise<ScheduleBlock> {
    return this.request<ScheduleBlock>(`/api/v1/professionals/${professionalId}/schedule-blocks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteScheduleBlock(blockId: string): Promise<void> {
    return this.request<void>(`/api/v1/professionals/schedule-blocks/${blockId}`, {
      method: 'DELETE',
    });
  }

  // Services
  async getServices(): Promise<Service[]> {
    return this.request<Service[]>('/api/v1/services');
  }

  async getActiveServices(): Promise<Service[]> {
    return this.request<Service[]>('/api/v1/services/active');
  }

  async getService(id: string): Promise<Service> {
    return this.request<Service>(`/api/v1/services/${id}`);
  }

  async createService(data: CreateServiceRequest): Promise<Service> {
    return this.request<Service>('/api/v1/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: UpdateServiceRequest): Promise<Service> {
    return this.request<Service>(`/api/v1/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string): Promise<void> {
    return this.request<void>(`/api/v1/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Service Professionals
  async getServiceProfessionals(serviceId: string): Promise<ServiceProfessional[]> {
    return this.request<ServiceProfessional[]>(`/api/v1/services/${serviceId}/professionals`);
  }

  // Bookings
  async getBookings(params?: {
    customerId?: string;
    date?: string;
  }): Promise<Booking[]> {
    const searchParams = new URLSearchParams();
    if (params?.customerId) searchParams.set('customerId', params.customerId);
    if (params?.date) searchParams.set('date', params.date);
    
    const query = searchParams.toString();
    return this.request<Booking[]>(`/api/v1/bookings${query ? `?${query}` : ''}`);
  }

  async getBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/api/v1/bookings/${id}`);
  }

  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    return this.request<Booking>('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/api/v1/bookings/${id}/confirm`, {
      method: 'PATCH',
    });
  }

  async startBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/api/v1/bookings/${id}/start`, {
      method: 'PATCH',
    });
  }

  async completeBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/api/v1/bookings/${id}/complete`, {
      method: 'PATCH',
    });
  }

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    return this.request<Booking>(`/api/v1/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async rejectBooking(id: string, reason?: string): Promise<Booking> {
    return this.request<Booking>(`/api/v1/bookings/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async noShowBooking(id: string): Promise<Booking> {
    return this.request<Booking>(`/api/v1/bookings/${id}/no-show`, {
      method: 'PATCH',
    });
  }

  async rescheduleBooking(id: string, newStartTime: string): Promise<Booking> {
    return this.request<Booking>(`/api/v1/bookings/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ newStartTime }),
    });
  }

  // Schedule Availability
  async getAvailableSlots(params: GetAvailabilitySlotsParams): Promise<AvailabilitySlot[]> {
    const searchParams = new URLSearchParams({
      professionalId: params.professionalId,
      date: params.date,
    });
    if (params.serviceIds && params.serviceIds.length > 0) {
      for (const id of params.serviceIds) {
        searchParams.append('serviceIds', id);
      }
    }
    return this.request<AvailabilitySlot[]>(`/api/v1/schedule/availability?${searchParams}`);
  }

  // Users
  async getUsers(): Promise<AppUserResponse[]> {
    return this.request<AppUserResponse[]>('/api/v1/users');
  }

  async getUser(id: string): Promise<AppUserResponse> {
    return this.request<AppUserResponse>(`/api/v1/users/${id}`);
  }

  async createUser(data: CreateUserRequest): Promise<AppUserResponse> {
    return this.request<AppUserResponse>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<AppUserResponse> {
    return this.request<AppUserResponse>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return this.request<void>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
