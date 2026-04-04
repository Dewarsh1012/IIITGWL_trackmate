import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter/foundation.dart';
import 'api_client.dart';

class SocketService {
  static SocketService? _instance;
  io.Socket? _socket;
  String? _token;
  Map<String, dynamic>? _identity;

  SocketService._();

  static SocketService get instance {
    _instance ??= SocketService._();
    return _instance!;
  }

  io.Socket? get socket => _socket;
  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    _token = await ApiClient.getToken();
    if (_token == null) return;

    // Ensure old socket instance does not leak listeners.
    disconnect();

    final url = ApiClient.socketUrl;
    debugPrint('[Socket] Connecting to $url');

    _socket = io.io(url, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': _token},
      'forceNew': true,
    });

    _socket!.onConnect((_) {
      debugPrint('[Socket] Connected');
      _joinIdentityRooms();
    });

    _socket!.onDisconnect((_) {
      debugPrint('[Socket] Disconnected');
    });

    _socket!.onError((data) {
      debugPrint('[Socket] Error: $data');
    });

    _socket!.connect();
  }

  void updateIdentity(Map<String, dynamic>? user) {
    _identity = user;
    _joinIdentityRooms();
  }

  void _joinIdentityRooms() {
    if (!isConnected || _identity == null) return;

    final userId = _identity!['_id']?.toString() ?? _identity!['id']?.toString();
    final role = (_identity!['role'] ?? '').toString().toLowerCase();
    final wardRaw = _identity!['ward'];
    final wardId = wardRaw is Map<String, dynamic>
        ? wardRaw['_id']?.toString()
        : wardRaw?.toString();

    if (userId == null || userId.isEmpty) return;

    if (role == 'authority') {
      _socket?.emit('join:authority');
    } else if (role == 'tourist') {
      _socket?.emit('join:tourist', userId);
    } else if (role == 'resident') {
      _socket?.emit('join:resident', userId);
    } else if (role == 'business') {
      _socket?.emit('join:business', userId);
    }

    _socket?.emit('join:user', userId);

    if (wardId != null && wardId.isNotEmpty) {
      _socket?.emit('join:ward', wardId);
    }
  }

  void joinRoom(String room) {
    if (!isConnected) return;
    if (room.startsWith('incident_')) {
      _socket?.emit('join:incident', room.replaceFirst('incident_', ''));
      return;
    }
    if (room.startsWith('zone_')) {
      _socket?.emit('join:zone', room.replaceFirst('zone_', ''));
      return;
    }
    _socket?.emit('join:user', room);
  }

  void emit(String event, dynamic data) {
    _socket?.emit(event, data);
  }

  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  void off(String event) {
    _socket?.off(event);
  }

  void disconnect() {
    _identity = null;
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
