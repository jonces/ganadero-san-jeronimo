import 'package:flutter/material.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const FincaGanaderaApp());
}

class FincaGanaderaApp extends StatelessWidget {
  const FincaGanaderaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Finca Ganadera',
      theme: ThemeData(
        colorSchemeSeed: Colors.green,
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}
