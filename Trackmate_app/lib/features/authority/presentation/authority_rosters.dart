import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

class AuthorityRostersPage extends ConsumerStatefulWidget {
  final String role;
  const AuthorityRostersPage({super.key, required this.role});

  @override
  ConsumerState<AuthorityRostersPage> createState() => _AuthorityRostersPageState();
}

class _AuthorityRostersPageState extends ConsumerState<AuthorityRostersPage> {
  List<dynamic> _profiles = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfiles();
  }

  @override
  void didUpdateWidget(AuthorityRostersPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.role != widget.role) {
      _fetchProfiles();
    }
  }

  Future<void> _fetchProfiles() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.get('/profiles?role=${widget.role}&limit=50');
      if (res['success'] == true && mounted) {
        setState(() => _profiles = res['data'] ?? []);
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  (String, Color) _titleAndAccent() {
    if (widget.role == 'tourist') return ('Tourist Roster', Clay.primary);
    if (widget.role == 'resident') return ('Resident Directory', Clay.safe);
    if (widget.role == 'business') return ('Registered Businesses', Clay.moderate);
    return ('Users', Clay.primary);
  }

  @override
  Widget build(BuildContext context) {
    final (title, accent) = _titleAndAccent();

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        backgroundColor: Clay.surface,
        iconTheme: const IconThemeData(color: Clay.text),
        actions: [
          IconButton(onPressed: _fetchProfiles, icon: const Icon(Icons.refresh, color: Clay.text)),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : _profiles.isEmpty
              ? Center(
                  child: Text(
                    'No ${widget.role}s found.',
                    style: const TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: _profiles.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final p = _profiles[i];
                    final name = p['full_name'] ?? 'No Name';
                    final email = p['email'] ?? '';
                    final blockchainId = p['blockchain_id'] ?? 'NO_CHAIN_ID';
                    final safety = p['safety_score'] ?? 0;
                    final isVerified = p['is_verified'] == true;

                    return InkWell(
                      onTap: () => context.push('/authority/user/${p['_id']}'),
                      child: ClayCard(
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: accent.withValues(alpha: 0.16),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                name.toString().isNotEmpty ? name.toString().substring(0, 1).toUpperCase() : '?',
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: accent),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Clay.text)),
                                  const SizedBox(height: 2),
                                  Text(email, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textSecondary)),
                                  const SizedBox(height: 6),
                                  ClayBadge(label: blockchainId, color: Clay.surfaceAlt, textColor: Clay.textMuted),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '$safety%',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 16,
                                    color: safety >= 80 ? Clay.safe : Clay.moderate,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Icon(
                                  isVerified ? Icons.verified : Icons.pending,
                                  color: isVerified ? Clay.safe : Clay.moderate,
                                  size: 16,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
