import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/nb_widgets.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';

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
      if (data['userId'] == widget.userId) {
        if (mounted) {
          setState(() {
            _liveLat = data['latitude'];
            _liveLng = data['longitude'];
          });
        }
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
      final res = await Future.wait([
        ApiClient.get('/profiles/${widget.userId}'),
        ApiClient.get('/locations/user/${widget.userId}?hours=48'),
        ApiClient.get('/incidents?reporter=${widget.userId}&limit=10'),
      ]);

      if (mounted) {
        setState(() {
          if (res[0]['success'] == true) _profile = res[0]['data'];
          if (res[1]['success'] == true) {
            _locations = res[1]['data'] ?? [];
            if (_locations.isNotEmpty) {
              _liveLat = _locations[0]['latitude'];
              _liveLng = _locations[0]['longitude'];
            }
          }
          if (res[2]['success'] == true) _incidents = res[2]['data'] ?? [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: NB.cream,
        appBar: AppBar(backgroundColor: NB.black, iconTheme: const IconThemeData(color: NB.white)),
        body: const Center(child: CircularProgressIndicator(color: NB.black)),
      );
    }

    if (_profile == null) {
      return Scaffold(
        backgroundColor: NB.cream,
        appBar: AppBar(backgroundColor: NB.black, iconTheme: const IconThemeData(color: NB.white)),
        body: const Center(child: Text('User not found.', style: TextStyle(fontWeight: FontWeight.bold))),
      );
    }

    final role = _profile!['role'] ?? 'tourist';
    Color accent = NB.blue;
    if (role == 'resident') accent = NB.mint;
    if (role == 'business') accent = NB.orange;

    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: Text(_profile!['full_name'] ?? 'User Profile', style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.white)),
        backgroundColor: NB.black,
        iconTheme: const IconThemeData(color: NB.white),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Meta
            Container(
              padding: const EdgeInsets.all(16),
              color: NB.white,
              decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: NB.black, width: 3))),
              child: Row(
                children: [
                  Container(
                    width: 56, height: 56,
                    decoration: BoxDecoration(color: accent, border: Border.all(color: NB.black, width: 2)),
                    alignment: Alignment.center,
                    child: Text(_profile!['full_name']?.substring(0, 1).toUpperCase() ?? '?', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: accent == NB.blue ? NB.white : NB.black)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_profile!['full_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            NBBadge(label: role.toString().toUpperCase(), color: accent, textColor: accent == NB.blue ? NB.white : NB.black),
                            const SizedBox(width: 8),
                            if (_profile!['is_verified'] == true) 
                              const Icon(Icons.verified, color: NB.mint, size: 18)
                          ],
                        )
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('${_profile!['safety_score'] ?? 0}%', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: (_profile!['safety_score'] ?? 0) >= 80 ? NB.mint : NB.orange)),
                      const Text('SAFETY SCORE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 8, color: NB.textMuted))
                    ],
                  )
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Contact
                  NBCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('CONTACT & ID', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.2, color: NB.textMuted)),
                        const Divider(color: NB.black, thickness: 2, height: 24),
                        _infoRow(Icons.email, _profile!['email'] ?? 'No email'),
                        const SizedBox(height: 8),
                        _infoRow(Icons.phone, _profile!['phone'] ?? 'No phone'),
                        const SizedBox(height: 8),
                        _infoRow(Icons.credit_card, _profile!['id_type'] != null ? '${_profile!['id_type'].toString().toUpperCase()} ...${_profile!['id_last_four']}' : 'No ID provided'),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(color: NB.cream, border: Border.all(color: NB.black, width: 2)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('BLOCKCHAIN ID', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10)),
                              const SizedBox(height: 2),
                              Text(_profile!['blockchain_id'] ?? 'NOT MINTED', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11, color: NB.blue, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Map
                  NBCard(
                    padding: EdgeInsets.zero,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: NB.black, width: 3)), color: NB.white),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('LIVE LOCATION', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.2)),
                              if (_liveLat != null)
                                Row(
                                  children: [
                                    Container(width: 8, height: 8, decoration: const BoxDecoration(color: NB.mint, shape: BoxShape.circle)),
                                    const SizedBox(width: 6),
                                    const Text('ONLINE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: NB.mint)),
                                  ],
                                )
                              else
                                const Text('OFFLINE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: NB.red)),
                            ],
                          ),
                        ),
                        SizedBox(
                          height: 250,
                          child: _liveLat == null 
                            ? Container(color: NB.cream, alignment: Alignment.center, child: const Text('No location feed', style: TextStyle(fontWeight: FontWeight.bold, color: NB.textMuted)))
                            : FlutterMap(
                                options: MapOptions(
                                  initialCenter: LatLng(_liveLat!, _liveLng!),
                                  initialZoom: 15,
                                ),
                                children: [
                                  TileLayer(
                                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                    userAgentPackageName: 'com.example.trackmate_app',
                                  ),
                                  MarkerLayer(
                                    markers: [
                                      Marker(
                                        point: LatLng(_liveLat!, _liveLng!),
                                        width: 20, height: 20,
                                        child: Container(decoration: BoxDecoration(color: accent, shape: BoxShape.circle, border: Border.all(color: NB.black, width: 2))),
                                      ),
                                    ],
                                  )
                                ],
                              ),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Incidents
                  const Text('REPORTED INCIDENTS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5, color: NB.black)),
                  const Divider(color: NB.black, thickness: 3),
                  const SizedBox(height: 12),
                  
                  if (_incidents.isEmpty)
                    const Center(child: Text('No incidents reported by this user.', style: TextStyle(fontWeight: FontWeight.bold, color: NB.textMuted)))
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
                            ),
                            NBBadge(label: inc['severity'].toString().toUpperCase(), color: inc['severity'] == 'critical' ? NB.critical : (inc['severity'] == 'high' ? NB.red : NB.orange), textColor: NB.white),
                          ],
                        ),
                      ),
                    )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: NB.textMuted),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: NB.black))),
      ],
    );
  }
}
