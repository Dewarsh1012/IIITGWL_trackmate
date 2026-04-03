import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';
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
        final incRes = await ApiClient.get('/incidents?limit=5');
        if (incRes['success'] == true) {
          _incidents = incRes['data'] ?? [];
        }
      }

      final zoneRes = await ApiClient.get('/zones');
      if (zoneRes['success'] == true) {
        _zones = zoneRes['data'] ?? [];
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _triggerSos(LocationState locState) async {
    setState(() => _isSosActive = true);

    try {
      final body = <String, dynamic>{
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
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SOS Alert dispatched!'), backgroundColor: Clay.critical));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send SOS: $e'), backgroundColor: Clay.text));
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
    String type = 'anomaly';
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
                  const Text('Report Community Issue', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Clay.text)),
                  const SizedBox(height: 8),
                  const Divider(color: Clay.border, thickness: 1),
                  const SizedBox(height: 12),
                  const Text('Subject', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.textMuted)),
                  const SizedBox(height: 6),
                  ClayInput(controller: titleCtrl, hint: 'e.g. Broken street light'),
                  const SizedBox(height: 12),
                  const Text('Details', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.textMuted)),
                  const SizedBox(height: 6),
                  ClayInput(controller: descCtrl, hint: 'Describe the issue...', maxLines: 3),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Category', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.textMuted)),
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
                                    DropdownMenuItem(value: 'anomaly', child: Text('Anomaly')),
                                    DropdownMenuItem(value: 'infrastructure', child: Text('Infrastructure')),
                                    DropdownMenuItem(value: 'suspicious_activity', child: Text('Suspicious')),
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
                    label: 'Submit',
                    variant: ClayButtonVariant.primary,
                    onTap: () async {
                      if (titleCtrl.text.isEmpty || descCtrl.text.isEmpty) return;
                      final locState = ref.read(locationProvider);
                      final authState = ref.read(authProvider);
                      final wardId = authState.user?['ward']?['_id'] ?? authState.user?['ward'];

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
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(locationProvider);
    final authState = ref.watch(authProvider);
    final wardName = authState.user?['ward']?['name'] ?? 'Unassigned Ward';

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        title: const Text('Resident Dashboard', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        backgroundColor: Clay.surface,
        elevation: 0,
        iconTheme: const IconThemeData(color: Clay.text),
        actions: [
          IconButton(
            icon: const Icon(Icons.feed_outlined, color: Clay.text),
            onPressed: () => context.push('/resident/feed'),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (authState.user?['ward'] == null)
                  ClayCard(
                    padding: const EdgeInsets.all(12),
                    child: const Text(
                      'No ward assigned. Showing general area data. Contact local authority to assign a ward.',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Clay.textMuted),
                    ),
                  ),
                if (authState.user?['ward'] == null) const SizedBox(height: 12),

                ClayCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Your Local Ward', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                          const SizedBox(height: 4),
                          Text(wardName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Clay.text)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Ward Score', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted)),
                          Text('${_wardData?['safety_score'] ?? 100}%', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Clay.safe)),
                        ],
                      )
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: ClayCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Active Issues', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                            const SizedBox(height: 6),
                            Text('${_wardData?['open_incidents'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: Clay.high)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ClayCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Active Citizens', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                            const SizedBox(height: 6),
                            Text('${_wardData?['active_users_today'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: Clay.primary)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                if (locationState.position != null)
                  ClayCard(
                    padding: EdgeInsets.zero,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: SizedBox(height: 240, child: _buildMap(locationState)),
                    ),
                  ),

                const SizedBox(height: 16),

                ClayButton(
                  label: 'Report Issue',
                  variant: ClayButtonVariant.primary,
                  onTap: _showReportAnomalyModal,
                ),

                const SizedBox(height: 16),

                const Text('Ward Bulletin', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text)),
                const SizedBox(height: 8),

                if (_incidents.isEmpty)
                  const Center(child: Text('No active incidents in this ward.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted)))
                else
                  ..._incidents.map((inc) {
                    final sev = (inc['severity'] ?? 'low').toString().toLowerCase();
                    Color sevColor = Clay.moderate;
                    if (sev == 'critical') sevColor = Clay.critical;
                    if (sev == 'high') sevColor = Clay.high;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ClayCard(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            Container(width: 12, height: 12, decoration: BoxDecoration(color: sevColor, shape: BoxShape.circle)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(inc['title'] ?? 'Alert', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.text)),
                                  Text(inc['status'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
      floatingActionButton: _buildSosButton(locationState),
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
              width: 26,
              height: 26,
              child: Container(
                decoration: BoxDecoration(
                  color: Clay.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
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
            width: 68,
            height: 68,
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
                Icon(Icons.warning_rounded, color: Colors.white, size: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}
