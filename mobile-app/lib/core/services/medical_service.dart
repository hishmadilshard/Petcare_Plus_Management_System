import '../constants/api_constants.dart';
import 'api_service.dart';

class MedicalService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getMedicalRecords({dynamic petId}) async {
    final path = petId != null
        ? ApiConstants.medicalRecordsByPet(petId)
        : ApiConstants.medicalRecords;
    final response = await _api.get(path);
    final data = response.data;
    if (data is List) return data;
    if (data is Map && data.containsKey('records')) {
      return data['records'] as List;
    }
    return [];
  }

  Future<Map<String, dynamic>> getMedicalRecordById(dynamic id) async {
    final response = await _api.get(ApiConstants.medicalRecordById(id));
    return response.data as Map<String, dynamic>;
  }
}
