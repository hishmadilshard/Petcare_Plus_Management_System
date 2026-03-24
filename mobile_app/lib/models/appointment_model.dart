class AppointmentModel {
  final int    appointmentId;
  final int    petId;
  final int    vetId;
  final int    ownerId;
  final String appointmentDate;
  final String appointmentTime;
  final String serviceType;
  final String status;
  final String? notes;
  final String? petName;
  final String? ownerName;
  final String? vetName;
  final String? species;
  final int?   branchId;
  final String? branchName;

  AppointmentModel({
    required this.appointmentId,
    required this.petId,
    required this.vetId,
    required this.ownerId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.serviceType,
    required this.status,
    this.notes,
    this.petName,
    this.ownerName,
    this.vetName,
    this.species,
    this.branchId,
    this.branchName,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      appointmentId:   json['appointment_id']   ?? 0,
      petId:           json['pet_id']            ?? 0,
      vetId:           json['vet_id']            ?? 0,
      ownerId:         json['owner_id']          ?? 0,
      appointmentDate: json['appointment_date']  ?? '',
      appointmentTime: json['appointment_time']  ?? '',
      serviceType:     json['service_type']      ?? '',
      status:          json['status']            ?? 'Scheduled',
      notes:           json['notes'],
      petName:         json['pet_name'],
      ownerName:       json['owner_name'],
      vetName:         json['vet_name'],
      species:         json['species'],
      branchId:        json['branch_id'],
      branchName:      json['branch_name'],
    );
  }

  String get statusColor {
    switch (status) {
      case 'Scheduled':  return '#1D4ED8';
      case 'Completed':  return '#059669';
      case 'Cancelled':  return '#DC2626';
      case 'No Show':    return '#EA580C';
      default:           return '#64748B';
    }
  }

  String get formattedDate {
    try {
      final parts = appointmentDate.split('-');
      if (parts.length == 3) {
        return '${parts[2]}/${parts[1]}/${parts[0]}';
      }
    } catch (_) {}
    return appointmentDate;
  }

  String get formattedTime {
    try {
      return appointmentTime.substring(0, 5);
    } catch (_) {
      return appointmentTime;
    }
  }
}