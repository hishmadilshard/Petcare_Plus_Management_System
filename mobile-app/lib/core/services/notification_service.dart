import '../constants/api_constants.dart';
import 'api_service.dart';

class NotificationService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getMyNotifications() async {
    final response = await _api.get(ApiConstants.notifications);
    final data = response.data;
    if (data is List) return data;
    if (data is Map && data.containsKey('notifications')) {
      return data['notifications'] as List;
    }
    return [];
  }

  Future<void> markAsRead(dynamic id) async {
    await _api.put(ApiConstants.notificationRead(id));
  }
}
