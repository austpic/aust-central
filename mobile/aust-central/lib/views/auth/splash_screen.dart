import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/views/home/home_page.dart';
import 'package:aust_track/data/services/auth_service.dart';
import 'package:aust_track/views/auth/welcome_screen.dart';

/// Splash + auth gate.
///
/// Previously this was a bare 3-second timer that always pushed the welcome
/// screen, so a signed-in user was made to log in again on every cold start.
/// It now restores the stored session while the logo is on screen and routes
/// to the dashboard when one is still valid.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Deferred so the first frame (and thus the logo) paints before we start
    // hitting the network.
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    final auth = context.read<AuthService>();

    // Restore and a minimum splash dwell run together, so a fast network does
    // not make the logo flash by — but a slow one is not padded further.
    await Future.wait([
      auth.restoreSession(),
      Future<void>.delayed(const Duration(milliseconds: 1200)),
    ]);
    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => auth.isSignedIn ? const HomePage() : const WelcomeScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff407362),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/images/app-logo.png', width: 160),
            const SizedBox(height: 28),
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(Colors.white70),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
