import 'package:geolocator/geolocator.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';

class LocationState {
  final Position? position;
  final bool hasPermission;
  final String? error;

  LocationState({this.position, this.hasPermission = false, this.error});

  LocationState copyWith({Position? position, bool? hasPermission, String? error}) {
    return LocationState(
      position: position ?? this.position,
      hasPermission: hasPermission ?? this.hasPermission,
      error: error,
    );
  }
}

class LocationNotifier extends Notifier<LocationState> {
  StreamSubscription<Position>? _positionStream;

  @override
  LocationState build() {
    ref.onDispose(() {
      _positionStream?.cancel();
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

    state = state.copyWith(hasPermission: true);

    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      )
    ).listen((Position position) {
      state = state.copyWith(position: position, error: null);
      _syncLocationWithBackend(position);
    });
  }

  void _syncLocationWithBackend(Position position) {
    // API Call to /api/v1/locations to sync the coordinates.
    // We would debounce this so it only sends every 30s as per specs.
  }


}

final locationProvider = NotifierProvider<LocationNotifier, LocationState>(() {
  return LocationNotifier();
});
