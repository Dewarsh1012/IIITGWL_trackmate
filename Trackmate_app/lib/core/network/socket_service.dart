import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter/foundation.dart';
import 'api_client.dart';

class SocketService {
  static SocketService? _instance;
  io.Socket? _socket;
  String? _token;

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
    });

    _socket!.onDisconnect((_) {
      debugPrint('[Socket] Disconnected');
    });

    _socket!.onError((data) {
      debugPrint('[Socket] Error: $data');
    });

    _socket!.connect();
  }

  void joinRoom(String room) {
    _socket?.emit('join_room', room);
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
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
