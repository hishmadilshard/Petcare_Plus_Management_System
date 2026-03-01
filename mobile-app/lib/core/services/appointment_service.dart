import '../constants/api_constants.dart';
import 'api_service.dart';

class AppointmentService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getMyAppointments() async {
    final response = await _api.get(ApiConstants.appointments);
    final data = response.data;
    if (data is List) return data;
    if (data is Map && data.containsKey('appointments')) {
      return data['appointments'] as List;
    }
    return [];
  }

  Future<Map<String, dynamic>> createAppointment(
    Map<String, dynamic> data,
  ) async {
    final response = await _api.post(ApiConstants.appointments, data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getAppointmentById(dynamic id) async {
    final response = await _api.get(ApiConstants.appointmentById(id));
    return response.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getVets() async {
    final response = await _api.get(ApiConstants.vets);
    final data = response.data;
    if (data is List) return data;
    if (data is Map && data.containsKey('users')) return data['users'] as List;
    return [];
  }
}
