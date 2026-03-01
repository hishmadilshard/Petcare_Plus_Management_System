import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/services/invoice_service.dart';
import '../../shared/widgets/loading_widget.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final InvoiceService _service = InvoiceService();
  List<dynamic> _invoices = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      _invoices = await _service.getMyInvoices();
    } catch (e) {
      _error = e.toString();
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return AppColors.invoicePaid;
      case 'overdue':
        return AppColors.invoiceOverdue;
      default:
        return AppColors.invoicePending;
    }
  }

  String _statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return AppStrings.paid;
      case 'overdue':
        return AppStrings.overdue;
      default:
        return AppStrings.pending;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.invoices),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _isLoading
            ? const LoadingWidget()
            : _error != null
                ? Center(child: Text(_error!))
                : _invoices.isEmpty
                    ? const Center(
                        child: Text(AppStrings.noInvoices,
                            style:
                                TextStyle(color: AppColors.textSecondary)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _invoices.length,
                        itemBuilder: (context, index) {
                          final inv =
                              _invoices[index] as Map<String, dynamic>;
                          final status =
                              inv['status'] as String? ?? 'pending';
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              title: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${AppStrings.invoiceNumber}${inv['invoice_number'] ?? inv['id']}',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold),
                                  ),
                                  Chip(
                                    label: Text(
                                      _statusLabel(status),
                                      style: const TextStyle(
                                          color: Colors.white, fontSize: 11),
                                    ),
                                    backgroundColor: _statusColor(status),
                                    padding: EdgeInsets.zero,
                                    materialTapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                  ),
                                ],
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(
                                    _formatDate(
                                        inv['invoice_date'] as String?),
                                    style: const TextStyle(
                                        color: AppColors.textSecondary),
                                  ),
                                  Text(
                                    '\$${inv['total_amount'] ?? inv['amount'] ?? '0.00'}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () =>
                                  context.push('/invoices/${inv['id']}'),
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  String _formatDate(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('MMM d, y').format(DateTime.parse(raw));
    } catch (_) {
      return raw;
    }
  }
}
