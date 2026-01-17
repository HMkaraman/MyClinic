export * from './create-appointment.dto';
export * from './update-appointment.dto';
export * from './change-status.dto';
export * from './query-appointments.dto';

// Re-export additional DTOs from change-status.dto (RescheduleAppointmentDto, CancelAppointmentDto)
// These are already exported via change-status.dto since they're defined there
