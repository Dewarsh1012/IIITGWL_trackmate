import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/location_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';
import '../../../core/widgets/nb_widgets.dart';

class TouristDashboard extends ConsumerStatefulWidget {
  const TouristDashboard({super.key});

  @override
  ConsumerState<TouristDashboard> createState() => _TouristDashboardState();
}

class _TouristDashboardState extends ConsumerState<TouristDashboard> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isSosActive = false;
  int _sosPressCount = 0;
  DateTime? _lastSosPress;
  bool _checkinLoading = false;
  bool _verifyLoading = false;
  List<dynamic> _zones = [];
  List<dynamic> _incidents = [];
  bool _isLoadingZones = true;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.0, end: 20.0).animate(CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut));

    _fetchZones();
    _fetchIncidents();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _fetchZones() async {
    try {
      final res = await ApiClient.get('/zones');
      if (res['success'] == true && mounted) {
        setState(() {
          _zones = res['data'] ?? [];
          _isLoadingZones = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingZones = false);
    }
  }

  Future<void> _fetchIncidents() async {
    try {
      final res = await ApiClient.get('/incidents?limit=5');
      if (res['success'] == true && mounted) {
        setState(() {
          _incidents = res['data'] ?? [];
        });
      }
    } catch (_) {
      // ignore
    }
  }

  Future<void> _triggerSos(LocationState locState) async {
    setState(() => _isSosActive = true);

    try {
      final body = <String, dynamic>{
        'title': 'Emergency SOS Alert',
        'description': 'User triggered panic button from mobile app.',
        'incident_type': 'sos_panic',
        'severity': 'critical',
      };

      if (locState.position != null) {
        body['location'] = {
          'type': 'Point',
          'coordinates': [locState.position!.longitude, locState.position!.latitude],
        };
      }

      await ApiClient.post('/incidents', body);
      SocketService.instance.emit('sos:triggered', body);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('SOS Alert dispatched!'), backgroundColor: Clay.critical),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send SOS: $e'), backgroundColor: Clay.text),
        );
      }
    }

    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _isSosActive = false);
    });
  }

  void _handleSosPress(LocationState locState) {
    final now = DateTime.now();
    if (_lastSosPress == null || now.difference(_lastSosPress!) > const Duration(seconds: 4)) {
      _sosPressCount = 1;
    } else {
      _sosPressCount++;
    }
    _lastSosPress = now;

    if (_sosPressCount >= 3) {
      _sosPressCount = 0;
      _triggerSos(locState);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Tap ${3 - _sosPressCount} more times to trigger SOS')),
      );
    }
  }

  void _showReportAnomalyModal() {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String type = 'suspicious_activity';
    String severity = 'medium';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Clay.bg,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: StatefulBuilder(
            builder: (context, setModalState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Report Anomaly', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Clay.text)),
                  const SizedBox(height: 8),
                  const Divider(color: Clay.border, thickness: 1),
                  const SizedBox(height: 12),
                  const Text('Title', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.textMuted)),
                  const SizedBox(height: 6),
                  ClayInput(controller: titleCtrl, hint: 'Brief title...'),
                  const SizedBox(height: 12),
                  const Text('Description', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.textMuted)),
                  const SizedBox(height: 6),
                  ClayInput(controller: descCtrl, hint: 'What happened?', maxLines: 3),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Type', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.textMuted)),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(
                                color: Clay.surfaceAlt,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Clay.border, width: 1),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: type,
                                  isExpanded: true,
                                  onChanged: (v) => setModalState(() => type = v!),
                                  items: const [
                                    DropdownMenuItem(value: 'suspicious_activity', child: Text('Suspicious Activity')),
                                    DropdownMenuItem(value: 'theft', child: Text('Theft')),
                                    DropdownMenuItem(value: 'harassment', child: Text('Harassment')),
                                    DropdownMenuItem(value: 'medical_emergency', child: Text('Medical Emergency')),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Severity', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.textMuted)),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(
                                color: Clay.surfaceAlt,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Clay.border, width: 1),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: severity,
                                  isExpanded: true,
                                  onChanged: (v) => setModalState(() => severity = v!),
                                  items: const [
                                    DropdownMenuItem(value: 'low', child: Text('Low')),
                                    DropdownMenuItem(value: 'medium', child: Text('Medium')),
                                    DropdownMenuItem(value: 'high', child: Text('High')),
                                    DropdownMenuItem(value: 'critical', child: Text('Critical')),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ClayButton(
                    label: 'Submit Report',
                    variant: ClayButtonVariant.primary,
                    onTap: () async {
                      if (titleCtrl.text.isEmpty || descCtrl.text.isEmpty) return;
                      final locState = ref.read(locationProvider);
                      final body = <String, dynamic>{
                        'title': titleCtrl.text,
                        'description': descCtrl.text,
                        'incident_type': type,
                        'severity': severity,
                      };
                      if (locState.position != null) {
                        body['location'] = {
                          'type': 'Point',
                          'coordinates': [locState.position!.longitude, locState.position!.latitude],
                        };
                      }

                      try {
                        await ApiClient.post('/incidents', body);
                        if (mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Incident reported!')));
                          _fetchIncidents();
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                        }
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _handleCheckin(LocationState locState) async {
    if (locState.position == null) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Wait for location')));
      return;
    }
    setState(() => _checkinLoading = true);
    try {
      final body = {
        'latitude': locState.position!.latitude,
        'longitude': locState.position!.longitude,
        'source': 'gps'
      };
      final res = await ApiClient.post('/locations', body);
      final zone = res['data']?['zone'];
      await ApiClient.post('/incidents', {
        'title': 'Tourist Checked In',
        'description': 'User checked in ${zone != null ? 'at ${zone['name']}' : ''}',
        'incident_type': 'other',
        'severity': 'low',
        'location': {
          'type': 'Point',
          'coordinates': [locState.position!.longitude, locState.position!.latitude]
        }
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(zone != null ? 'Checked in at ${zone['name']}' : 'Daily check-in recorded')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Check-in failed: $e')));
    } finally {
      if (mounted) setState(() => _checkinLoading = false);
    }
  }

  Future<void> _handleVerifyStay(LocationState locState) async {
    if (locState.position == null) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Wait for location')));
      return;
    }
    setState(() => _verifyLoading = true);
    try {
      final body = {
        'latitude': locState.position!.latitude,
        'longitude': locState.position!.longitude,
        'source': 'gps'
      };
      final res = await ApiClient.post('/locations', body);
      final zone = res['data']?['zone'];
      
      if (zone != null) {
        await ApiClient.post('/incidents', {
          'title': 'Stay Verified',
          'description': 'User verified stay in ${zone['name']}',
          'incident_type': 'other',
          'severity': 'low',
          'location': { 'type': 'Point', 'coordinates': [locState.position!.longitude, locState.position!.latitude] }
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('✓ Verified inside ${zone['name']}')));
      } else {
        await ApiClient.post('/incidents', {
          'title': 'Stay Verification Failed',
          'description': 'User not in any zone',
          'incident_type': 'other',
          'severity': 'medium',
          'location': { 'type': 'Point', 'coordinates': [locState.position!.longitude, locState.position!.latitude] }
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ℹ Not inside any registered zone')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Verify failed: $e')));
    } finally {
      if (mounted) setState(() => _verifyLoading = false);
    }
  }

  void _handleSafeHouse(LocationState locState) {
    if (locState.position == null) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Wait for location')));
      return;
    }
    ApiClient.post('/incidents', {
      'title': 'Safe House Requested',
      'description': 'User navigating to nearest safe house',
      'incident_type': 'other',
      'severity': 'low',
      'location': { 'type': 'Point', 'coordinates': [locState.position!.longitude, locState.position!.latitude] }
    });
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Safe house navigation started. Authorities notified.')));
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(locationProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        title: const Text('Tourist Dashboard', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        backgroundColor: Clay.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.route, color: Clay.text),
            onPressed: () => context.push('/tourist/itinerary'),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline, color: Clay.text),
            onPressed: () => context.push('/tourist/profile'),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Clay.text),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (mounted) context.go('/auth');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Clay.surface,
              border: Border(bottom: BorderSide(color: Clay.border, width: 1)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Welcome, ${authState.fullName}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Clay.text)),
                    const SizedBox(height: 4),
                    ClayBadge(label: authState.user?['blockchain_id'] ?? 'NO_ID', color: Clay.surfaceAlt),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Safety Score', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted)),
                    Text('${authState.user?['safety_score'] ?? 100}%', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Clay.safe)),
                  ],
                )
              ],
            ),
          ),

          _buildSafetyBanner(locationState),

          Expanded(
            flex: 3,
            child: locationState.position == null
                ? const Center(child: CircularProgressIndicator(color: Clay.primary))
                : _buildMap(locationState),
          ),

          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: ClayButton(
                          label: 'Report Anomaly',
                          variant: ClayButtonVariant.ghost,
                          onTap: _showReportAnomalyModal,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: NBButton(
                          label: 'LOCATE ME',
                          icon: Icons.my_location,
                          color: NB.yellow,
                          onTap: () {
                             // Will center map (map controller needed for true centering)
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: NBButton(
                          label: _checkinLoading ? '...' : 'CHECK-IN',
                          icon: Icons.check_circle,
                          color: _checkinLoading ? NB.textMuted : NB.blue,
                          onTap: _checkinLoading ? () {} : () => _handleCheckin(locationState),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: NBButton(
                          label: 'SAFE HOUSE',
                          icon: Icons.shield,
                          color: NB.violet,
                          onTap: () => _handleSafeHouse(locationState),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: NBButton(
                          label: _verifyLoading ? '...' : 'VERIFY',
                          icon: Icons.verified_user,
                          color: _verifyLoading ? NB.textMuted : NB.mint,
                          onTap: _verifyLoading ? () {} : () => _handleVerifyStay(locationState),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text('RECENT NEARBY INCIDENTS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2)),
                  const SizedBox(height: 8),
                  Expanded(
                    child: _incidents.isEmpty
                        ? const Center(child: Text('No recent incidents.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted)))
                        : ListView.builder(
                            itemCount: _incidents.length,
                            itemBuilder: (context, i) {
                              final inc = _incidents[i];
                              final sev = (inc['severity'] ?? 'low').toString().toLowerCase();
                              Color sevColor = Clay.moderate;
                              if (sev == 'critical') sevColor = Clay.critical;
                              if (sev == 'high') sevColor = Clay.high;

                              return ClayCard(
                                padding: const EdgeInsets.all(12),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 12,
                                      height: 12,
                                      decoration: BoxDecoration(color: sevColor, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(inc['title'] ?? 'Incident', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.text)),
                                          Text(inc['status'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted)),
                                        ],
                                      ),
                                    )
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: _buildSosButton(locationState),
    );
  }

  Widget _buildSafetyBanner(LocationState state) {
    if (state.error != null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(8),
        color: Clay.moderate,
        child: Text('GPS Error: ${state.error}', style: const TextStyle(color: Clay.text, fontWeight: FontWeight.w700)),
      );
    }

    final bg = state.isInSafeZone ? Clay.safe : Clay.high;
    final text = state.isInSafeZone ? 'You are in a safe zone' : 'High risk region';
    final desc = state.currentZone != null ? state.currentZone!['name'] : 'Unknown Zone';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        border: Border(bottom: BorderSide(color: Clay.border, width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11)),
          Text(desc, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildMap(LocationState state) {
    final currentPos = LatLng(state.position!.latitude, state.position!.longitude);

    final List<Polygon> polygons = _zones.map((z) {
      if (z['boundary'] != null && z['boundary']['coordinates'] != null) {
        final coords = z['boundary']['coordinates'][0] as List;
        final points = coords.map((c) => LatLng(c[1], c[0])).toList();
        final isSafe = z['risk_level'] == 'safe';
        return Polygon(
          points: points,
          color: isSafe ? Clay.safe.withOpacity(0.2) : Clay.high.withOpacity(0.2),
          borderColor: isSafe ? Clay.safe : Clay.high,
          borderStrokeWidth: 2,
        );
      }
      return Polygon(points: []);
    }).where((p) => p.points.isNotEmpty).toList();

    return FlutterMap(
      options: MapOptions(
        initialCenter: currentPos,
        initialZoom: 15,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.example.trackmate_app',
        ),
        PolygonLayer(polygons: polygons),
        MarkerLayer(
          markers: [
            Marker(
              point: currentPos,
              width: 40,
              height: 40,
              child: AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Clay.primary.withOpacity(0.2),
                      boxShadow: [
                        BoxShadow(
                          color: Clay.primary.withOpacity(0.4),
                          blurRadius: _pulseAnimation.value,
                          spreadRadius: _pulseAnimation.value / 2,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Clay.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSosButton(LocationState locState) {
    return GestureDetector(
      onLongPress: () {
        _sosPressCount = 0;
        _triggerSos(locState);
      },
      onTap: () => _handleSosPress(locState),
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Container(
            width: 72,
            height: 72,
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Clay.critical,
              boxShadow: [
                const BoxShadow(color: Color(0x401B1D2A), offset: Offset(4, 4), blurRadius: 10),
                if (_isSosActive)
                  BoxShadow(
                    color: Clay.critical.withOpacity(0.7),
                    blurRadius: _pulseAnimation.value * 2,
                    spreadRadius: _pulseAnimation.value,
                  ),
              ],
            ),
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.warning_rounded, color: Colors.white, size: 28),
                Text('SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
              ],
            ),
          );
        },
      ),
    );
  }
}
