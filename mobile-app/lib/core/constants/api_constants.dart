import 'dart:io' show Platform;

class ApiConstants {
  ApiConstants._();

  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/profile';
  static const String refreshToken = '/auth/refresh-token';

  // Pets
  static const String pets = '/pets';
  static String petById(dynamic id) => '/pets/$id';

  // Appointments
  static const String appointments = '/appointments';
  static String appointmentById(dynamic id) => '/appointments/$id';

  // Vets
  static const String vets = '/users?role=Vet';

  // Medical Records
  static const String medicalRecords = '/medical-records';
  static String medicalRecordsByPet(dynamic petId) =>
      '/medical-records?petId=$petId';
  static String medicalRecordById(dynamic id) => '/medical-records/$id';

  // Invoices
  static const String invoices = '/invoices';
  static String invoiceById(dynamic id) => '/invoices/$id';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationRead(dynamic id) => '/notifications/$id/read';
}
