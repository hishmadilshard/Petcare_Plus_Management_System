// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/api_config.dart';
import '../../models/pet_model.dart';
import '../../services/api_service.dart';
import 'pet_profile_screen.dart';

class PetsListScreen extends StatefulWidget {
  const PetsListScreen({super.key});

  @override
  State<PetsListScreen> createState() => _PetsListScreenState();
}

class _PetsListScreenState extends State<PetsListScreen> {
  List<PetModel> _pets    = [];
  bool   _loading         = true;
  String _search          = '';
  String _speciesFilter   = '';
  final _searchCtrl       = TextEditingController();

  final _species = [
    'All','Dog','Cat','Bird','Rabbit','Fish','Other',
  ];

  @override
  void initState() {
    super.initState();
    _loadPets();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadPets() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get(
        ApiConfig.pets,
        params: {
          if (_search.isNotEmpty)       'search': _search,
          if (_speciesFilter.isNotEmpty &&
              _speciesFilter != 'All')  'species': _speciesFilter,
          'limit': '100',
        },
      );
      final list = res['data'] as List<dynamic>? ?? [];
      setState(() {
        _pets   = list
            .map((e) => PetModel.fromJson(
                e as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load pets: $e',
              style: const TextStyle(
                fontFamily: 'TimesNewRoman')),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.gray50,
      appBar: AppBar(
        backgroundColor: AppTheme.navy800,
        title: const Text('🐾  My Pets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPets,
          ),
        ],
      ),
      body: Column(
        children: [

          // ── Search & Filter Bar ──────────────────
          Container(
            color: AppTheme.navy800,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              children: [
                // Search
                TextField(
                  controller: _searchCtrl,
                  style: const TextStyle(
                    fontFamily: 'TimesNewRoman',
                    color: Colors.white,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Search pets, breeds, owners...',
                    hintStyle: TextStyle(
                      fontFamily: 'TimesNewRoman',
                      color: Colors.white.withOpacity(0.45),
                      fontStyle: FontStyle.italic,
                    ),
                    prefixIcon: Icon(Icons.search,
                      color: Colors.white.withOpacity(0.6)),
                    suffixIcon: _search.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear,
                            color: Colors.white.withOpacity(0.6)),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() => _search = '');
                            _loadPets();
                          },
                        )
                      : null,
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12,
                    ),
                  ),
                  onSubmitted: (v) {
                    setState(() => _search = v);
                    _loadPets();
                  },
                ),
                const SizedBox(height: 10),

                // Species Filter
                SizedBox(
                  height: 34,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _species.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(width: 8),
                    itemBuilder: (_, i) {
                      final s       = _species[i];
                      final selected = _speciesFilter == s ||
                          (_speciesFilter.isEmpty && s == 'All');
                      return GestureDetector(
                        onTap: () {
                          setState(() =>
                            _speciesFilter = s == 'All' ? '' : s);
                          _loadPets();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: selected
                              ? Colors.white
                              : Colors.white.withOpacity(0.12),
                            borderRadius:
                                BorderRadius.circular(20),
                          ),
                          child: Text(
                            s,
                            style: TextStyle(
                              fontFamily: 'TimesNewRoman',
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: selected
                                ? AppTheme.navy800
                                : Colors.white,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // ── Pets List ────────────────────────────
          Expanded(
            child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _pets.isEmpty
                ? _emptyState()
                : RefreshIndicator(
                    onRefresh: _loadPets,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _pets.length,
                      itemBuilder: (_, i) =>
                          _PetCard(pet: _pets[i]),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _emptyState() => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text('🐾',
          style: TextStyle(fontSize: 64)),
        const SizedBox(height: 16),
        const Text('No pets found',
          style: TextStyle(
            fontFamily: 'TimesNewRoman',
            fontSize: 18, fontWeight: FontWeight.w700,
            color: AppTheme.gray600,
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          _search.isNotEmpty
            ? 'Try a different search term'
            : 'No pets registered yet',
          style: const TextStyle(
            fontFamily: 'TimesNewRoman',
            fontSize: 13, color: AppTheme.gray400,
          ),
        ),
      ],
    ),
  );
}

// ── Pet Card ──────────────────────────────────────────────
class _PetCard extends StatelessWidget {
  final PetModel pet;
  const _PetCard({required this.pet});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PetProfileScreen(pet: pet),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.gray100),
          boxShadow: [
            BoxShadow(
              color: AppTheme.navy900.withOpacity(0.05),
              blurRadius: 10, offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Species Icon
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  color: AppTheme.navy50,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.navy100),
                ),
                child: Center(
                  child: Text(pet.speciesIcon,
                    style: const TextStyle(fontSize: 28)),
                ),
              ),
              const SizedBox(width: 14),

              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          pet.petName,
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.navy800,
                          ),
                        ),
                        const SizedBox(width: 8),
                        _GenderBadge(gender: pet.gender),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${pet.species}${pet.breed != null ? " · ${pet.breed}" : ""}',
                      style: const TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 13,
                        color: AppTheme.gray500,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    if (pet.ownerName != null) ...[
                      const SizedBox(height: 4),
                      Row(children: [
                        const Icon(Icons.person_outline,
                          size: 13, color: AppTheme.gray400),
                        const SizedBox(width: 4),
                        Text(
                          pet.ownerName!,
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 12,
                            color: AppTheme.gray400,
                          ),
                        ),
                      ]),
                    ],
                    if (pet.branchName != null) ...[
                      const SizedBox(height: 4),
                      Row(children: [
                        const Icon(Icons.local_hospital_outlined,
                          size: 13, color: AppTheme.navy400),
                        const SizedBox(width: 4),
                        Text(
                          pet.branchName!,
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 12,
                            color: AppTheme.navy500,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ]),
                    ],
                  ],
                ),
              ),

              // Status + Arrow
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _StatusBadge(status: pet.status),
                  const SizedBox(height: 8),
                  const Icon(Icons.chevron_right,
                    color: AppTheme.gray300),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GenderBadge extends StatelessWidget {
  final String gender;
  const _GenderBadge({required this.gender});

  @override
  Widget build(BuildContext context) {
    final isMale = gender == 'Male';
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8, vertical: 2,
      ),
      decoration: BoxDecoration(
        color: isMale
          ? const Color(0xFFDBEAFE)
          : const Color(0xFFFCE7F3),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        gender,
        style: TextStyle(
          fontFamily: 'TimesNewRoman',
          fontSize: 10, fontWeight: FontWeight.w700,
          color: isMale
            ? const Color(0xFF1D4ED8)
            : const Color(0xFFBE185D),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final isActive = status == 'Active';
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 10, vertical: 4,
      ),
      decoration: BoxDecoration(
        color: isActive
          ? const Color(0xFFECFDF5)
          : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isActive
            ? const Color(0xFFA7F3D0)
            : AppTheme.gray200,
        ),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontFamily: 'TimesNewRoman',
          fontSize: 11, fontWeight: FontWeight.w700,
          color: isActive
            ? const Color(0xFF059669)
            : AppTheme.gray500,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }
}