import 'package:flutter/foundation.dart';

import '../services/appointment_service.dart';

class AppointmentProvider extends ChangeNotifier {
  final AppointmentService _service = AppointmentService();

  List<dynamic> _appointments = [];
  bool _isLoading = false;
  String? _error;

  List<dynamic> get appointments => _appointments;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<dynamic> get upcomingAppointments => _appointments.where((a) {
        final status = (a['status'] as String? ?? '').toLowerCase();
        return status == 'scheduled' || status == 'confirmed';
      }).toList();

  List<dynamic> get pastAppointments => _appointments.where((a) {
        final status = (a['status'] as String? ?? '').toLowerCase();
        return status == 'completed' ||
            status == 'cancelled' ||
            status == 'no_show';
      }).toList();

  Future<void> loadAppointments() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _appointments = await _service.getMyAppointments();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
