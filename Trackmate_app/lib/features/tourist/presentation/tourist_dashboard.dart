import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/services/location_service.dart';
import '../../../core/theme/app_colors.dart';

class TouristDashboard extends ConsumerStatefulWidget {
  const TouristDashboard({super.key});

  @override
  ConsumerState<TouristDashboard> createState() => _TouristDashboardState();
}

class _TouristDashboardState extends ConsumerState<TouristDashboard> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isSosActive = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1, milliseconds: 500),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.0, end: 20.0).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _triggerSos() {
    setState(() {
      _isSosActive = true;
    });
    
    // Auto-disable just for demo simulation.
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _isSosActive = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(locationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('TrackMate Dashboard'),
        actions: [
          IconButton(icon: const Icon(Icons.person), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          _buildSafetyBanner(locationState),
          Expanded(
            child: locationState.position == null 
              ? const Center(child: CircularProgressIndicator())
              : _buildMap(locationState),
          ),
        ],
      ),
      floatingActionButton: _buildSosButton(),
    );
  }

  Widget _buildSafetyBanner(LocationState state) {
    if (state.error != null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        color: AppColors.alertAmber,
        child: Text('GPS Error: \${state.error}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      );
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      color: AppColors.safeGreen,
      child: const Text('You are in a Safe Zone', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
    );
  }

  Widget _buildMap(LocationState state) {
    final LatLng currentPos = LatLng(state.position!.latitude, state.position!.longitude);

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
                        decoration: const BoxDecoration(
                          color: AppColors.trustBlue,
                          shape: BoxShape.circle,
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

  Widget _buildSosButton() {
    return GestureDetector(
      onLongPress: () {
        _triggerSos();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SOS Alert Dispatched to Authorities!'), backgroundColor: AppColors.emergencyRed));
      },
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.emergencyRed,
              boxShadow: [
                BoxShadow(
                  color: AppColors.emergencyRed.withOpacity(_isSosActive ? 0.8 : 0.4),
                  blurRadius: _isSosActive ? _pulseAnimation.value * 2 : 10,
                  spreadRadius: _isSosActive ? _pulseAnimation.value : 5,
                ),
              ],
            ),
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.warning, color: Colors.white, size: 28),
                Text('SOS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
          );
        },
      ),
    );
  }
}
