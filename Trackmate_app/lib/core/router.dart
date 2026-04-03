import 'package:go_router/go_router.dart';
import '../features/auth/presentation/auth_screen.dart';
import '../features/tourist/presentation/tourist_dashboard.dart';
import '../features/resident/presentation/resident_dashboard.dart';
import '../features/business/presentation/business_dashboard.dart';
import '../features/authority/presentation/authority_dashboard.dart';
import '../features/authority/presentation/authority_incidents.dart';
import '../features/authority/presentation/authority_rosters.dart';
import '../features/authority/presentation/authority_zones.dart';
import '../features/authority/presentation/user_detail.dart';

final goRouter = GoRouter(
  initialLocation: '/auth',
  routes: [
    GoRoute(path: '/auth', builder: (context, state) => const AuthScreen()),
    // Tourist
    GoRoute(path: '/tourist/dashboard', builder: (context, state) => const TouristDashboard()),
    // Resident
    GoRoute(path: '/resident/dashboard', builder: (context, state) => const ResidentDashboard()),
    // Business
    GoRoute(path: '/business/dashboard', builder: (context, state) => const BusinessDashboard()),
    // Authority
    GoRoute(path: '/authority/dashboard', builder: (context, state) => const AuthorityDashboard()),
    GoRoute(path: '/authority/incidents', builder: (context, state) => const AuthorityIncidentsPage()),
    GoRoute(path: '/authority/tourists', builder: (context, state) => const AuthorityRostersPage(role: 'tourist')),
    GoRoute(path: '/authority/residents', builder: (context, state) => const AuthorityRostersPage(role: 'resident')),
    GoRoute(path: '/authority/businesses', builder: (context, state) => const AuthorityRostersPage(role: 'business')),
    GoRoute(path: '/authority/zones', builder: (context, state) => const AuthorityZonesPage()),
    GoRoute(
      path: '/authority/user/:userId',
      builder: (context, state) => UserDetailPage(userId: state.pathParameters['userId']!),
    ),
  ],
);
