import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';
import '../../auth/providers/auth_provider.dart';

class AuthorityDashboard extends ConsumerStatefulWidget {
  const AuthorityDashboard({super.key});

  @override
  ConsumerState<AuthorityDashboard> createState() => _AuthorityDashboardState();
}

class _AuthorityDashboardState extends ConsumerState<AuthorityDashboard> {
  final MapController _mapController = MapController();
  final LatLng _defaultCenter = const LatLng(27.5, 92.5);

  Map<String, dynamic> _summary = {
    'totalUsers': 0,
    'openIncidents': 0,
    'sosLastHour': 0,
    'activeUsersToday': 0,
  };
  List<dynamic> _incidents = [];
  List<dynamic> _zones = [];
  Map<String, dynamic> _liveUsers = {};
  Map<String, dynamic>? _activeSos;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
    _setupSockets();
  }

  void _setupSockets() {
    SocketService.instance.joinRoom('authority_room');

    SocketService.instance.on('location:update', (data) {
      if (data == null) return;
      if (mounted) {
        setState(() {
          _liveUsers[data['userId']] = {
            'lat': data['latitude'],
            'lng': data['longitude'],
            'role': data['role'] ?? 'tourist',
          };
        });
      }
    });

    SocketService.instance.on('sos:triggered', (data) {
      if (mounted) {
        setState(() => _activeSos = data);
        _fetchIncidents();
      }
    });

    SocketService.instance.on('new-incident', (_) {
      if (mounted) _fetchIncidents();
    });
  }

  @override
  void dispose() {
    SocketService.instance.off('location:update');
    SocketService.instance.off('sos:triggered');
    SocketService.instance.off('new-incident');
    super.dispose();
  }

  Future<void> _fetchData() async {
    await Future.wait([
      _fetchSummary(),
      _fetchIncidents(),
      _fetchZones(),
    ]);
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchSummary() async {
    try {
      final res = await ApiClient.get('/analytics/summary');
      if (res['success'] == true && mounted) {
        setState(() => _summary = res['data']);
      }
    } catch (_) {}
  }

  Future<void> _fetchIncidents() async {
    try {
      final res = await ApiClient.get('/incidents?limit=10');
      if (res['success'] == true && mounted) {
        setState(() => _incidents = res['data'] ?? []);
      }
    } catch (_) {}
  }

  Future<void> _fetchZones() async {
    try {
      final res = await ApiClient.get('/zones');
      if (res['success'] == true && mounted) {
        setState(() => _zones = res['data'] ?? []);
      }
    } catch (_) {}
  }

  void _focusOnFirstLive() {
    if (_liveUsers.isEmpty) return;
    final first = _liveUsers.values.first;
    final lat = first['lat'];
    final lng = first['lng'];
    if (lat is num && lng is num) {
      _mapController.move(LatLng(lat.toDouble(), lng.toDouble()), 12);
    }
  }

  void _resetView() {
    _mapController.move(_defaultCenter, 7);
  }

  int _countRole(String role) {
    return _liveUsers.values.where((u) => u['role'] == role).length;
  }

  Color _severityColor(String? severity) {
    switch (severity) {
      case 'critical':
        return Clay.critical;
      case 'high':
        return Clay.high;
      case 'medium':
        return Clay.moderate;
      default:
        return Clay.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        title: const Text(
          'Command Dashboard',
          style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text),
        ),
        backgroundColor: Clay.surface,
        elevation: 0,
        iconTheme: const IconThemeData(color: Clay.text),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchData,
            tooltip: 'Refresh',
          ),
        ],
      ),
      drawer: _buildDrawer(context),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_activeSos != null) _buildSosBanner(),
                ClayCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Live Command Center',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Clay.text),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${authState.user?['full_name'] ?? 'Authority'} · ${authState.user?['designation'] ?? 'Operations'}',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Clay.textMuted),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _roleBadge('Tourists', _countRole('tourist'), Clay.primary),
                          _roleBadge('Residents', _countRole('resident'), Clay.safe),
                          _roleBadge('Businesses', _countRole('business'), Clay.moderate),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _buildStatsGrid(),
                const SizedBox(height: 16),
                _buildLiveMonitoringPanel(),
                const SizedBox(height: 12),
                _buildMapPanel(),
                const SizedBox(height: 16),
                _buildAlertFeed(),
              ],
            ),
    );
  }

  Widget _buildStatsGrid() {
    final statCards = [
      {'label': 'Live Users', 'value': _liveUsers.length, 'color': Clay.primary},
      {'label': 'Open Incidents', 'value': _summary['openIncidents'], 'color': Clay.high},
      {'label': 'SOS (1h)', 'value': _summary['sosLastHour'], 'color': Clay.critical},
      {'label': 'Total Profiles', 'value': _summary['totalUsers'], 'color': Clay.safe},
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: statCards.map((s) {
        final color = s['color'] as Color;
        return ClayCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  s['label'].toString(),
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 9, color: Clay.textMuted),
                ),
              ),
              const Spacer(),
              Text(
                s['value'].toString(),
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: color),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildLiveMonitoringPanel() {
    return ClayCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Live Monitoring',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text),
                ),
                const SizedBox(height: 4),
                Text(
                  'Tracking ${_liveUsers.length} devices across active zones.',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              children: [
                ClayButton(
                  label: 'Reset View',
                  variant: ClayButtonVariant.ghost,
                  onTap: _resetView,
                  fullWidth: true,
                ),
                const SizedBox(height: 8),
                ClayButton(
                  label: 'Focus Live',
                  variant: ClayButtonVariant.primary,
                  onTap: _focusOnFirstLive,
                  fullWidth: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapPanel() {
    final polygons = _zones.map<Polygon?>((z) {
      final boundary = z['boundary'];
      if (boundary != null && boundary['coordinates'] != null) {
        final coords = boundary['coordinates'][0] as List;
        final points = coords.map((c) => LatLng(c[1], c[0])).toList();
        if (points.isEmpty) return null;
        final risk = (z['risk_level'] ?? '').toString().toLowerCase();
        final color = risk == 'safe'
            ? Clay.safe
            : risk == 'moderate'
                ? Clay.moderate
                : risk == 'high'
                    ? Clay.high
                    : Clay.restricted;
        return Polygon(
          points: points,
          color: color.withOpacity(0.12),
          borderColor: color,
          borderStrokeWidth: 2,
        );
      }
      return null;
    }).whereType<Polygon>().toList();

    final markers = _liveUsers.values.map<Marker?>((u) {
      final lat = u['lat'];
      final lng = u['lng'];
      final role = u['role'];
      if (lat is! num || lng is! num) return null;
      Color color = Clay.primary;
      if (role == 'resident') color = Clay.safe;
      if (role == 'business') color = Clay.moderate;
      return Marker(
        point: LatLng(lat.toDouble(), lng.toDouble()),
        width: 14,
        height: 14,
        child: Container(
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Clay.surface, width: 2),
            boxShadow: [
              BoxShadow(color: color.withOpacity(0.4), blurRadius: 8, spreadRadius: 1),
            ],
          ),
        ),
      );
    }).whereType<Marker>().toList();

    return ClayCard(
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: SizedBox(
          height: 320,
          child: FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _defaultCenter,
              initialZoom: 7,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.trackmate_app',
              ),
              PolygonLayer(polygons: polygons),
              MarkerLayer(markers: markers),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAlertFeed() {
    return ClayCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Live Alert Feed',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text),
          ),
          const SizedBox(height: 10),
          if (_incidents.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('All clear.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted)),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _incidents.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final inc = _incidents[i];
                final sev = (inc['severity'] ?? 'low').toString().toLowerCase();
                final color = _severityColor(sev);
                final reporterId = inc['reporter']?['_id'];

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Clay.surfaceAlt,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Clay.border, width: 1),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              inc['title'] ?? 'Incident',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.text),
                            ),
                            const SizedBox(height: 4),
                            GestureDetector(
                              onTap: reporterId != null
                                  ? () => context.push('/authority/user/$reporterId')
                                  : null,
                              child: Text(
                                inc['reporter']?['full_name'] ?? 'System',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 10,
                                  color: reporterId != null ? Clay.primary : Clay.textMuted,
                                  decoration: reporterId != null ? TextDecoration.underline : null,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      ClayBadge(
                        label: (inc['status'] ?? 'unknown').toString().toUpperCase(),
                        color: (inc['status'] == 'resolved') ? Clay.safe.withOpacity(0.12) : Clay.surface,
                        textColor: (inc['status'] == 'resolved') ? Clay.safe : Clay.textMuted,
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildSosBanner() {
    final reporter = _activeSos?['reporter']?['full_name'] ?? 'Unknown User';
    final coords = _activeSos?['location']?['coordinates'];
    final coordText = (coords is List && coords.length >= 2)
        ? 'Coords: ${coords[1]}, ${coords[0]}'
        : 'Location: Unavailable';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFEF4444), Color(0xFFDC2626)]),
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [BoxShadow(color: Color(0x40EF4444), blurRadius: 18, offset: Offset(0, 8))],
      ),
      child: Row(
        children: [
          const Icon(Icons.warning, color: Colors.white, size: 26),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('EMERGENCY SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                const SizedBox(height: 4),
                Text(reporter, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
                Text(coordText, style: const TextStyle(color: Color(0xFFFFE4E6), fontWeight: FontWeight.w600, fontSize: 10)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => setState(() => _activeSos = null),
          ),
        ],
      ),
    );
  }

  Widget _roleBadge(String label, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text('$count', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.text)),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted)),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: Clay.surface,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: Clay.surface,
              border: Border(bottom: BorderSide(color: Clay.border, width: 1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: const [
                Text('TRACKMATE', style: TextStyle(color: Clay.text, fontWeight: FontWeight.w800, fontSize: 20, letterSpacing: 1)),
                Text('Command Center', style: TextStyle(color: Clay.textMuted, fontWeight: FontWeight.w700, fontSize: 11, letterSpacing: 0.6)),
              ],
            ),
          ),
          _drawerItem(icon: Icons.dashboard, title: 'Dashboard', onTap: () { context.pop(); }),
          _drawerItem(icon: Icons.analytics, title: 'Analytics', onTap: () { context.pop(); context.push('/authority/analytics'); }),
          _drawerItem(icon: Icons.warning, title: 'Incidents', onTap: () { context.pop(); context.push('/authority/incidents'); }),
          _drawerItem(icon: Icons.gavel, title: 'eFIR Desk', onTap: () { context.pop(); context.push('/authority/efir'); }),
          _drawerItem(icon: Icons.map, title: 'Zone Management', onTap: () { context.pop(); context.push('/authority/zones'); }),
          const Divider(color: Clay.border, height: 32),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text('DIRECTORIES', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 10, color: Clay.textMuted)),
          ),
          _drawerItem(icon: Icons.tour, title: 'Tourists', onTap: () { context.pop(); context.push('/authority/tourists'); }),
          _drawerItem(icon: Icons.house, title: 'Residents', onTap: () { context.pop(); context.push('/authority/residents'); }),
          _drawerItem(icon: Icons.store, title: 'Businesses', onTap: () { context.pop(); context.push('/authority/businesses'); }),
          const Spacer(),
          const Divider(color: Clay.border),
          _drawerItem(
            icon: Icons.logout,
            title: 'Log Out',
            onTap: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/auth');
            },
          ),
        ],
      ),
    );
  }

  Widget _drawerItem({required IconData icon, required String title, required VoidCallback onTap}) {
    return ListTile(
      leading: Icon(icon, color: Clay.text),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Clay.text)),
      onTap: onTap,
    );
  }
}
