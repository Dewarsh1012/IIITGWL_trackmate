import 'package:geolocator/geolocator.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../network/api_client.dart';
import '../network/socket_service.dart';

class LocationState {
  final Position? position;
  final bool hasPermission;
  final String? error;
  final bool isInSafeZone;
  final Map<String, dynamic>? currentZone;

  LocationState({
    this.position,
    this.hasPermission = false,
    this.error,
    this.isInSafeZone = false,
    this.currentZone,
  });

  LocationState copyWith({
    Position? position,
    bool? hasPermission,
    String? error,
    bool? isInSafeZone,
    Map<String, dynamic>? currentZone,
  }) {
    return LocationState(
      position: position ?? this.position,
      hasPermission: hasPermission ?? this.hasPermission,
      error: error,
      isInSafeZone: isInSafeZone ?? this.isInSafeZone,
      currentZone: currentZone ?? this.currentZone,
    );
  }
}

class LocationNotifier extends Notifier<LocationState> {
  StreamSubscription<Position>? _positionStream;
  Timer? _syncTimer;
  Position? _lastPosition;

  @override
  LocationState build() {
    ref.onDispose(() {
      _positionStream?.cancel();
      _syncTimer?.cancel();
    });
    Future.microtask(() => _initLocation());
    return LocationState();
  }

  Future<void> _initLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      state = state.copyWith(error: 'Location services are disabled.');
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        state = state.copyWith(error: 'Location permissions are denied');
        return;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      state = state.copyWith(error: 'Location permissions are permanently denied, we cannot request permissions.');
      return;
    }

    state = state.copyWith(hasPermission: true, error: null);

    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      )
    ).listen((Position position) {
      _lastPosition = position;
      state = state.copyWith(position: position, error: null);
      
      // Emit socket for live tracking
      SocketService.instance.emit('location_update', {
        'latitude': position.latitude,
        'longitude': position.longitude,
      });
    });

    // HTTP sync every 30s
    _syncTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _syncLocationWithBackend();
    });

    // Also do an initial sync if we have a position
    if (_lastPosition != null) {
      _syncLocationWithBackend();
    } else {
       // get initial position immediately
      try {
        final pos = await Geolocator.getCurrentPosition();
        _lastPosition = pos;
        state = state.copyWith(position: pos, error: null);
        _syncLocationWithBackend();
      } catch (e) {
        // ignore
      }
    }
  }

  Future<void> _syncLocationWithBackend() async {
    if (_lastPosition == null) return;
    try {
      final res = await ApiClient.post('/locations', {
        'latitude': _lastPosition!.latitude,
        'longitude': _lastPosition!.longitude,
        'accuracy_meters': _lastPosition!.accuracy,
        'speed': _lastPosition!.speed,
        'heading': _lastPosition!.heading,
        'source': 'gps',
      });
      
      if (res['success'] == true && res['data'] != null) {
        state = state.copyWith(
          isInSafeZone: res['data']['is_in_safe_zone'] ?? false,
          currentZone: res['data']['zone'],
        );
      }
    } catch (e) {
      // ignore
    }
  }
}

final locationProvider = NotifierProvider<LocationNotifier, LocationState>(() {
  return LocationNotifier();
});
