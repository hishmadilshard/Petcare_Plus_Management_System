import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/services/invoice_service.dart';
import '../../shared/widgets/loading_widget.dart';

class InvoiceDetailScreen extends StatefulWidget {
  final String invoiceId;
  const InvoiceDetailScreen({super.key, required this.invoiceId});

  @override
  State<InvoiceDetailScreen> createState() => _InvoiceDetailScreenState();
}

class _InvoiceDetailScreenState extends State<InvoiceDetailScreen> {
  final InvoiceService _service = InvoiceService();
  Map<String, dynamic>? _invoice;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _service.getInvoiceById(widget.invoiceId);
      setState(() {
        _invoice = data['invoice'] as Map<String, dynamic>? ?? data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: LoadingWidget());
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text(AppStrings.invoiceDetails)),
        body: Center(child: Text(_error!)),
      );
    }

    final inv = _invoice!;
    final status = inv['status'] as String? ?? 'pending';
    final items = inv['items'] as List<dynamic>? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.invoiceDetails),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${AppStrings.invoiceNumber}${inv['invoice_number'] ?? inv['id']}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                        Chip(
                          label: Text(
                            status.toUpperCase(),
                            style: const TextStyle(
                                color: Colors.white, fontSize: 12),
                          ),
                          backgroundColor: _statusColor(status),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _Row(AppStrings.date,
                        _formatDate(inv['invoice_date'] as String?)),
                    if (inv['due_date'] != null)
                      _Row(AppStrings.dueDate,
                          _formatDate(inv['due_date'] as String?)),
                    const SizedBox(height: 16),
                    if (items.isNotEmpty) ...[
                      const Text(
                        'Items',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...items.map((item) {
                        final i = item as Map<String, dynamic>;
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(i['description'] as String? ?? ''),
                              Text(
                                  '\$${i['amount'] ?? '0.00'}',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600)),
                            ],
                          ),
                        );
                      }),
                      const Divider(height: 24),
                    ],
                    if (inv['subtotal'] != null)
                      _Row(AppStrings.subtotal, '\$${inv['subtotal']}'),
                    if (inv['tax'] != null)
                      _Row(AppStrings.tax, '\$${inv['tax']}'),
                    _Row(
                      AppStrings.total,
                      '\$${inv['total_amount'] ?? inv['amount'] ?? '0.00'}',
                      bold: true,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('MMMM d, y').format(DateTime.parse(raw));
    } catch (_) {
      return raw;
    }
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;
  const _Row(this.label, this.value, {this.bold = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontWeight:
                    bold ? FontWeight.bold : FontWeight.normal,
              )),
          Text(value,
              style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight:
                    bold ? FontWeight.bold : FontWeight.w600,
                fontSize: bold ? 16 : 14,
              )),
        ],
      ),
    );
  }
}
