// ignore_for_file: prefer_const_literals_to_create_immutables, non_constant_identifier_names, deprecated_member_use, prefer_const_constructors

import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/api_config.dart';
import '../../services/api_service.dart';

class BookAppointmentScreen extends StatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  State<BookAppointmentScreen> createState() =>
      _BookAppointmentScreenState();
}

class _BookAppointmentScreenState
    extends State<BookAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();

  // Data
  List<dynamic> _pets  = [];
  List<dynamic> _vets  = [];
  bool _loadingData    = true;
  bool _saving         = false;

  // Form values
  String? _petId;
  String? _vetId;
  String  _date        = '';
  String  _time        = '';
  String  _serviceType = 'General Checkup';
  String  _notes       = '';

  final _services = [
    'General Checkup',
    'Vaccination',
    'Surgery',
    'Dental Care',
    'Emergency',
    'Follow-up',
    'Grooming',
    'Lab Tests',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final petsRes = await ApiService.get(
        ApiConfig.pets, params: {'limit': '100'},
      );
      final vetsRes = await ApiService.get(
        '${ApiConfig.baseUrl}/auth/vets',
      );
      setState(() {
        _pets        = petsRes['data'] ?? [];
        _vets        = vetsRes['data'] ?? [];
        _loadingData = false;
      });
    } catch (_) {
      setState(() => _loadingData = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_date.isEmpty || _time.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select date and time.',
            style: TextStyle(fontFamily: 'TimesNewRoman')),
          backgroundColor: AppTheme.danger,
        ),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ApiService.post(
        ApiConfig.appointments,
        {
          'pet_id':           int.parse(_petId!),
          'vet_id':           int.parse(_vetId!),
          'appointment_date': _date,
          'appointment_time': _time,
          'service_type':     _serviceType,
          'notes':            _notes,
        },
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              '✅ Appointment booked successfully!',
              style: TextStyle(fontFamily: 'TimesNewRoman'),
            ),
            backgroundColor: AppTheme.success,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString(),
              style: const TextStyle(
                fontFamily: 'TimesNewRoman')),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    } finally {
      setState(() => _saving = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppTheme.navy700,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _date =
        '${picked.year}-${picked.month.toString().padLeft(2,'0')}-${picked.day.toString().padLeft(2,'0')}');
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 0),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppTheme.navy700,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _time =
        '${picked.hour.toString().padLeft(2,'0')}:${picked.minute.toString().padLeft(2,'0')}:00');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.gray50,
      appBar: AppBar(
        backgroundColor: AppTheme.navy800,
        title: const Text('📅  Book Appointment'),
      ),
      body: _loadingData
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  // Header Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          AppTheme.navy800,
                          AppTheme.navy700,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(children: [
                      const Text('📅',
                        style: TextStyle(fontSize: 36)),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            Text(
                              'New Appointment',
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                            Text(
                              'Book a visit for your pet',
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 12,
                                color: Colors.white60,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 24),

                  // Select Pet
                  _FormLabel('🐾  Select Pet *'),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _petId,
                    decoration: _inputDecoration(
                      'Choose a pet'),
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 14,
                      color: AppTheme.navy800,
                    ),
                    items: _pets.map((p) =>
                      DropdownMenuItem<String>(
                        value: p['pet_id'].toString(),
                        child: Text(
                          '${p['pet_name']} (${p['species']})',
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                          ),
                        ),
                      ),
                    ).toList(),
                    onChanged: (v) =>
                        setState(() => _petId = v),
                    validator: (v) => v == null
                        ? 'Please select a pet' : null,
                  ),
                  const SizedBox(height: 16),

                  // Select Vet
                  _FormLabel('🩺  Select Veterinarian *'),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _vetId,
                    decoration: _inputDecoration(
                      'Choose a vet'),
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 14,
                      color: AppTheme.navy800,
                    ),
                    items: _vets.map((v) =>
                      DropdownMenuItem<String>(
                        value: v['user_id'].toString(),
                        child: Text(
                          'Dr. ${v['full_name']}',
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                          ),
                        ),
                      ),
                    ).toList(),
                    onChanged: (v) =>
                        setState(() => _vetId = v),
                    validator: (v) => v == null
                        ? 'Please select a vet' : null,
                  ),
                  const SizedBox(height: 16),

                  // Date & Time Row
                  Row(children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          _FormLabel('📆  Date *'),
                          const SizedBox(height: 6),
                          GestureDetector(
                            onTap: _pickDate,
                            child: Container(
                              padding: const EdgeInsets
                                  .symmetric(
                                    horizontal: 14,
                                    vertical: 14,
                                  ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius:
                                    BorderRadius.circular(10),
                                border: Border.all(
                                  color: AppTheme.gray200,
                                  width: 1.5,
                                ),
                              ),
                              child: Row(children: [
                                const Icon(
                                  Icons.calendar_today,
                                  size: 16,
                                  color: AppTheme.gray400,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _date.isEmpty
                                    ? 'Select date'
                                    : _date,
                                  style: TextStyle(
                                    fontFamily: 'TimesNewRoman',
                                    fontSize: 14,
                                    color: _date.isEmpty
                                      ? AppTheme.gray400
                                      : AppTheme.navy800,
                                    fontStyle: _date.isEmpty
                                      ? FontStyle.italic
                                      : FontStyle.normal,
                                  ),
                                ),
                              ]),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          _FormLabel('🕐  Time *'),
                          const SizedBox(height: 6),
                          GestureDetector(
                            onTap: _pickTime,
                            child: Container(
                              padding: const EdgeInsets
                                  .symmetric(
                                    horizontal: 14,
                                    vertical: 14,
                                  ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius:
                                    BorderRadius.circular(10),
                                border: Border.all(
                                  color: AppTheme.gray200,
                                  width: 1.5,
                                ),
                              ),
                              child: Row(children: [
                                const Icon(
                                  Icons.access_time,
                                  size: 16,
                                  color: AppTheme.gray400,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _time.isEmpty
                                    ? 'Select time'
                                    : _time.substring(0, 5),
                                  style: TextStyle(
                                    fontFamily: 'TimesNewRoman',
                                    fontSize: 14,
                                    color: _time.isEmpty
                                      ? AppTheme.gray400
                                      : AppTheme.navy800,
                                    fontStyle: _time.isEmpty
                                      ? FontStyle.italic
                                      : FontStyle.normal,
                                  ),
                                ),
                              ]),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ]),
                  const SizedBox(height: 16),

                  // Service Type
                  _FormLabel('🏥  Service Type *'),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _serviceType,
                    decoration: _inputDecoration(
                      'Select service'),
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 14,
                      color: AppTheme.navy800,
                    ),
                    items: _services.map((s) =>
                      DropdownMenuItem<String>(
                        value: s,
                        child: Text(s,
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman')),
                      ),
                    ).toList(),
                    onChanged: (v) =>
                        setState(() => _serviceType = v!),
                  ),
                  const SizedBox(height: 16),

                  // Notes
                  _FormLabel('📝  Notes (Optional)'),
                  const SizedBox(height: 6),
                  TextFormField(
                    maxLines: 3,
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 14,
                    ),
                    decoration: _inputDecoration(
                      'Add any special instructions...'),
                    onChanged: (v) =>
                        setState(() => _notes = v),
                  ),
                  const SizedBox(height: 32),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.navy700,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(14),
                        ),
                      ),
                      child: _saving
                        ? const SizedBox(
                            width: 22, height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            '📅  Confirm Booking',
                            style: TextStyle(
                              fontFamily: 'TimesNewRoman',
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
    );
  }

  Widget _FormLabel(String text) => Text(
    text,
    style: const TextStyle(
      fontFamily: 'TimesNewRoman',
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: AppTheme.gray700,
    ),
  );

  InputDecoration _inputDecoration(String hint) =>
    InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        fontFamily: 'TimesNewRoman',
        color: AppTheme.gray400,
        fontStyle: FontStyle.italic,
      ),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: AppTheme.gray200, width: 1.5),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: AppTheme.gray200, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: AppTheme.navy500, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 14, vertical: 14),
    );
}