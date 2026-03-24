// ignore_for_file: deprecated_member_use, prefer_const_literals_to_create_immutables, prefer_const_constructors

import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/api_config.dart';
import '../../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState
    extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get(
        ApiConfig.notifications,
      );
      setState(() {
        _notifications = res['data'] ?? [];
        _loading       = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _markAllRead() async {
    try {
      await ApiService.patch(
        '${ApiConfig.notifications}/read-all', {},
      );
      _load();
    } catch (_) {}
  }

  Future<void> _markRead(int id) async {
    try {
      await ApiService.patch(
        '${ApiConfig.notifications}/$id/read', {},
      );
      setState(() {
        final idx = _notifications.indexWhere(
          (n) => n['notification_id'] == id,
        );
        if (idx != -1) {
          _notifications[idx]['is_read'] = true;
        }
      });
    } catch (_) {}
  }

  Future<void> _delete(int id) async {
    try {
      await ApiService.delete(
        '${ApiConfig.notifications}/$id',
      );
      setState(() {
        _notifications.removeWhere(
          (n) => n['notification_id'] == id,
        );
      });
    } catch (_) {}
  }

  int get _unreadCount => _notifications
      .where((n) => n['is_read'] != true)
      .length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.gray50,
      appBar: AppBar(
        backgroundColor: AppTheme.navy800,
        title: Row(
          children: [
            const Text('🔔  Notifications'),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8, vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.danger,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$_unreadCount',
                  style: const TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text(
                'Mark All Read',
                style: TextStyle(
                  fontFamily: 'TimesNewRoman',
                  color: Colors.white70,
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _notifications.isEmpty
          ? _emptyState()
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _notifications.length,
                itemBuilder: (_, i) {
                  final n = _notifications[i]
                      as Map<String, dynamic>;
                  return _NotificationCard(
                    notification: n,
                    onRead:   () => _markRead(
                        n['notification_id']),
                    onDelete: () => _delete(
                        n['notification_id']),
                  );
                },
              ),
            ),
    );
  }

  Widget _emptyState() => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('🔔',
          style: TextStyle(fontSize: 64)),
        const SizedBox(height: 16),
        const Text(
          'No notifications',
          style: TextStyle(
            fontFamily: 'TimesNewRoman',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.gray600,
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'You\'re all caught up!',
          style: TextStyle(
            fontFamily: 'TimesNewRoman',
            fontSize: 13,
            color: AppTheme.gray400,
          ),
        ),
      ],
    ),
  );
}

// ── Notification Card ─────────────────────────────────────
class _NotificationCard extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback onRead;
  final VoidCallback onDelete;

  const _NotificationCard({
    required this.notification,
    required this.onRead,
    required this.onDelete,
  });

  String _notifIcon(String? type) {
    switch (type) {
      case 'appointment_reminder': return '📅';
      case 'appointment_confirmed': return '✅';
      case 'appointment_cancelled': return '❌';
      case 'invoice_paid':          return '💰';
      case 'invoice_created':       return '🧾';
      case 'low_stock':             return '📦';
      case 'vaccination_due':       return '💉';
      default:                      return '🔔';
    }
  }

  @override
  Widget build(BuildContext context) {
    final n       = notification;
    final isRead  = n['is_read'] == true;
    final type    = n['type'] as String?;
    final title   = n['title'] as String? ?? 'Notification';
    final message = n['message'] as String? ?? '';
    final time    = n['created_at'] as String?;

    return Dismissible(
      key: Key(n['notification_id'].toString()),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: AppTheme.danger,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(
          Icons.delete_outline,
          color: Colors.white, size: 26,
        ),
      ),
      onDismissed: (_) => onDelete(),
      child: GestureDetector(
        onTap: isRead ? null : onRead,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: isRead ? Colors.white : AppTheme.navy50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isRead
                ? AppTheme.gray100
                : AppTheme.navy100,
              width: isRead ? 1 : 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.navy900.withOpacity(
                  isRead ? 0.03 : 0.07,
                ),
                blurRadius: 10,
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                // Icon
                Container(
                  width: 46, height: 46,
                  decoration: BoxDecoration(
                    color: isRead
                      ? AppTheme.gray100
                      : AppTheme.navy100,
                    borderRadius:
                        BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      _notifIcon(type),
                      style: const TextStyle(fontSize: 22),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              title,
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 14,
                                fontWeight: isRead
                                  ? FontWeight.w600
                                  : FontWeight.w700,
                                color: isRead
                                  ? AppTheme.gray700
                                  : AppTheme.navy800,
                              ),
                            ),
                          ),
                          // Unread dot
                          if (!isRead)
                            Container(
                              width: 8, height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.navy500,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        message,
                        style: TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 13,
                          color: isRead
                            ? AppTheme.gray500
                            : AppTheme.gray600,
                          fontStyle: FontStyle.italic,
                          height: 1.4,
                        ),
                      ),
                      if (time != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          _formatTime(time),
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 11,
                            color: AppTheme.gray400,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(String iso) {
    try {
      final dt  = DateTime.parse(iso).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);

      if (diff.inMinutes < 1)  return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours   < 24) return '${diff.inHours}h ago';
      if (diff.inDays    < 7)  return '${diff.inDays}d ago';

      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return iso.substring(0, 10);
    }
  }
}