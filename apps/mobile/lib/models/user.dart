// ─── User / Auth Models ───────────────────────────────────────────────────────

class User {
  final String id;
  final String phone;
  final String? email;
  final String role;
  final String status;
  final bool phoneVerified;
  final String? name;
  final String? weddingDate;
  final String? partnerName;
  final String? city;
  final int? budgetPaise;

  const User({
    required this.id,
    required this.phone,
    this.email,
    required this.role,
    required this.status,
    required this.phoneVerified,
    this.name,
    this.weddingDate,
    this.partnerName,
    this.city,
    this.budgetPaise,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        phone: json['phone'] as String,
        email: json['email'] as String?,
        role: json['role'] as String? ?? 'customer',
        status: json['status'] as String? ?? 'active',
        phoneVerified: json['phoneVerified'] as bool? ?? false,
        name: json['name'] as String?,
        weddingDate: json['weddingDate'] as String?,
        partnerName: json['partnerName'] as String?,
        city: json['city'] as String?,
        budgetPaise: json['budgetPaise'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        if (email != null) 'email': email,
        'role': role,
        'status': status,
        'phoneVerified': phoneVerified,
        if (name != null) 'name': name,
        if (weddingDate != null) 'weddingDate': weddingDate,
        if (partnerName != null) 'partnerName': partnerName,
        if (city != null) 'city': city,
        if (budgetPaise != null) 'budgetPaise': budgetPaise,
      };

  User copyWith({
    String? name,
    String? email,
    String? weddingDate,
    String? partnerName,
    String? city,
    int? budgetPaise,
  }) =>
      User(
        id: id,
        phone: phone,
        email: email ?? this.email,
        role: role,
        status: status,
        phoneVerified: phoneVerified,
        name: name ?? this.name,
        weddingDate: weddingDate ?? this.weddingDate,
        partnerName: partnerName ?? this.partnerName,
        city: city ?? this.city,
        budgetPaise: budgetPaise ?? this.budgetPaise,
      );
}

// ─── Auth State ───────────────────────────────────────────────────────────────

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
  });

  AuthState copyWith({AuthStatus? status, User? user, String? error}) =>
      AuthState(
        status: status ?? this.status,
        user: user ?? this.user,
        error: error,
      );

  bool get isAuthenticated => status == AuthStatus.authenticated;
}
