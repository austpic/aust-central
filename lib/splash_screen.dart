import 'dart:async';

import 'package:flutter/material.dart';

import 'welcome_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}


class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin{

  @override
  void initState() {
    super.initState();
    Timer(Duration(seconds: 3), () {
      if (!mounted) return;
      Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => WelcomeScreen(),
          ));
    });
  }




  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff407362),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset("assets/images/app-logo.png",
              height:  150,
            ),
            // Text(
            //   "AUSTrack",
            //   style: TextStyle(
            //     color: Colors.white70,
            //     fontWeight: FontWeight.w900,
            //     fontSize: 30,
            //     height: 5,
            //   ),
            // )
          ],
        ),
      ),
    );
  }
}


