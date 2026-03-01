import '../constants/api_constants.dart';
import 'api_service.dart';

class PetService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getMyPets() async {
    final response = await _api.get(ApiConstants.pets);
    final data = response.data;
    if (data is List) return data;
    if (data is Map && data.containsKey('pets')) return data['pets'] as List;
    return [];
  }

  Future<Map<String, dynamic>> getPetById(dynamic id) async {
    final response = await _api.get(ApiConstants.petById(id));
    return response.data as Map<String, dynamic>;
  }
}
