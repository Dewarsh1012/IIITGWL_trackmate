import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/router.dart';

void main() {
  runApp(
    const ProviderScope(
      child: TrackMateApp(),
    ),
  );
}

class TrackMateApp extends ConsumerWidget {
  const TrackMateApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'TrackMate SafeTravel',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.authorityTheme,
      routerConfig: goRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
