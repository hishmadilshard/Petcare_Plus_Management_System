import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/providers/notification_provider.dart';
import '../../shared/widgets/loading_widget.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<NotificationProvider>().loadNotifications(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.notifications),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<NotificationProvider>().loadNotifications(),
        child: provider.isLoading
            ? const LoadingWidget()
            : provider.notifications.isEmpty
                ? const Center(
                    child: Text(
                      AppStrings.noNotifications,
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: provider.notifications.length,
                    itemBuilder: (context, index) {
                      final n = provider.notifications[index]
                          as Map<String, dynamic>;
                      final isRead = n['is_read'] == true;
                      return Card(
                        margin: const EdgeInsets.symmetric(
                            vertical: 4, horizontal: 8),
                        color: isRead ? Colors.white : AppColors.primary.withOpacity(0.05),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                              color: isRead
                                  ? Colors.transparent
                                  : AppColors.primary.withOpacity(0.3),
                            )),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          leading: CircleAvatar(
                            backgroundColor: isRead
                                ? AppColors.grey200
                                : AppColors.primary.withOpacity(0.15),
                            child: Icon(
                              isRead
                                  ? Icons.notifications_none
                                  : Icons.notifications_active,
                              color: isRead
                                  ? AppColors.grey400
                                  : AppColors.primary,
                              size: 20,
                            ),
                          ),
                          title: Text(
                            n['title'] as String? ?? '',
                            style: TextStyle(
                              fontWeight: isRead
                                  ? FontWeight.normal
                                  : FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          subtitle: Text(
                            n['message'] as String? ?? '',
                            style: const TextStyle(
                                color: AppColors.textSecondary),
                          ),
                          trailing: !isRead
                              ? Container(
                                  width: 10,
                                  height: 10,
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                )
                              : null,
                          onTap: () {
                            if (!isRead) {
                              context
                                  .read<NotificationProvider>()
                                  .markRead(n['id']);
                            }
                          },
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
