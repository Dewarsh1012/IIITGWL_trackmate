import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/location_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/nb_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';

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
    } catch (e) {
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
    } catch (e) {
      // ignore
    }
  }

  Future<void> _triggerSos(LocationState locState) async {
    setState(() => _isSosActive = true);
    
    try {
      // POST incident
      final body = {
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
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SOS Alert Dispatched to Authorities!'), backgroundColor: AppColors.emergencyRed));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send SOS: $e'), backgroundColor: NB.black));
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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Tap ${3 - _sosPressCount} more times to trigger SOS'),
        duration: const Duration(seconds: 2),
      ));
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
      backgroundColor: NB.cream,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 20, right: 20, top: 20),
          child: StatefulBuilder(
            builder: (context, setModalState) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('REPORT ANOMALY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                  const Divider(color: NB.black, thickness: 3),
                  const SizedBox(height: 16),
                  
                  const NBLabel('INCIDENT TITLE'),
                  NBInput(controller: titleCtrl, hint: 'Brief title...'),
                  const SizedBox(height: 12),
                  
                  const NBLabel('DESCRIPTION'),
                  NBInput(controller: descCtrl, hint: 'What happened?', maxLines: 3),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const NBLabel('TYPE'),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(border: Border.all(color: NB.black, width: 3), color: NB.white, boxShadow: const [BoxShadow(color: NB.black, offset: Offset(2, 2))]),
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
                                )
                              )
                            )
                          ]
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const NBLabel('SEVERITY'),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(border: Border.all(color: NB.black, width: 3), color: NB.white, boxShadow: const [BoxShadow(color: NB.black, offset: Offset(2, 2))]),
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
                                )
                              )
                            )
                          ]
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),
                  NBButton(
                    label: 'SUBMIT REPORT',
                    onTap: () async {
                      if (titleCtrl.text.isEmpty || descCtrl.text.isEmpty) return;
                      final locState = ref.read(locationProvider);
                      final body = {
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
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Incident reported successfully!')));
                          _fetchIncidents();
                        }
                      } catch (e) {
                         // show error
                         if (mounted) {
                           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                         }
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                ],
              );
            }
          ),
        );
      }
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
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('Tourist Dashboard', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.black)),
        backgroundColor: NB.blue,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: NB.black),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (mounted) context.go('/auth');
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: Container(color: NB.black, height: 4),
        ),
      ),
      body: Column(
        children: [
          // Header info
          Container(
            padding: const EdgeInsets.all(16),
            color: NB.white,
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: NB.black, width: 3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Welcome, ${authState.fullName}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                    const SizedBox(height: 4),
                    NBBadge(label: authState.user?['blockchain_id'] ?? 'NO_ID', color: NB.yellow),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('SAFETY SCORE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: NB.textMuted)),
                    Text('${authState.user?['safety_score'] ?? 100}%', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: NB.mint)),
                  ],
                )
              ],
            ),
          ),
        
          _buildSafetyBanner(locationState),
          
          // MAP
          Expanded(
            flex: 3,
            child: locationState.position == null 
              ? const Center(child: CircularProgressIndicator(color: NB.black))
              : _buildMap(locationState),
          ),
          
          // Action Buttons + Incidents
          Expanded(
            flex: 2,
            child: Container(
              color: NB.cream,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: NBButton(
                          label: 'REPORT ANOMALY',
                          icon: Icons.warning_amber_rounded,
                          color: NB.white,
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
                      ? const Center(child: Text('No recent incidents.', style: TextStyle(fontWeight: FontWeight.bold, color: NB.textMuted)))
                      : ListView.builder(
                          itemCount: _incidents.length,
                          itemBuilder: (context, i) {
                            final inc = _incidents[i];
                            return NBCard(
                              padding: const EdgeInsets.all(12),
                              borderWidth: 2,
                              color: NB.white,
                              child: Row(
                                children: [
                                  Container(
                                    width: 12, height: 12,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: inc['severity'] == 'critical' ? NB.critical : (inc['severity'] == 'high' ? NB.red : NB.orange),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(inc['title'] ?? 'Incident', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                        Text(inc['status'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: NB.textMuted)),
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
        color: NB.orange,
        child: Text('GPS Error: ${state.error}', style: const TextStyle(color: NB.black, fontWeight: FontWeight.bold)),
      );
    }
    
    final bg = state.isInSafeZone ? NB.mint : NB.red;
    final text = state.isInSafeZone ? 'YOU ARE IN A SAFE ZONE' : 'HIGH RISK REGION';
    final desc = state.currentZone != null ? state.currentZone!['name'] : 'Unknown Zone';
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        border: const Border(bottom: BorderSide(color: NB.black, width: 3))
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(text, style: TextStyle(color: state.isInSafeZone ? NB.black : NB.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2)),
          Text(desc, style: TextStyle(color: state.isInSafeZone ? NB.black : NB.white, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      )
    );
  }

  Widget _buildMap(LocationState state) {
    final LatLng currentPos = LatLng(state.position!.latitude, state.position!.longitude);

    final List<Polygon> polygons = _zones.map((z) {
      if (z['boundary'] != null && z['boundary']['coordinates'] != null) {
        final coords = z['boundary']['coordinates'][0] as List;
        final points = coords.map((c) => LatLng(c[1], c[0])).toList();
        final isSafe = z['risk_level'] == 'safe';
        return Polygon(
          points: points,
          color: isSafe ? NB.mint.withOpacity(0.3) : NB.red.withOpacity(0.3),
          borderColor: isSafe ? NB.mint : NB.red,
          borderStrokeWidth: 2,
        );
      }
      return Polygon(points: []);
    }).where((p) => p.points.isNotEmpty).toList();

    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: NB.black, width: 3)),
      ),
      child: FlutterMap(
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
                        color: AppColors.trustBlue.withOpacity(0.4),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.trustBlue.withOpacity(0.6),
                            blurRadius: _pulseAnimation.value,
                            spreadRadius: _pulseAnimation.value / 2,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Container(
                          width: 15,
                          height: 15,
                          decoration: BoxDecoration(
                            color: AppColors.trustBlue,
                            shape: BoxShape.circle,
                            border: Border.all(color: NB.white, width: 2),
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
      ),
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
              color: NB.red,
              border: Border.all(color: NB.black, width: 3),
              boxShadow: [
                BoxShadow(
                  color: NB.black,
                  offset: const Offset(4, 4),
                ),
                if (_isSosActive)
                  BoxShadow(
                    color: NB.red.withOpacity(0.8),
                    blurRadius: _pulseAnimation.value * 2,
                    spreadRadius: _pulseAnimation.value,
                  ),
              ],
            ),
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.warning_rounded, color: NB.white, size: 28),
                Text('SOS', style: TextStyle(color: NB.white, fontWeight: FontWeight.w900, fontSize: 12)),
              ],
            ),
          );
        },
      ),
    );
  }
}
