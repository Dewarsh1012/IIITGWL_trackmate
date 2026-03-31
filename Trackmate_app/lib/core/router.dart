import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/auth_screen.dart';
import '../features/tourist/presentation/tourist_dashboard.dart';
import '../features/resident/presentation/resident_dashboard.dart';
import '../features/business/presentation/business_dashboard.dart';
import '../features/authority/presentation/authority_dashboard.dart';

final goRouter = GoRouter(
  initialLocation: '/auth',
  routes: [
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),
    GoRoute(
      path: '/tourist/dashboard',
      builder: (context, state) => const TouristDashboard(),
    ),
    GoRoute(
      path: '/resident/dashboard',
      builder: (context, state) => const ResidentDashboard(),
    ),
    GoRoute(
      path: '/business/dashboard',
      builder: (context, state) => const BusinessDashboard(),
    ),
    GoRoute(
      path: '/authority/dashboard',
      builder: (context, state) => const AuthorityDashboard(),
    ),
    // Additional placeholders can be added here
  ],
);
