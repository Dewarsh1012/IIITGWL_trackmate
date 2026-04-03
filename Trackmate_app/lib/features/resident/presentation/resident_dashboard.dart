import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/nb_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';
import '../../../core/services/location_service.dart';

class ResidentDashboard extends ConsumerStatefulWidget {
  const ResidentDashboard({super.key});

  @override
  ConsumerState<ResidentDashboard> createState() => _ResidentDashboardState();
}

class _ResidentDashboardState extends ConsumerState<ResidentDashboard> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isSosActive = false;
  int _sosPressCount = 0;
  DateTime? _lastSosPress;

  Map<String, dynamic>? _wardData;
  List<dynamic> _incidents = [];
  List<dynamic> _zones = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
       vsync: this,
       duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.0, end: 20.0).animate(CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut));
    
    _fetchData();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    final authState = ref.read(authProvider);
    final wardId = authState.user?['ward']?['_id'] ?? authState.user?['ward'];
    
    try {
      if (wardId != null && wardId is String && wardId.isNotEmpty) {
        final wardRes = await ApiClient.get('/analytics/ward/$wardId');
        if (wardRes['success'] == true) {
          _wardData = wardRes['data'];
        }
        
        final incRes = await ApiClient.get('/incidents?ward=$wardId&limit=5');
        if (incRes['success'] == true) {
          _incidents = incRes['data'] ?? [];
        }
      } else {
         // general incidents if no ward
         final incRes = await ApiClient.get('/incidents?limit=5');
         if (incRes['success'] == true) {
           _incidents = incRes['data'] ?? [];
         }
      }

      final zoneRes = await ApiClient.get('/zones');
      if (zoneRes['success'] == true) {
        _zones = zoneRes['data'] ?? [];
      }
    } catch (e) {
      // ignore
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _triggerSos(LocationState locState) async {
    setState(() => _isSosActive = true);
    
    try {
      final body = {
        'title': 'Emergency SOS Alert - Resident',
        'description': 'Resident triggered panic button from mobile app.',
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
    String type = 'anomaly';
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
                  const Text('REPORT COMMUNITY ISSUE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                  const Divider(color: NB.black, thickness: 3),
                  const SizedBox(height: 16),
                  
                  const NBLabel('SUBJECT'),
                  NBInput(controller: titleCtrl, hint: 'e.g. Broken street light'),
                  const SizedBox(height: 12),
                  
                  const NBLabel('DETAILS'),
                  NBInput(controller: descCtrl, hint: 'Describe the issue...', maxLines: 3),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const NBLabel('CATEGORY'),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(border: Border.all(color: NB.black, width: 3), color: NB.white, boxShadow: const [BoxShadow(color: NB.black, offset: Offset(2, 2))]),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: type,
                                  isExpanded: true,
                                  onChanged: (v) => setModalState(() => type = v!),
                                  items: const [
                                    DropdownMenuItem(value: 'anomaly', child: Text('Anomaly')),
                                    DropdownMenuItem(value: 'infrastructure', child: Text('Infrastructure')),
                                    DropdownMenuItem(value: 'suspicious_activity', child: Text('Suspicious')),
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
                    label: 'SUBMIT',
                    onTap: () async {
                      if (titleCtrl.text.isEmpty || descCtrl.text.isEmpty) return;
                      final locState = ref.read(locationProvider);
                      final authState = ref.read(authProvider);
                      final wardId = authState.user?['ward']?['_id'] ?? authState.user?['ward'];
                      
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
                      if (wardId != null) {
                        body['ward'] = wardId;
                      }
                      
                      try {
                        await ApiClient.post('/incidents', body);
                        if (mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report submitted.')));
                          _fetchData();
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
            }
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(locationProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('Resident Dashboard', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.white)),
        backgroundColor: NB.mint,
        elevation: 0,
        iconTheme: const IconThemeData(color: NB.black),
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
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: NB.black))
        : Column(
            children: [
              // Ward Header
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
                        const Text('YOUR LOCAL WARD', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: NB.textMuted)),
                        Text(authState.user?['ward']?['name'] ?? 'Unassigned Ward', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('WARD SCORE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: NB.textMuted)),
                        Text('${_wardData?['safety_score'] ?? 100}%', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: NB.mint)),
                      ],
                    )
                  ],
                ),
              ),

              // Map
              if (locationState.position != null)
                Expanded(
                  flex: 2,
                  child: Container(
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: NB.black, width: 3)),
                    ),
                    child: _buildMap(locationState),
                  ),
                ),

              // Vitals & Incidents
              Expanded(
                flex: 3,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: NBStatCard(
                              label: 'ACTIVE ISSUES', 
                              value: '${_wardData?['open_incidents'] ?? 0}', 
                              color: NB.orange,
                              icon: Icons.assignment_late,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: NBStatCard(
                              label: 'ACTIVE CITIZENS', 
                              value: '${_wardData?['active_users_today'] ?? 0}', 
                              color: NB.blue,
                              icon: Icons.people,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      NBButton(
                        label: 'REPORT ISSUE',
                        icon: Icons.add_circle_outline,
                        color: NB.white,
                        onTap: _showReportAnomalyModal,
                      ),
                      
                      const SizedBox(height: 20),
                      const Text('WARD BULLETIN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2)),
                      const SizedBox(height: 12),
                      
                      if (_incidents.isEmpty)
                         const Center(child: Text('No active incidents in this ward.', style: TextStyle(fontWeight: FontWeight.bold, color: NB.textMuted)))
                      else
                        ..._incidents.map((inc) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: NBCard(
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
                                      Text(inc['title'] ?? 'Alert', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                      Text(inc['status'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: NB.textMuted)),
                                    ],
                                  ),
                                )
                              ],
                            ),
                          ),
                        )),
                    ],
                  ),
                ),
              ),
            ],
          ),
      floatingActionButton: _buildSosButton(locationState),
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

    return FlutterMap(
      options: MapOptions(
        initialCenter: currentPos,
        initialZoom: 14,
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
              width: 20,
              height: 20,
              child: Container(
                decoration: BoxDecoration(
                  color: NB.blue,
                  shape: BoxShape.circle,
                  border: Border.all(color: NB.white, width: 2),
                ),
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
            width: 64,
            height: 64,
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
                Icon(Icons.warning_rounded, color: NB.white, size: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}
