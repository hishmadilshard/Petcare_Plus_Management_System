class AppStrings {
  AppStrings._();

  // App
  static const String appName = 'PetCare Plus';
  static const String appTagline = 'Your Pet\'s Health, Our Priority';

  // Auth
  static const String login = 'Login';
  static const String register = 'Register';
  static const String logout = 'Logout';
  static const String email = 'Email';
  static const String password = 'Password';
  static const String confirmPassword = 'Confirm Password';
  static const String fullName = 'Full Name';
  static const String phoneNumber = 'Phone Number';
  static const String forgotPassword = 'Forgot Password?';
  static const String dontHaveAccount = "Don't have an account? ";
  static const String alreadyHaveAccount = 'Already have an account? ';
  static const String signUp = 'Sign Up';
  static const String signIn = 'Sign In';
  static const String invalidRole =
      'Access denied. This app is for pet owners only.';

  // Validation
  static const String fieldRequired = 'This field is required';
  static const String invalidEmail = 'Enter a valid email address';
  static const String passwordTooShort =
      'Password must be at least 6 characters';
  static const String passwordsDoNotMatch = 'Passwords do not match';

  // Navigation
  static const String home = 'Home';
  static const String pets = 'My Pets';
  static const String appointments = 'Appointments';
  static const String notifications = 'Notifications';
  static const String profile = 'Profile';

  // Home
  static const String hello = 'Hello';
  static const String myPets = 'My Pets';
  static const String nextAppointment = 'Next Appointment';
  static const String unreadNotifications = 'Unread';
  static const String quickActions = 'Quick Actions';
  static const String recentNotifications = 'Recent Notifications';
  static const String bookAppointment = 'Book Appointment';
  static const String medicalRecords = 'Medical Records';
  static const String scanQr = 'Scan QR';
  static const String noAppointments = 'No upcoming appointments';
  static const String noNotifications = 'No notifications yet';
  static const String noPets = 'No pets found';

  // Pets
  static const String petDetails = 'Pet Details';
  static const String viewQrCode = 'View QR Code';
  static const String medicalHistory = 'Medical History';
  static const String species = 'Species';
  static const String breed = 'Breed';
  static const String age = 'Age';
  static const String weight = 'Weight';
  static const String color = 'Color';
  static const String microchipId = 'Microchip ID';
  static const String dateOfBirth = 'Date of Birth';
  static const String gender = 'Gender';
  static const String years = 'years';
  static const String months = 'months';
  static const String kg = 'kg';

  // QR
  static const String petQrCode = 'Pet QR Code';
  static const String qrInstructions =
      'Scan this QR code to view your pet\'s information';
  static const String shareQr = 'Share QR Code';
  static const String scanQrCode = 'Scan QR Code';
  static const String scanQrInstructions =
      'Point your camera at a PetCare Plus QR code';

  // Appointments
  static const String upcoming = 'Upcoming';
  static const String past = 'Past';
  static const String bookNew = 'Book New Appointment';
  static const String selectPet = 'Select Pet';
  static const String selectDate = 'Select Date';
  static const String selectTime = 'Select Time';
  static const String serviceType = 'Service Type';
  static const String selectVet = 'Select Vet';
  static const String notes = 'Notes';
  static const String submit = 'Submit';
  static const String appointmentDetails = 'Appointment Details';
  static const String date = 'Date';
  static const String time = 'Time';
  static const String vet = 'Vet';
  static const String status = 'Status';
  static const String service = 'Service';

  // Medical Records
  static const String diagnosis = 'Diagnosis';
  static const String treatment = 'Treatment';
  static const String prescription = 'Prescription';
  static const String visitDate = 'Visit Date';
  static const String recordedBy = 'Recorded By';
  static const String noMedicalRecords = 'No medical records found';

  // Invoices
  static const String invoices = 'Invoices';
  static const String invoiceDetails = 'Invoice Details';
  static const String invoiceNumber = 'Invoice #';
  static const String amount = 'Amount';
  static const String dueDate = 'Due Date';
  static const String paid = 'Paid';
  static const String pending = 'Pending';
  static const String overdue = 'Overdue';
  static const String noInvoices = 'No invoices found';
  static const String subtotal = 'Subtotal';
  static const String tax = 'Tax';
  static const String total = 'Total';

  // Errors
  static const String genericError = 'Something went wrong. Please try again.';
  static const String networkError =
      'Network error. Check your connection and try again.';
  static const String sessionExpired = 'Session expired. Please login again.';

  // Success
  static const String appointmentBooked =
      'Appointment booked successfully!';
  static const String logoutSuccess = 'Logged out successfully';
}
