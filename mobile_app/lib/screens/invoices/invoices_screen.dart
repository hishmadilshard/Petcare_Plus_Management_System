// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/api_config.dart';
import '../../models/invoice_model.dart';
import '../../services/api_service.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  List<InvoiceModel> _invoices = [];
  bool   _loading     = true;
  String _statusFilter = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get(
        ApiConfig.invoices,
        params: {
          'limit': '100',
          if (_statusFilter.isNotEmpty)
            'status': _statusFilter,
        },
      );
      final list = res['data'] as List<dynamic>? ?? [];
      setState(() {
        _invoices = list
            .map((e) => InvoiceModel.fromJson(
                e as Map<String, dynamic>))
            .toList();
        _loading  = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalRevenue = _invoices
        .where((i) => i.isPaid)
        .fold(0.0, (sum, i) => sum + i.totalAmount);
    final pendingCount = _invoices
        .where((i) => i.isPending).length;

    return Scaffold(
      backgroundColor: AppTheme.gray50,
      appBar: AppBar(
        backgroundColor: AppTheme.navy800,
        title: const Text('🧾  Invoices'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      body: Column(
        children: [

          // Summary Header
          Container(
            color: AppTheme.navy800,
            padding: const EdgeInsets.fromLTRB(
              16, 0, 16, 20),
            child: Row(children: [
              Expanded(
                child: _SummaryTile(
                  icon: '💰',
                  label: 'Revenue',
                  value: 'LKR ${totalRevenue.toStringAsFixed(0)}',
                  color: const Color(0xFF4ADE80),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SummaryTile(
                  icon: '⏳',
                  label: 'Pending',
                  value: '$pendingCount invoices',
                  color: const Color(0xFFFBBF24),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SummaryTile(
                  icon: '📋',
                  label: 'Total',
                  value: '${_invoices.length}',
                  color: const Color(0xFF93C5FD),
                ),
              ),
            ]),
          ),

          // Filter Tabs
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(
              horizontal: 16, vertical: 10,
            ),
            child: Row(
              children: [
                _FilterTab(
                  label: 'All',
                  selected: _statusFilter.isEmpty,
                  onTap: () {
                    setState(() => _statusFilter = '');
                    _load();
                  },
                ),
                const SizedBox(width: 8),
                _FilterTab(
                  label: 'Paid',
                  selected: _statusFilter == 'Paid',
                  onTap: () {
                    setState(() => _statusFilter = 'Paid');
                    _load();
                  },
                ),
                const SizedBox(width: 8),
                _FilterTab(
                  label: 'Pending',
                  selected: _statusFilter == 'Pending',
                  onTap: () {
                    setState(() => _statusFilter = 'Pending');
                    _load();
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.gray100),

          // Invoice List
          Expanded(
            child: _loading
              ? const Center(
                  child: CircularProgressIndicator())
              : _invoices.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('🧾',
                          style: TextStyle(fontSize: 56)),
                        SizedBox(height: 14),
                        Text('No invoices found',
                          style: TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 16,
                            color: AppTheme.gray500,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _invoices.length,
                      itemBuilder: (_, i) =>
                          _InvoiceCard(
                            invoice: _invoices[i],
                            onTap: () =>
                              _showInvoiceDetail(
                                context, _invoices[i]),
                          ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  void _showInvoiceDetail(
    BuildContext context, InvoiceModel inv,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _InvoiceDetailSheet(invoice: inv),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  final String icon;
  final String label;
  final String value;
  final Color  color;

  const _SummaryTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12, vertical: 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon,
            style: const TextStyle(fontSize: 20)),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'TimesNewRoman',
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'TimesNewRoman',
              fontSize: 11,
              color: Colors.white.withOpacity(0.55),
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterTab extends StatelessWidget {
  final String label;
  final bool   selected;
  final VoidCallback onTap;

  const _FilterTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: 18, vertical: 7,
        ),
        decoration: BoxDecoration(
          color: selected ? AppTheme.navy700 : AppTheme.gray100,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'TimesNewRoman',
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: selected ? Colors.white : AppTheme.gray600,
          ),
        ),
      ),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  final InvoiceModel invoice;
  final VoidCallback onTap;
  const _InvoiceCard({
    required this.invoice, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final inv = invoice;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.gray100),
          boxShadow: [
            BoxShadow(
              color: AppTheme.navy900.withOpacity(0.05),
              blurRadius: 10,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 46, height: 46,
                    decoration: BoxDecoration(
                      color: inv.isPaid
                        ? const Color(0xFFECFDF5)
                        : const Color(0xFFFFFBEB),
                      borderRadius:
                          BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        inv.isPaid ? '✅' : '⏳',
                        style: const TextStyle(fontSize: 22),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [
                        Text(
                          inv.invoiceNumber,
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.navy700,
                          ),
                        ),
                        Text(
                          inv.ownerName ?? '—',
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 13,
                            color: AppTheme.gray600,
                          ),
                        ),
                        Text(
                          inv.invoiceDate.substring(0, 10),
                          style: const TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 12,
                            color: AppTheme.gray400,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.end,
                    children: [
                      Text(
                        'LKR ${inv.totalAmount.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.navy800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: inv.isPaid
                            ? const Color(0xFFECFDF5)
                            : const Color(0xFFFFFBEB),
                          borderRadius:
                              BorderRadius.circular(20),
                          border: Border.all(
                            color: inv.isPaid
                              ? const Color(0xFFA7F3D0)
                              : const Color(0xFFFDE68A),
                          ),
                        ),
                        child: Text(
                          inv.paymentStatus,
                          style: TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: inv.isPaid
                              ? const Color(0xFF059669)
                              : const Color(0xFFD97706),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              // Branch
              if (inv.branchName != null) ...[
                const SizedBox(height: 10),
                const Divider(
                  height: 1, color: AppTheme.gray100),
                const SizedBox(height: 10),
                Row(children: [
                  const Icon(
                    Icons.local_hospital_outlined,
                    size: 13, color: AppTheme.navy400,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    inv.branchName!,
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 12,
                      color: AppTheme.navy500,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    inv.paymentMethod,
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 12,
                      color: AppTheme.gray400,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ]),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ── Invoice Detail Bottom Sheet ───────────────────────────
class _InvoiceDetailSheet extends StatelessWidget {
  final InvoiceModel invoice;
  const _InvoiceDetailSheet({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final inv = invoice;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: AppTheme.gray200,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(height: 20),

          // Invoice Number
          Text(
            inv.invoiceNumber,
            style: const TextStyle(
              fontFamily: 'TimesNewRoman',
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppTheme.navy800,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            inv.invoiceDate.substring(0, 10),
            style: const TextStyle(
              fontFamily: 'TimesNewRoman',
              fontSize: 13,
              color: AppTheme.gray500,
            ),
          ),
          const SizedBox(height: 20),
          const Divider(color: AppTheme.gray100),

          // Items
          if (inv.items.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...inv.items.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                Expanded(
                  child: Text(
                    item.description,
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 13,
                      color: AppTheme.gray700,
                    ),
                  ),
                ),
                Text(
                  'x${item.quantity.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 12,
                    color: AppTheme.gray400,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'LKR ${item.totalPrice.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.navy700,
                  ),
                ),
              ]),
            )),
            const Divider(color: AppTheme.gray100),
          ],

          // Totals
          const SizedBox(height: 8),
          _TotalRow('Subtotal',
            'LKR ${inv.subtotal.toStringAsFixed(0)}'),
          if (inv.taxAmount > 0)
            _TotalRow('Tax (${inv.taxRate.toStringAsFixed(0)}%)',
              'LKR ${inv.taxAmount.toStringAsFixed(0)}'),
          if (inv.discount > 0)
            _TotalRow('Discount',
              '- LKR ${inv.discount.toStringAsFixed(0)}',
              color: AppTheme.success),
          const Divider(color: AppTheme.gray100),
          _TotalRow(
            'Total',
            'LKR ${inv.totalAmount.toStringAsFixed(0)}',
            bold: true,
          ),
          const SizedBox(height: 16),

          // Status
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(
              vertical: 12),
            decoration: BoxDecoration(
              color: inv.isPaid
                ? const Color(0xFFECFDF5)
                : const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: inv.isPaid
                  ? const Color(0xFFA7F3D0)
                  : const Color(0xFFFDE68A),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  inv.isPaid ? '✅' : '⏳',
                  style: const TextStyle(fontSize: 18),
                ),
                const SizedBox(width: 8),
                Text(
                  inv.isPaid
                    ? 'Paid via ${inv.paymentMethod}'
                    : 'Payment Pending',
                  style: TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: inv.isPaid
                      ? const Color(0xFF059669)
                      : const Color(0xFFD97706),
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _TotalRow extends StatelessWidget {
  final String label;
  final String value;
  final bool   bold;
  final Color? color;

  const _TotalRow(this.label, this.value, {
    this.bold = false, this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontFamily: 'TimesNewRoman',
              fontSize: bold ? 15 : 13,
              fontWeight: bold
                ? FontWeight.w700 : FontWeight.w400,
              color: bold ? AppTheme.navy800 : AppTheme.gray500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'TimesNewRoman',
              fontSize: bold ? 15 : 13,
              fontWeight: bold
                ? FontWeight.w700 : FontWeight.w600,
              color: color ?? (bold
                ? AppTheme.navy800 : AppTheme.gray700),
            ),
          ),
        ],
      ),
    );
  }
}