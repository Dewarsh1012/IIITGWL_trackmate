import 'package:go_router/go_router.dart';
import '../features/auth/presentation/auth_screen.dart';
import '../features/tourist/presentation/tourist_dashboard.dart';
import '../features/tourist/presentation/tourist_itinerary.dart';
import '../features/tourist/presentation/tourist_profile.dart';
import '../features/resident/presentation/resident_dashboard.dart';
import '../features/resident/presentation/resident_feed.dart';
import '../features/business/presentation/business_dashboard.dart';
import '../features/business/presentation/business_profile.dart';
import '../features/authority/presentation/authority_dashboard.dart';
import '../features/authority/presentation/authority_analytics.dart';
import '../features/authority/presentation/authority_efir.dart';
import '../features/authority/presentation/authority_incidents.dart';
import '../features/authority/presentation/authority_rosters.dart';
import '../features/authority/presentation/authority_zones.dart';
import '../features/authority/presentation/authority_alerts.dart';
import '../features/authority/presentation/authority_checkins.dart';
import '../features/authority/presentation/user_detail.dart';

final goRouter = GoRouter(
  initialLocation: '/auth',
  routes: [
    GoRoute(path: '/auth', builder: (context, state) => const AuthScreen()),
    // Tourist
    GoRoute(path: '/tourist/dashboard', builder: (context, state) => const TouristDashboard()),
    GoRoute(path: '/tourist/itinerary', builder: (context, state) => const TouristItineraryPage()),
    GoRoute(path: '/tourist/plan', builder: (context, state) => const TouristItineraryPage()),
    GoRoute(path: '/tourist/profile', builder: (context, state) => const TouristProfilePage()),
    // Resident
    GoRoute(path: '/resident/dashboard', builder: (context, state) => const ResidentDashboard()),
    GoRoute(path: '/resident/feed', builder: (context, state) => const ResidentFeedPage()),
    GoRoute(path: '/resident/incidents', builder: (context, state) => const ResidentFeedPage()),
    // Business
    GoRoute(path: '/business/dashboard', builder: (context, state) => const BusinessDashboard()),
    GoRoute(path: '/business/profile', builder: (context, state) => const BusinessProfilePage()),
    // Authority
    GoRoute(path: '/authority/dashboard', builder: (context, state) => const AuthorityDashboard()),
    GoRoute(path: '/authority/analytics', builder: (context, state) => const AuthorityAnalyticsPage()),
    GoRoute(
      path: '/authority/efir',
      builder: (context, state) => AuthorityEfirPage(
        incidentId: state.uri.queryParameters['incidentId'],
      ),
    ),
    GoRoute(path: '/authority/incidents', builder: (context, state) => const AuthorityIncidentsPage()),
    GoRoute(path: '/authority/alerts', builder: (context, state) => const AuthorityAlertComposerPage()),
    GoRoute(path: '/authority/checkins', builder: (context, state) => const AuthorityDailyCheckinsPage()),
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
