/// The signed-in user, as returned by the AUST Central API.
///
/// Replaces Firebase's `User`. Only fields the server actually exposes are
/// present — there is deliberately no password or token here.
class AppUser {
  final String id;
  final String email;
  final String name;
  final String? studentId;
  final String? department;
  final String role;
  final bool emailVerified;
  final String? avatarFileId;

  const AppUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.emailVerified,
    this.studentId,
    this.department,
    this.avatarFileId,
  });

  bool get isStaff => role == 'MODERATOR' || role == 'ADMIN';

  /// The dashboard greets by last name ("Good Morning, Rahman").
  String get lastName {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.length > 1 ? parts.last : parts.first;
  }

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String,
        studentId: json['studentId'] as String?,
        department: json['department'] as String?,
        role: json['role'] as String? ?? 'STUDENT',
        emailVerified: json['emailVerified'] as bool? ?? false,
        avatarFileId: json['avatarFileId'] as String?,
      );
}
