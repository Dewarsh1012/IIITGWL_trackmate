import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../auth/presentation/auth_screen.dart'; // for NB colors

class AuthorityDashboard extends ConsumerStatefulWidget {
  const AuthorityDashboard({super.key});

  @override
  ConsumerState<AuthorityDashboard> createState() => _AuthorityDashboardState();
}

class _AuthorityDashboardState extends ConsumerState<AuthorityDashboard> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('God-View Command', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.white)),
        backgroundColor: NB.black,
        iconTheme: const IconThemeData(color: NB.white),
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.notifications_active, color: NB.yellow), onPressed: () {}),
        ],
      ),
      body: Stack(
        children: [
          // Flutter Map Full Screen
          FlutterMap(
            options: MapOptions(
              initialCenter: const LatLng(27.5, 92.5), // Default to some region in NE India
              initialZoom: 13,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.trackmate_app',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: const LatLng(27.501, 92.502),
                    width: 30, height: 30,
                    child: Container(
                      decoration: BoxDecoration(color: NB.red, shape: BoxShape.circle, border: Border.all(color: NB.black, width: 2)),
                      child: const Icon(Icons.warning, size: 16, color: NB.white),
                    ),
                  )
                ],
              ),
            ],
          ),
          
          // Floating overlay panels (Live Alert Feed)
          Positioned(
            left: 20, right: 20, bottom: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: NB.white,
                border: Border.all(color: NB.black, width: 3),
                boxShadow: const [BoxShadow(color: NB.black, offset: Offset(5, 5))],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('LIVE INCIDENT ALERTS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5, color: NB.red)),
                  const Divider(color: NB.black, thickness: 3),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(width: 12, height: 12, decoration: const BoxDecoration(color: NB.red, shape: BoxShape.circle)),
                      const SizedBox(width: 10),
                      const Expanded(child: Text('SOS Triggered: Tawang Sector 4', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14))),
                      const Text('Jst now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.grey)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
