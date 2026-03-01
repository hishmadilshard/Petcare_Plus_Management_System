import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/providers/appointment_provider.dart';
import '../../shared/widgets/appointment_card_widget.dart';
import '../../shared/widgets/loading_widget.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<AppointmentProvider>().loadAppointments(),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppointmentProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.appointments),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: AppStrings.upcoming),
            Tab(text: AppStrings.past),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/appointments/book'),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(AppStrings.bookNew,
            style: TextStyle(color: Colors.white)),
      ),
      body: provider.isLoading
          ? const LoadingWidget()
          : RefreshIndicator(
              onRefresh: () => context.read<AppointmentProvider>().loadAppointments(),
              child: TabBarView(
                controller: _tabController,
                children: [
                  _AppointmentList(appointments: provider.upcomingAppointments),
                  _AppointmentList(appointments: provider.pastAppointments),
                ],
              ),
            ),
    );
  }
}

class _AppointmentList extends StatelessWidget {
  final List<dynamic> appointments;
  const _AppointmentList({required this.appointments});

  @override
  Widget build(BuildContext context) {
    if (appointments.isEmpty) {
      return const Center(
        child: Text(
          AppStrings.noAppointments,
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: appointments.length,
      itemBuilder: (context, index) {
        final appt = appointments[index] as Map<String, dynamic>;
        return AppointmentCardWidget(
          appointment: appt,
          onTap: () => context.push('/appointments/${appt['id']}'),
        );
      },
    );
  }
}
