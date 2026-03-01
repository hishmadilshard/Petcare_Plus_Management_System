import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/providers/pet_provider.dart';
import '../../shared/widgets/loading_widget.dart';
import '../../shared/widgets/pet_card_widget.dart';

class PetsScreen extends StatefulWidget {
  const PetsScreen({super.key});

  @override
  State<PetsScreen> createState() => _PetsScreenState();
}

class _PetsScreenState extends State<PetsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<PetProvider>().loadPets(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final petProvider = context.watch<PetProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.myPets),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<PetProvider>().loadPets(),
        child: petProvider.isLoading
            ? const LoadingWidget()
            : petProvider.pets.isEmpty
                ? const Center(
                    child: Text(
                      AppStrings.noPets,
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: petProvider.pets.length,
                    itemBuilder: (context, index) {
                      final pet =
                          petProvider.pets[index] as Map<String, dynamic>;
                      return PetCardWidget(
                        pet: pet,
                        onTap: () =>
                            context.push('/pets/${pet['id']}'),
                      );
                    },
                  ),
      ),
    );
  }
}
