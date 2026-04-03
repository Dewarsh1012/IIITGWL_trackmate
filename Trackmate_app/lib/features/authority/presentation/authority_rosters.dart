import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/nb_widgets.dart';
import '../../../core/network/api_client.dart';

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
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    String title = 'Users';
    Color accent = NB.blue;
    if (widget.role == 'tourist') { title = 'Tourist Roster'; accent = NB.blue; }
    if (widget.role == 'resident') { title = 'Resident Directory'; accent = NB.mint; }
    if (widget.role == 'business') { title = 'Registered Businesses'; accent = NB.orange; }

    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.white)),
        backgroundColor: NB.black,
        iconTheme: const IconThemeData(color: NB.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: NB.black))
          : _profiles.isEmpty
              ? Center(child: Text('No ${widget.role}s found.', style: const TextStyle(fontWeight: FontWeight.bold)))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _profiles.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final p = _profiles[i];
                    return MouseRegion(
                      cursor: SystemMouseCursors.click,
                      child: GestureDetector(
                        onTap: () => context.push('/authority/user/${p['_id']}'),
                        child: NBCard(
                          color: NB.white,
                          borderWidth: 2,
                          child: Row(
                            children: [
                              Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(color: accent, border: Border.all(color: NB.black, width: 2)),
                                alignment: Alignment.center,
                                child: Text(p['full_name']?.substring(0, 1).toUpperCase() ?? '?', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: accent == NB.blue ? NB.white : NB.black)),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p['full_name'] ?? 'No Name', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                                    const SizedBox(height: 2),
                                    Text(p['email'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: NB.textSecondary)),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: NB.cream, border: Border.all(color: NB.black)),
                                      child: Text(p['blockchain_id'] ?? 'NO_CHAIN_ID', style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: FontWeight.bold)),
                                    )
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text('${p['safety_score'] ?? 0}%', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: (p['safety_score'] ?? 0) >= 80 ? NB.mint : NB.orange)),
                                  const SizedBox(height: 4),
                                  if (p['is_verified'] == true)
                                    const Icon(Icons.verified, color: NB.mint, size: 16)
                                  else
                                    const Icon(Icons.pending, color: NB.orange, size: 16),
                                ],
                              )
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
