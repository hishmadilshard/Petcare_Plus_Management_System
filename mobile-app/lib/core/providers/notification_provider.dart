import 'package:flutter/foundation.dart';

import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationService _service = NotificationService();

  List<dynamic> _notifications = [];
  bool _isLoading = false;
  String? _error;

  List<dynamic> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get unreadCount =>
      _notifications.where((n) => n['is_read'] == false).length;

  Future<void> loadNotifications() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _notifications = await _service.getMyNotifications();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(dynamic id) async {
    try {
      await _service.markAsRead(id);
      final index = _notifications.indexWhere((n) => n['id'] == id);
      if (index != -1) {
        _notifications[index] = {
          ..._notifications[index] as Map<String, dynamic>,
          'is_read': true,
        };
        notifyListeners();
      }
    } catch (_) {}
  }
}
