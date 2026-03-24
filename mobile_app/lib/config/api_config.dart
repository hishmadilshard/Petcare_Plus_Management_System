class ApiConfig {
  static const String baseUrl = 'http://localhost:5000/api';

  // ── Auth ──────────────────────────────────────
  static const String login          = '$baseUrl/auth/login';
  static const String register       = '$baseUrl/auth/register';
  static const String profile        = '$baseUrl/auth/profile';
  static const String changePassword = '$baseUrl/auth/change-password';
  static const String forgotPassword = '$baseUrl/auth/forgot-password';
  static const String resetPassword  = '$baseUrl/auth/reset-password';

  // ── Pets ──────────────────────────────────────
  static const String pets           = '$baseUrl/pets';

  // ── Owners ───────────────────────────────────
  static const String owners         = '$baseUrl/owners';

  // ── Appointments ─────────────────────────────
  static const String appointments   = '$baseUrl/appointments';

  // ── Medical Records ───────────────────────────
  static const String medical        = '$baseUrl/medical';

  // ── Vaccinations ──────────────────────────────
  static const String vaccinations   = '$baseUrl/vaccinations';

  // ── Invoices ──────────────────────────────────
  static const String invoices       = '$baseUrl/invoices';

  // ── Inventory ─────────────────────────────────
  static const String inventory      = '$baseUrl/inventory';

  // ── Branches ──────────────────────────────────
  static const String branches       = '$baseUrl/branches';

  // ── Notifications ─────────────────────────────
  static const String notifications  = '$baseUrl/notifications';

  // ── Token Storage Key ─────────────────────────
  static const String tokenKey       = 'petcare_token';
  static const String userKey        = 'petcare_user';
}