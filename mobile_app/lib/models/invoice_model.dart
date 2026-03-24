class InvoiceModel {
  final int    invoiceId;
  final int    ownerId;
  final String invoiceNumber;
  final double subtotal;
  final double taxRate;
  final double taxAmount;
  final double discount;
  final double totalAmount;
  final String paymentMethod;
  final String paymentStatus;
  final String? notes;
  final String? dueDate;
  final String  invoiceDate;
  final String? paidDate;
  final String? ownerName;
  final String? ownerPhone;
  final String? serviceType;
  final String? branchName;
  final List<InvoiceItemModel> items;

  InvoiceModel({
    required this.invoiceId,
    required this.ownerId,
    required this.invoiceNumber,
    required this.subtotal,
    required this.taxRate,
    required this.taxAmount,
    required this.discount,
    required this.totalAmount,
    required this.paymentMethod,
    required this.paymentStatus,
    this.notes,
    this.dueDate,
    required this.invoiceDate,
    this.paidDate,
    this.ownerName,
    this.ownerPhone,
    this.serviceType,
    this.branchName,
    this.items = const [],
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      invoiceId:     json['invoice_id']     ?? 0,
      ownerId:       json['owner_id']       ?? 0,
      invoiceNumber: json['invoice_number'] ?? '',
      subtotal:      double.tryParse(
        json['subtotal'].toString()) ?? 0,
      taxRate:       double.tryParse(
        json['tax_rate'].toString()) ?? 0,
      taxAmount:     double.tryParse(
        json['tax_amount'].toString()) ?? 0,
      discount:      double.tryParse(
        json['discount'].toString()) ?? 0,
      totalAmount:   double.tryParse(
        json['total_amount'].toString()) ?? 0,
      paymentMethod: json['payment_method'] ?? 'Cash',
      paymentStatus: json['payment_status'] ?? 'Pending',
      notes:         json['notes'],
      dueDate:       json['due_date'],
      invoiceDate:   json['invoice_date']   ?? '',
      paidDate:      json['paid_date'],
      ownerName:     json['owner_name'],
      ownerPhone:    json['owner_phone'],
      serviceType:   json['service_type'],
      branchName:    json['branch_name'],
      items: (json['items'] as List<dynamic>? ?? [])
          .map((i) => InvoiceItemModel.fromJson(i))
          .toList(),
    );
  }

  bool get isPaid    => paymentStatus == 'Paid';
  bool get isPending => paymentStatus == 'Pending';
}

class InvoiceItemModel {
  final int    itemId;
  final String description;
  final double quantity;
  final double unitPrice;
  final double totalPrice;

  InvoiceItemModel({
    required this.itemId,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory InvoiceItemModel.fromJson(Map<String, dynamic> json) {
    return InvoiceItemModel(
      itemId:      json['item_id']     ?? 0,
      description: json['description'] ?? '',
      quantity:    double.tryParse(
        json['quantity'].toString()) ?? 0,
      unitPrice:   double.tryParse(
        json['unit_price'].toString()) ?? 0,
      totalPrice:  double.tryParse(
        json['total_price'].toString()) ?? 0,
    );
  }
}