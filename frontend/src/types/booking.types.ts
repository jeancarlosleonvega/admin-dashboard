export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentMethod = 'MERCADOPAGO' | 'TRANSFER' | 'CASH';
export type PaymentStatus = 'PENDING_PROOF' | 'PENDING_VALIDATION' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'PENDING_CASH';

export interface SlotInfo {
  id: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  venue?: {
    id: string;
    name: string;
    sportType: { id: string; name: string };
  };
}

export interface BookingService {
  id: string;
  serviceId: string;
  price: number;
  service: { id: string; name: string; price: number };
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transferProofUrl?: string | null;
  expiresAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

export interface Booking {
  id: string;
  userId: string;
  slotId: string;
  status: BookingStatus;
  price: number;
  isMemberPrice: boolean;
  qrCode?: string | null;
  qrValidatedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  slot: SlotInfo;
  payment?: Payment | null;
  bookingServices: BookingService[];
  user?: { id: string; firstName: string; lastName: string; email: string };
}

export interface CreateBookingInput {
  slotId: string;
  serviceIds?: string[];
  paymentMethod: PaymentMethod;
  notes?: string;
}
