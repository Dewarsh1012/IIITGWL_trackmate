import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final Map<String, dynamic>? user;
  final String? error;
  final String? blockchainId;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.error,
    this.blockchainId,
  });

  String get role => user?['role'] ?? 'tourist';
  String get fullName => user?['full_name'] ?? 'User';
  String get userId => user?['_id'] ?? user?['id'] ?? '';

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    Map<String, dynamic>? user,
    String? error,
    String? blockchainId,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: error,
      blockchainId: blockchainId ?? this.blockchainId,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future.microtask(() => checkSession());
    return AuthState(isLoading: true);
  }

  Future<void> checkSession() async {
    state = state.copyWith(isLoading: true);
    final token = await ApiClient.getToken();

    if (token != null) {
      try {
        final res = await ApiClient.get('/auth/me');
        if (res['success'] == true && res['data'] != null) {
          final user = res['data'] as Map<String, dynamic>;
          await ApiClient.saveUserProfile(user);
          await SocketService.instance.connect();
          state = state.copyWith(
            isLoading: false,
            isAuthenticated: true,
            user: user,
          );
          return;
        }
      } catch (_) {
        await ApiClient.clearToken();
      }
    }
    state = state.copyWith(isLoading: false, isAuthenticated: false);
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await ApiClient.post('/auth/login', {
        'email': email,
        'password': password,
      });

      if (res['success'] == true && res['data'] != null) {
        final data = res['data'];
        final token = data['accessToken'] as String;
        final user = data['user'] as Map<String, dynamic>;

        await ApiClient.setToken(token);
        await ApiClient.saveUserProfile(user);
        await SocketService.instance.connect();

        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: user,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res['message'] ?? 'Login failed',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> register(Map<String, dynamic> payload) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await ApiClient.post('/auth/register', payload);

      if (res['success'] == true && res['data'] != null) {
        final data = res['data'];
        final token = data['accessToken'] as String;
        final user = data['user'] as Map<String, dynamic>;
        final blockchainId = data['blockchainId'] as String?;

        await ApiClient.setToken(token);
        await ApiClient.saveUserProfile(user);
        await SocketService.instance.connect();

        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: user,
          blockchainId: blockchainId,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res['message'] ?? 'Registration failed',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    SocketService.instance.disconnect();
    await ApiClient.clearToken();
    state = AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
