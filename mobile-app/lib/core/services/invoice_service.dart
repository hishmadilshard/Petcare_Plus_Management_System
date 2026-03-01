import '../constants/api_constants.dart';
import 'api_service.dart';

class InvoiceService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getMyInvoices() async {
    final response = await _api.get(ApiConstants.invoices);
    final data = response.data;
    if (data is List) return data;
    if (data is Map && data.containsKey('invoices')) {
      return data['invoices'] as List;
    }
    return [];
  }

  Future<Map<String, dynamic>> getInvoiceById(dynamic id) async {
    final response = await _api.get(ApiConstants.invoiceById(id));
    return response.data as Map<String, dynamic>;
  }
}
