import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform, SocketException;

class ApiClient {
  static const String _defaultPort = '5001';
  static const String _apiPort = String.fromEnvironment('API_PORT', defaultValue: _defaultPort);
  static const String _apiBaseOverride = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  static const String _socketBaseOverride = String.fromEnvironment('SOCKET_BASE_URL', defaultValue: '');
  static const String _apiLanHost = String.fromEnvironment('API_LAN_HOST', defaultValue: '');
  static const bool _androidUseLocalhost = bool.fromEnvironment('ANDROID_USE_LOCALHOST', defaultValue: false);

  static String? _resolvedApiBase;
  static String? _resolvedSocketBase;

  static String get baseUrl {
    return _resolvedApiBase ?? _buildTargets().first.apiBase;
  }

  static String get socketUrl {
    return _resolvedSocketBase ?? _buildTargets().first.socketBase;
  }

  static String _normalizeApiBase(String raw) {
    var base = raw.trim();
    if (base.endsWith('/')) {
      base = base.substring(0, base.length - 1);
    }
    if (!base.endsWith('/api/v1')) {
      base = '$base/api/v1';
    }
    return base;
  }

  static String _normalizeSocketBase(String raw) {
    var base = raw.trim();
    if (base.endsWith('/')) {
      base = base.substring(0, base.length - 1);
    }
    if (base.endsWith('/api/v1')) {
      base = base.substring(0, base.length - 7);
    }
    return base;
  }

  static _ApiTarget _localhostTarget() {
    return _ApiTarget(
      apiBase: 'http://localhost:$_apiPort/api/v1',
      socketBase: 'http://localhost:$_apiPort',
    );
  }

  static _ApiTarget _androidEmulatorTarget() {
    return _ApiTarget(
      apiBase: 'http://10.0.2.2:$_apiPort/api/v1',
      socketBase: 'http://10.0.2.2:$_apiPort',
    );
  }

  static List<_ApiTarget> _buildTargets() {
    final overrideApi = _apiBaseOverride.trim();
    if (overrideApi.isNotEmpty) {
      final api = _normalizeApiBase(overrideApi);
      final socket = _socketBaseOverride.trim().isNotEmpty
          ? _normalizeSocketBase(_socketBaseOverride)
          : _normalizeSocketBase(api);
      return [
        _ApiTarget(apiBase: api, socketBase: socket),
      ];
    }

    if (kIsWeb) {
      return [_localhostTarget()];
    }

    try {
      if (Platform.isAndroid) {
        final targets = <_ApiTarget>[
          _androidUseLocalhost ? _localhostTarget() : _androidEmulatorTarget(),
          _androidUseLocalhost ? _androidEmulatorTarget() : _localhostTarget(),
        ];

        final lanHost = _apiLanHost.trim();
        if (lanHost.isNotEmpty) {
          final socket = 'http://$lanHost:$_apiPort';
          targets.add(_ApiTarget(apiBase: '$socket/api/v1', socketBase: socket));
        }

        final deduped = <_ApiTarget>[];
        final seen = <String>{};
        for (final t in targets) {
          if (seen.add(t.apiBase)) deduped.add(t);
        }
        return deduped;
      }
    } catch (_) {
      // ignore and use localhost fallback
    }

    return [_localhostTarget()];
  }

  static Future<dynamic> _requestWithFallback(
    String endpoint,
    Future<http.Response> Function(Uri uri, Map<String, String> headers) sender,
  ) async {
    final headers = await _getHeaders();
    Object? networkError;
    StackTrace? networkStack;

    for (final target in _buildTargets()) {
      final uri = Uri.parse('${target.apiBase}$endpoint');
      try {
        final response = await sender(uri, headers).timeout(const Duration(seconds: 10));
        _resolvedApiBase = target.apiBase;
        _resolvedSocketBase = target.socketBase;
        return _handleResponse(response);
      } on SocketException catch (e, st) {
        networkError = e;
        networkStack = st;
      } on TimeoutException catch (e, st) {
        networkError = e;
        networkStack = st;
      }
    }

    if (networkError != null) {
      Error.throwWithStackTrace(
        ApiException(
          'Unable to reach backend. For Android device, pass --dart-define=API_BASE_URL=http://<your-lan-ip>:5001/api/v1 or run adb reverse tcp:5001 tcp:5001 and --dart-define=ANDROID_USE_LOCALHOST=true.',
          0,
        ),
        networkStack!,
      );
    }

    throw ApiException('Request failed', 0);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_profile');
  }

  static Future<void> saveUserProfile(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_profile', jsonEncode(user));
  }

  static Future<Map<String, dynamic>?> getUserProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('user_profile');
    if (raw != null) return jsonDecode(raw);
    return null;
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<dynamic> get(String endpoint) async {
    return _requestWithFallback(
      endpoint,
      (uri, headers) => http.get(uri, headers: headers),
    );
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    return _requestWithFallback(
      endpoint,
      (uri, headers) => http.post(
        uri,
        headers: headers,
        body: jsonEncode(body),
      ),
    );
  }

  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    return _requestWithFallback(
      endpoint,
      (uri, headers) => http.patch(
        uri,
        headers: headers,
        body: jsonEncode(body),
      ),
    );
  }

  static Future<dynamic> put(String endpoint, Map<String, dynamic> body) async {
    return _requestWithFallback(
      endpoint,
      (uri, headers) => http.put(
        uri,
        headers: headers,
        body: jsonEncode(body),
      ),
    );
  }

  static Future<dynamic> delete(String endpoint) async {
    return _requestWithFallback(
      endpoint,
      (uri, headers) => http.delete(uri, headers: headers),
    );
  }

  static dynamic _handleResponse(http.Response response) {
    final body = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else if (response.statusCode == 401) {
      clearToken();
      throw ApiException('Session expired. Please login again.', 401);
    } else {
      final msg = body['message'] ?? 'Request failed';
      throw ApiException(msg, response.statusCode);
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}

class _ApiTarget {
  final String apiBase;
  final String socketBase;

  const _ApiTarget({required this.apiBase, required this.socketBase});
}
