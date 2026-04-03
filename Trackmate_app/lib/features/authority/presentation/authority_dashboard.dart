import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/nb_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';

class AuthorityDashboard extends ConsumerStatefulWidget {
  const AuthorityDashboard({super.key});

  @override
  ConsumerState<AuthorityDashboard> createState() => _AuthorityDashboardState();
}

class _AuthorityDashboardState extends ConsumerState<AuthorityDashboard> {
  Map<String, dynamic> _summary = {
    'totalUsers': 0, 'openIncidents': 0, 'sosLastHour': 0, 'activeUsersToday': 0,
  };
  List<dynamic> _incidents = [];
  Map<String, dynamic> _liveUsers = {}; // userId -> Map (lat, lng, role)
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
        _fetchIncidents(); // refresh feed
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
    ]);
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchSummary() async {
    try {
      final res = await ApiClient.get('/analytics/summary');
      if (res['success'] == true) {
        if (mounted) setState(() => _summary = res['data']);
      }
    } catch (_) {}
  }

  Future<void> _fetchIncidents() async {
    try {
      final res = await ApiClient.get('/incidents?limit=10');
      if (res['success'] == true) {
         if (mounted) setState(() => _incidents = res['data'] ?? []);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('God-View Command', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.white)),
        backgroundColor: NB.black,
        elevation: 0,
        iconTheme: const IconThemeData(color: NB.white),
      ),
      drawer: _buildDrawer(context),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: NB.black))
          : Stack(
              children: [
                Column(
                  children: [
                    // Stats Row
                    Container(
                      padding: const EdgeInsets.all(12),
                      color: NB.white,
                      decoration: const BoxDecoration(
                        border: Border(bottom: BorderSide(color: NB.black, width: 3)),
                      ),
                      child: Row(
                        children: [
                          Expanded(child: _buildMiniStat('TOTAL USERS', '${_summary['totalUsers']}', NB.blue)),
                          Container(width: 2, height: 40, color: NB.black, margin: const EdgeInsets.symmetric(horizontal: 8)),
                          Expanded(child: _buildMiniStat('OPEN INCIDENTS', '${_summary['openIncidents']}', NB.orange)),
                          Container(width: 2, height: 40, color: NB.black, margin: const EdgeInsets.symmetric(horizontal: 8)),
                          Expanded(child: _buildMiniStat('SOS (1HR)', '${_summary['sosLastHour']}', NB.red)),
                          Container(width: 2, height: 40, color: NB.black, margin: const EdgeInsets.symmetric(horizontal: 8)),
                          Expanded(child: _buildMiniStat('ACTIVE TODAY', '${_summary['activeUsersToday']}', NB.mint)),
                        ],
                      ),
                    ),
                    
                    // Map Panel
                    Expanded(
                      flex: 4,
                      child: Container(
                        decoration: const BoxDecoration(
                          border: Border(bottom: BorderSide(color: NB.black, width: 3)),
                        ),
                        child: _buildMap(),
                      ),
                    ),
                    
                    // Alert Feed Panel
                    Expanded(
                      flex: 3,
                      child: _buildAlertFeed(),
                    ),
                  ],
                ),
                
                if (_activeSos != null)
                  Positioned(
                    top: 80, left: 16, right: 16,
                    child: _buildSosBanner(),
                  ),
              ],
            ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: color, fontFamily: 'JetBrains Mono')),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 0.5)),
      ],
    );
  }

  Widget _buildMap() {
    List<Marker> markers = _liveUsers.entries.map((e) {
      final lat = e.value['lat'];
      final lng = e.value['lng'];
      final role = e.value['role'];
      
      Color color = NB.blue;
      if (role == 'resident') color = NB.mint;
      if (role == 'business') color = NB.orange;
      
      return Marker(
        point: LatLng(lat, lng),
        width: 14, height: 14,
        child: Container(
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: NB.black, width: 1.5),
          ),
        ),
      );
    }).toList();

    return FlutterMap(
      options: MapOptions(
        initialCenter: const LatLng(27.5, 92.5),
        initialZoom: 7,
      ),
      children: [
        TileLayer(
           urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
           userAgentPackageName: 'com.example.trackmate_app',
        ),
        MarkerLayer(markers: markers),
      ],
    );
  }

  Widget _buildAlertFeed() {
    return Container(
      color: NB.cream,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: const BoxDecoration(
              color: NB.black,
            ),
            child: const Text('LIVE ALERT FEED', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2, color: NB.yellow)),
          ),
          Expanded(
            child: _incidents.isEmpty
             ? const Center(child: Text('All clear!', style: TextStyle(fontWeight: FontWeight.bold)))
             : ListView.separated(
                 itemCount: _incidents.length,
                 separatorBuilder: (_, __) => const Divider(color: NB.black, height: 1, thickness: 2),
                 itemBuilder: (context, i) {
                   final inc = _incidents[i];
                   final severity = inc['severity'] ?? 'low';
                   Color sevColor = NB.blue;
                   if (severity == 'critical') sevColor = NB.critical;
                   else if (severity == 'high') sevColor = NB.red;
                   else if (severity == 'medium') sevColor = NB.orange;

                   final reporterId = inc['reporter']?['_id'];
                   
                   return ListTile(
                     contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                     leading: Container(
                        width: 16, height: 16,
                        decoration: BoxDecoration(color: sevColor, shape: BoxShape.circle, border: Border.all(color: NB.black, width: 2)),
                     ),
                     title: Text(inc['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                     subtitle: GestureDetector(
                       onTap: reporterId != null ? () => context.push('/authority/user/$reporterId') : null,
                       child: Padding(
                         padding: const EdgeInsets.only(top: 4),
                         child: Text(
                           inc['reporter']?['full_name'] ?? 'System',
                           style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: reporterId != null ? NB.blue : NB.textMuted, decoration: reporterId != null ? TextDecoration.underline : null),
                         ),
                       ),
                     ),
                     trailing: NBBadge(label: (inc['status'] ?? 'unknown').toString().toUpperCase(), color: inc['status'] == 'resolved' ? NB.mint : NB.cream),
                   );
                 },
             ),
          ),
        ],
      ),
    );
  }

  Widget _buildSosBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: NB.critical,
        border: Border.all(color: NB.black, width: 4),
        boxShadow: const [BoxShadow(color: NB.black, offset: Offset(4, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.warning, color: NB.white, size: 32),
              const SizedBox(width: 12),
              const Expanded(child: Text('EMERGENCY: SOS TRIGGERED', style: TextStyle(color: NB.white, fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 1.2))),
              IconButton(icon: const Icon(Icons.close, color: NB.white), onPressed: () => setState(() => _activeSos = null)),
            ],
          ),
          const SizedBox(height: 12),
          Text(_activeSos!['reporter']?['full_name'] ?? 'Unknown User', style: const TextStyle(color: NB.white, fontWeight: FontWeight.bold, fontSize: 14)),
          if (_activeSos!['location'] != null)
            Text('Coords: ${_activeSos!['location']['coordinates'][1]}, ${_activeSos!['location']['coordinates'][0]}', style: const TextStyle(color: NB.yellow, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: NB.cream,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: NB.black, border: Border(bottom: BorderSide(color: NB.black, width: 3))),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text('TRACKMATE', style: TextStyle(color: NB.white, fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: 2)),
                Text('Command Center', style: TextStyle(color: NB.yellow, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
              ],
            ),
          ),
          _drawerItem(icon: Icons.dashboard, title: 'Dashboard', onTap: () { context.pop(); }),
          _drawerItem(icon: Icons.warning, title: 'Incidents', onTap: () { context.pop(); context.push('/authority/incidents'); }),
          _drawerItem(icon: Icons.map, title: 'Zone Management', onTap: () { context.pop(); context.push('/authority/zones'); }),
          const Divider(color: NB.black, thickness: 2, height: 32),
          const Padding(padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8), child: Text('DIRECTORIES', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: NB.textMuted))),
          _drawerItem(icon: Icons.tour, title: 'Tourists', onTap: () { context.pop(); context.push('/authority/tourists'); }),
          _drawerItem(icon: Icons.house, title: 'Residents', onTap: () { context.pop(); context.push('/authority/residents'); }),
          _drawerItem(icon: Icons.store, title: 'Businesses', onTap: () { context.pop(); context.push('/authority/businesses'); }),
          const Spacer(),
          const Divider(color: NB.black, thickness: 2),
          _drawerItem(icon: Icons.logout, title: 'Log Out', onTap: () async {
            await ref.read(authProvider.notifier).logout();
            if (context.mounted) context.go('/auth');
          }),
        ],
      ),
    );
  }

  Widget _drawerItem({required IconData icon, required String title, required VoidCallback onTap}) {
    return ListTile(
      leading: Icon(icon, color: NB.black),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
      onTap: onTap,
    );
  }
}
