import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/providers/pet_provider.dart';
import '../../core/services/appointment_service.dart';
import '../../shared/widgets/loading_widget.dart';

class BookAppointmentScreen extends StatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final AppointmentService _service = AppointmentService();

  final List<String> _serviceTypes = [
    'Consultation',
    'Vaccination',
    'Surgery',
    'Grooming',
    'Dental',
    'Emergency',
  ];

  Map<String, dynamic>? _selectedPet;
  String? _selectedServiceType;
  Map<String, dynamic>? _selectedVet;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  final _notesController = TextEditingController();

  bool _isLoading = false;
  bool _loadingVets = true;
  List<dynamic> _vets = [];

  @override
  void initState() {
    super.initState();
    _loadVets();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<PetProvider>().loadPets(),
    );
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadVets() async {
    try {
      final vets = await _service.getVets();
      setState(() {
        _vets = vets;
        _loadingVets = false;
      });
    } catch (_) {
      setState(() => _loadingVets = false);
    }
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) setState(() => _selectedDate = date);
  }

  Future<void> _pickTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 9, minute: 0),
    );
    if (time != null) setState(() => _selectedTime = time);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a date')),
      );
      return;
    }
    setState(() => _isLoading = true);
    try {
      final appointmentDate = _selectedDate!;
      final timeStr = _selectedTime != null
          ? '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}:00'
          : '09:00:00';

      await _service.createAppointment({
        'pet_id': _selectedPet!['id'],
        'vet_id': _selectedVet?['id'],
        'appointment_date':
            DateFormat('yyyy-MM-dd').format(appointmentDate),
        'appointment_time': timeStr,
        'service_type': _selectedServiceType,
        'notes': _notesController.text,
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(AppStrings.appointmentBooked),
          backgroundColor: AppColors.success,
        ),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pets = context.watch<PetProvider>().pets;

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.bookAppointment),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Pet dropdown
              DropdownButtonFormField<Map<String, dynamic>>(
                decoration: const InputDecoration(
                  labelText: AppStrings.selectPet,
                  prefixIcon: Icon(Icons.pets),
                ),
                value: _selectedPet,
                items: pets.map((p) {
                  final pet = p as Map<String, dynamic>;
                  return DropdownMenuItem(
                    value: pet,
                    child: Text(pet['name'] as String? ?? ''),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _selectedPet = v),
                validator: (v) => v == null ? AppStrings.fieldRequired : null,
              ),
              const SizedBox(height: 16),

              // Date picker
              InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: AppStrings.selectDate,
                    prefixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    _selectedDate != null
                        ? DateFormat('EEEE, MMM d, y').format(_selectedDate!)
                        : 'Tap to select date',
                    style: TextStyle(
                      color: _selectedDate != null
                          ? AppColors.textPrimary
                          : AppColors.textHint,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Time picker
              InkWell(
                onTap: _pickTime,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: AppStrings.selectTime,
                    prefixIcon: Icon(Icons.access_time),
                  ),
                  child: Text(
                    _selectedTime != null
                        ? _selectedTime!.format(context)
                        : 'Tap to select time',
                    style: TextStyle(
                      color: _selectedTime != null
                          ? AppColors.textPrimary
                          : AppColors.textHint,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Service type
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: AppStrings.serviceType,
                  prefixIcon: Icon(Icons.medical_services_outlined),
                ),
                value: _selectedServiceType,
                items: _serviceTypes
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) => setState(() => _selectedServiceType = v),
                validator: (v) => v == null ? AppStrings.fieldRequired : null,
              ),
              const SizedBox(height: 16),

              // Vet dropdown
              if (_loadingVets)
                const LoadingWidget()
              else
                DropdownButtonFormField<Map<String, dynamic>>(
                  decoration: const InputDecoration(
                    labelText: AppStrings.selectVet,
                    prefixIcon: Icon(Icons.person_outlined),
                  ),
                  value: _selectedVet,
                  items: _vets.map((v) {
                    final vet = v as Map<String, dynamic>;
                    return DropdownMenuItem(
                      value: vet,
                      child: Text('Dr. ${vet['name'] as String? ?? ''}'),
                    );
                  }).toList(),
                  onChanged: (v) => setState(() => _selectedVet = v),
                ),
              const SizedBox(height: 16),

              // Notes
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: AppStrings.notes,
                  prefixIcon: Icon(Icons.note_outlined),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 32),

              if (_isLoading)
                const LoadingWidget()
              else
                ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text(
                    AppStrings.submit,
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
