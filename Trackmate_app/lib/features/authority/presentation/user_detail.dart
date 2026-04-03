import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class UserDetailPage extends ConsumerStatefulWidget {
  final String userId;
  const UserDetailPage({super.key, required this.userId});

  @override
  ConsumerState<UserDetailPage> createState() => _UserDetailPageState();
}

class _UserDetailPageState extends ConsumerState<UserDetailPage> {
  Map<String, dynamic>? _profile;
  List<dynamic> _locations = [];
  List<dynamic> _incidents = [];
  bool _isLoading = true;

  double? _liveLat;
  double? _liveLng;

  @override
  void initState() {
    super.initState();
    _fetchData();
    _setupSockets();
  }

  void _setupSockets() {
    SocketService.instance.on('location:update', (data) {
      if (data == null) return;
      if (data['userId'] == widget.userId && mounted) {
        setState(() {
          _liveLat = (data['latitude'] as num?)?.toDouble();
          _liveLng = (data['longitude'] as num?)?.toDouble();
        });
      }
    });
  }

  @override
  void dispose() {
    SocketService.instance.off('location:update');
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      final results = await Future.wait([
        ApiClient.get('/profiles/${widget.userId}'),
        ApiClient.get('/locations/user/${widget.userId}?hours=48'),
        ApiClient.get('/incidents?reporter=${widget.userId}&limit=10'),
      ]);

      if (!mounted) return;

      setState(() {
        if (results[0]['success'] == true) _profile = results[0]['data'];
        if (results[1]['success'] == true) {
          _locations = results[1]['data'] ?? [];
          if (_locations.isNotEmpty) {
            _liveLat = (_locations[0]['latitude'] as num?)?.toDouble();
            _liveLng = (_locations[0]['longitude'] as num?)?.toDouble();
          }
        }
        if (results[2]['success'] == true) _incidents = results[2]['data'] ?? [];
        _isLoading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _roleColor(String role) {
    if (role == 'resident') return Clay.safe;
    if (role == 'business') return Clay.moderate;
    return Clay.primary;
  }

  Color _severityColor(String severity) {
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
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Clay.bg,
        appBar: AppBar(backgroundColor: Clay.surface, iconTheme: const IconThemeData(color: Clay.text)),
        body: const Center(child: CircularProgressIndicator(color: Clay.primary)),
      );
    }

    if (_profile == null) {
      return Scaffold(
        backgroundColor: Clay.bg,
        appBar: AppBar(backgroundColor: Clay.surface, iconTheme: const IconThemeData(color: Clay.text)),
        body: const Center(
          child: Text('User not found.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted)),
        ),
      );
    }

    final role = (_profile!['role'] ?? 'tourist').toString();
    final accent = _roleColor(role);
    final safety = _profile!['safety_score'] ?? 0;

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        title: Text(
          _profile!['full_name'] ?? 'User Profile',
          style: const TextStyle(fontWeight: FontWeight.w800, color: Clay.text),
        ),
        backgroundColor: Clay.surface,
        iconTheme: const IconThemeData(color: Clay.text),
      ),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          ClayCard(
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: accent.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    (_profile!['full_name'] ?? '?').toString().substring(0, 1).toUpperCase(),
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 24, color: accent),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_profile!['full_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Clay.text)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          ClayBadge(label: role.toUpperCase(), color: accent.withValues(alpha: 0.14), textColor: accent),
                          const SizedBox(width: 8),
                          if (_profile!['is_verified'] == true)
                            const Icon(Icons.verified, color: Clay.safe, size: 18),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '$safety%',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 24,
                        color: safety >= 80 ? Clay.safe : Clay.moderate,
                      ),
                    ),
                    const Text('SAFETY SCORE', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 9, color: Clay.textMuted)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          ClayCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('CONTACT & ID', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.6, color: Clay.textMuted)),
                const SizedBox(height: 12),
                _infoRow(Icons.email, _profile!['email'] ?? 'No email'),
                const SizedBox(height: 8),
                _infoRow(Icons.phone, _profile!['phone'] ?? 'No phone'),
                const SizedBox(height: 8),
                _infoRow(
                  Icons.credit_card,
                  _profile!['id_type'] != null
                      ? '${_profile!['id_type'].toString().toUpperCase()} ...${_profile!['id_last_four']}'
                      : 'No ID provided',
                ),
                const SizedBox(height: 12),
                ClayInset(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('BLOCKCHAIN ID', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                      const SizedBox(height: 2),
                      Text(
                        _profile!['blockchain_id'] ?? 'NOT MINTED',
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.primary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          ClayCard(
            padding: const EdgeInsets.all(0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('LIVE LOCATION', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text)),
                      if (_liveLat != null)
                        const Text('ONLINE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 10, color: Clay.safe))
                      else
                        const Text('OFFLINE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 10, color: Clay.high)),
                    ],
                  ),
                ),
                SizedBox(
                  height: 260,
                  child: _liveLat == null
                      ? const Center(
                          child: Text(
                            'No location feed',
                            style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted),
                          ),
                        )
                      : FlutterMap(
                          options: MapOptions(initialCenter: LatLng(_liveLat!, _liveLng!), initialZoom: 15),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.example.trackmate_app',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(_liveLat!, _liveLng!),
                                  width: 22,
                                  height: 22,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: accent,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const Text('REPORTED INCIDENTS', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, letterSpacing: 0.6, color: Clay.text)),
          const SizedBox(height: 8),
          if (_incidents.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('No incidents reported by this user.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted)),
              ),
            )
          else
            ..._incidents.map((incident) {
              final severity = (incident['severity'] ?? 'low').toString().toLowerCase();
              final color = _severityColor(severity);
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: ClayCard(
                  child: Row(
                    children: [
                      Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(incident['title'] ?? 'Alert', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text)),
                            Text(incident['status'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted)),
                          ],
                        ),
                      ),
                      ClayBadge(
                        label: severity.toUpperCase(),
                        color: color.withValues(alpha: 0.14),
                        textColor: color,
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        const Icon(Icons.circle, size: 6, color: Clay.textMuted),
        const SizedBox(width: 8),
        Icon(icon, size: 15, color: Clay.textMuted),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.text))),
      ],
    );
  }
}
