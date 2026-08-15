import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/services/auth_service.dart';
import 'package:aust_track/views/home/home_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (name.isEmpty || email.isEmpty || password.isEmpty || confirmPassword.isEmpty) {
      _showSnackBar("Please fill in all fields.");
      return;
    }

    if (password != confirmPassword) {
      _showSnackBar("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      _showSnackBar("Password must be at least 6 characters.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      await context
          .read<AuthService>()
          .register(name: name, email: email, password: password);

      if (!mounted) return;
      _showSnackBar("Account created successfully!");
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const HomePage()),
      );
    } on ApiException catch (e) {
      // The server enforces a stronger password policy than this screen's old
      // 6-character check, and returns per-field messages — surface the first.
      _showSnackBar(e.errorFor('password') ?? e.message);
    } catch (_) {
      _showSnackBar("An unexpected error occurred.");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xff407362),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Column(
        children: [
          ClipPath(
            clipper: WaveClipper(),
            child: Container(
              height: 170,
              width: double.infinity,
              color: const Color(0xff407362),
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(25),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Register",
                    style: TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      color: Color(0xff407362),
                    ),
                  ),
                  const SizedBox(height: 25),
                  const Text("Full Name"),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _nameController,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      hintText: "Enter your full name",
                      prefixIcon: const Icon(Icons.person_outline),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text("Email"),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      hintText: "you@aust.edu",
                      prefixIcon: const Icon(Icons.email_outlined),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text("Password"),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: InputDecoration(
                      hintText: "Enter your password",
                      prefixIcon: const Icon(Icons.lock_outline),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text("Confirm Password"),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _confirmPasswordController,
                    obscureText: true,
                    decoration: InputDecoration(
                      hintText: "Re-enter your password",
                      prefixIcon: const Icon(Icons.lock_outline),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xff407362),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      onPressed: _isLoading ? null : _register,
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                        "Register",
                        style: TextStyle(fontSize: 18, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Center(
                    child: InkWell(
                      onTap: () => Navigator.pop(context),
                      child: Text.rich(
                        TextSpan(
                          text: "Already have an account? ",
                          style: const TextStyle(color: Colors.grey),
                          children: [
                            TextSpan(
                              text: "Login",
                              style: const TextStyle(
                                color: Color(0xff407362),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class WaveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    path.lineTo(0, size.height - 100);
    path.quadraticBezierTo(
      size.width * 0.5, size.height - 150,
      size.width * 0.5, size.height - 80,
    );
    path.quadraticBezierTo(
      size.width * 0.5, size.height,
      size.width, size.height - 80,
    );
    path.lineTo(size.width, 0);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}