import { z } from "zod";

// ─── Helpers ────────────────────────────────────────────────────────
const requiredString = (field: string) =>
  z.string().min(1, `${field} é obrigatório`);

const optionalString = z.string().optional().or(z.literal(""));

// ─── Profissional ───────────────────────────────────────────────────
export const professionalSchema = z.object({
  name: requiredString("Nome").max(100, "Nome muito longo"),
});

export type ProfessionalFormData = z.infer<typeof professionalSchema>;

// ─── Serviço ────────────────────────────────────────────────────────
export const serviceSchema = z.object({
  name: requiredString("Nome").max(100, "Nome muito longo"),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Duração inválida" })
    .int("Duração deve ser um número inteiro")
    .min(5, "Duração mínima: 5 minutos")
    .max(480, "Duração máxima: 8 horas"),
  price: z.coerce
    .number({ invalid_type_error: "Preço inválido" })
    .min(0.01, "Preço deve ser maior que zero")
    .max(99999, "Preço muito alto"),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

// ─── Cliente ────────────────────────────────────────────────────────
export const customerCreateSchema = z.object({
  name: requiredString("Nome").max(150, "Nome muito longo"),
  phone: z
    .string()
    .length(11, "Telefone deve ter 11 dígitos")
    .regex(/^\d+$/, "Apenas números"),
  cpf: z
    .string()
    .length(11, "CPF deve ter 11 dígitos")
    .regex(/^\d+$/, "Apenas números"),
  nickname: optionalString,
  birthDate: optionalString,
});

export const customerEditSchema = customerCreateSchema.omit({ cpf: true });

export type CustomerCreateFormData = z.infer<typeof customerCreateSchema>;
export type CustomerEditFormData = z.infer<typeof customerEditSchema>;

// ─── Estabelecimento (Tenant) ───────────────────────────────────────
export const tenantCreateSchema = z.object({
  name: requiredString("Nome").max(100, "Nome muito longo"),
  slug: requiredString("Slug")
    .max(60, "Slug muito longo")
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  openTime: requiredString("Horário de abertura"),
  closeTime: requiredString("Horário de fechamento"),
  taxId: optionalString,
});

export const tenantEditSchema = tenantCreateSchema.omit({ slug: true });

export type TenantCreateFormData = z.infer<typeof tenantCreateSchema>;
export type TenantEditFormData = z.infer<typeof tenantEditSchema>;

// ─── Agendamento (Booking) ──────────────────────────────────────────
export const bookingCreateSchema = z.object({
  customerId: requiredString("Cliente"),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  professionalId: requiredString("Profissional"),
  date: requiredString("Data"),
  time: requiredString("Horário"),
});

export type BookingCreateFormData = z.infer<typeof bookingCreateSchema>;

// ─── Reagendamento ──────────────────────────────────────────────────
export const rescheduleSchema = z.object({
  date: requiredString("Data"),
  time: requiredString("Horário"),
});

export type RescheduleFormData = z.infer<typeof rescheduleSchema>;

// ─── Cancelar / Rejeitar ────────────────────────────────────────────
export const reasonSchema = z.object({
  reason: optionalString,
});

export type ReasonFormData = z.infer<typeof reasonSchema>;

// ─── Associar Serviço a Profissional ────────────────────────────────
export const assignServiceSchema = z.object({
  serviceId: requiredString("Serviço"),
  customPrice: optionalString,
  customDuration: optionalString,
});

export type AssignServiceFormData = z.infer<typeof assignServiceSchema>;

// ─── Disponibilidade ────────────────────────────────────────────────
export const availabilitySchema = z.object({
  dayOfWeek: requiredString("Dia da semana"),
  startTime: requiredString("Horário de início"),
  endTime: requiredString("Horário de fim"),
});

export type AvailabilityFormData = z.infer<typeof availabilitySchema>;

// ─── Bloqueio de Agenda ─────────────────────────────────────────────
export const scheduleBlockSchema = z.object({
  startTime: requiredString("Data/hora de início"),
  endTime: requiredString("Data/hora de fim"),
  reason: optionalString,
});

export type ScheduleBlockFormData = z.infer<typeof scheduleBlockSchema>;
