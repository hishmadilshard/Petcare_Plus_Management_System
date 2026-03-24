import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';
import '../screens/notifications/notifications_screen.dart';

class NotificationBadge extends StatefulWidget {
  const NotificationBadge({super.key});

  @override
  State<NotificationBadge> createState() =>
      _NotificationBadgeState();
}

class _NotificationBadgeState
    extends State<NotificationBadge> {
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    _loadUnreadCount();
  }

  Future<void> _loadUnreadCount() async {
    try {
      final res = await ApiService.get(
        ApiConfig.notifications,
      );
      final list = res['data'] as List<dynamic>? ?? [];
      final count = list
          .where((n) => n['is_read'] != true)
          .length;
      if (mounted) setState(() => _unread = count);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        IconButton(
          icon: const Icon(
            Icons.notifications_outlined,
            color: Colors.white,
          ),
          onPressed: () async {
            await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) =>
                    const NotificationsScreen(),
              ),
            );
            _loadUnreadCount();
          },
        ),
        if (_unread > 0)
          Positioned(
            top: 6, right: 6,
            child: Container(
              width: 18, height: 18,
              decoration: const BoxDecoration(
                color: AppTheme.danger,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  _unread > 9 ? '9+' : '$_unread',
                  style: const TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}