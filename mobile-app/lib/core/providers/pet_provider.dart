import 'package:flutter/foundation.dart';

import '../services/pet_service.dart';

class PetProvider extends ChangeNotifier {
  final PetService _petService = PetService();

  List<dynamic> _pets = [];
  Map<String, dynamic>? _selectedPet;
  bool _isLoading = false;
  String? _error;

  List<dynamic> get pets => _pets;
  Map<String, dynamic>? get selectedPet => _selectedPet;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadPets() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _pets = await _petService.getMyPets();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectPet(Map<String, dynamic> pet) {
    _selectedPet = pet;
    notifyListeners();
  }
}
