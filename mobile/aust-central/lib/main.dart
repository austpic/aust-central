import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/api/api_client.dart';
import 'package:aust_track/data/api/token_store.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';
import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/data/repositories/platform_repository.dart';
import 'package:aust_track/data/services/auth_service.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/auth/splash_screen.dart';

/// Composition root.
///
/// The data layer is assembled once here and injected downward. View models
/// take repositories through their constructors rather than reaching for a
/// singleton, so each one can be unit-tested with a fake repository and no
/// widget tree.
///
/// No Firebase.initializeApp(). That call was why iOS, web, and desktop
/// crashed on launch — it required native config only Android had. The app now
/// talks to the AUST Central API, which needs no per-platform setup.
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final tokens = TokenStore();
  late final ApiClient client;
  late final AuthService authService;

  client = ApiClient(
    tokens: tokens,
    // Fired when a refresh fails: the session is unrecoverable, so drop it and
    // let the auth gate route back to the welcome screen.
    onSessionExpired: () async => authService.signOut(),
  );
  authService = AuthService(client: client, tokens: tokens);

  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: client),
        ChangeNotifierProvider<AuthService>.value(value: authService),

        // Repositories are stateless wrappers over ApiClient, so a single
        // instance each is enough and they need no disposal.
        Provider<AcademicRepository>(create: (_) => AcademicRepository(client)),
        Provider<CommunityRepository>(create: (_) => CommunityRepository(client)),
        Provider<PlatformRepository>(create: (_) => PlatformRepository(client)),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'AUST Central',
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'SpaceGrotesk',
        scaffoldBackgroundColor: AppColors.scaffoldBackground,
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.darkGreen),
      ),
      home: const SplashScreen(),
    );
  }
}
