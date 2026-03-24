class UserModel {
  final int    userId;
  final String fullName;
  final String email;
  final String? phone;
  final String role;
  final String? branchRole;
  final int?   branchId;
  final String? branchName;
  final String status;
  final String? profileImage;
  final String? lastLogin;

  UserModel({
    required this.userId,
    required this.fullName,
    required this.email,
    this.phone,
    required this.role,
    this.branchRole,
    this.branchId,
    this.branchName,
    required this.status,
    this.profileImage,
    this.lastLogin,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId:       json['user_id']    ?? 0,
      fullName:     json['full_name']  ?? '',
      email:        json['email']      ?? '',
      phone:        json['phone'],
      role:         json['role']       ?? 'Owner',
      branchRole:   json['branch_role'],
      branchId:     json['branch_id'],
      branchName:   json['branch_name'],
      status:       json['status']     ?? 'Active',
      profileImage: json['profile_image'],
      lastLogin:    json['last_login'],
    );
  }

  Map<String, dynamic> toJson() => {
    'user_id':       userId,
    'full_name':     fullName,
    'email':         email,
    'phone':         phone,
    'role':          role,
    'branch_role':   branchRole,
    'branch_id':     branchId,
    'branch_name':   branchName,
    'status':        status,
    'profile_image': profileImage,
    'last_login':    lastLogin,
  };

  bool get isAdmin       => role == 'Admin';
  bool get isVet         => role == 'Vet';
  bool get isReceptionist=> role == 'Receptionist';
  bool get isOwner       => role == 'Owner';
  bool get isSuperAdmin  => branchRole == 'Super_Admin';
  bool get isBranchAdmin => branchRole == 'Branch_Manager';

  String get firstName   => fullName.split(' ').first;
  String get initials    => fullName
      .split(' ')
      .take(2)
      .map((w) => w.isNotEmpty ? w[0].toUpperCase() : '')
      .join();
}