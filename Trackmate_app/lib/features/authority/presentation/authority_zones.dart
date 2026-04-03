import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/nb_widgets.dart';
import '../../../core/network/api_client.dart';

class AuthorityZonesPage extends ConsumerStatefulWidget {
  const AuthorityZonesPage({super.key});

  @override
  ConsumerState<AuthorityZonesPage> createState() => _AuthorityZonesPageState();
}

class _AuthorityZonesPageState extends ConsumerState<AuthorityZonesPage> {
  List<dynamic> _zones = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchZones();
  }

  Future<void> _fetchZones() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.get('/zones');
      if (res['success'] == true && mounted) {
        setState(() => _zones = res['data'] ?? []);
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('Zone Management', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.white)),
        backgroundColor: NB.black,
        iconTheme: const IconThemeData(color: NB.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: NB.black))
          : _zones.isEmpty
              ? const Center(child: Text('No zones configured.', style: TextStyle(fontWeight: FontWeight.bold)))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _zones.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    final z = _zones[i];
                    final isSafe = z['risk_level'] == 'safe';
                    return NBCard(
                      color: NB.white,
                      topBorderColor: isSafe ? NB.mint : NB.red,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(z['name'] ?? 'Untitled Zone', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                              NBBadge(label: z['risk_level'].toString().toUpperCase(), color: isSafe ? NB.mint : NB.red, textColor: isSafe ? NB.black : NB.white),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(z['description'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: NB.textSecondary)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.people, size: 14, color: NB.textMuted),
                              const SizedBox(width: 4),
                              Text('${z['current_capacity'] ?? 0} active users', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: NB.textMuted)),
                            ],
                          )
                        ],
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: NB.yellow,
        shape: RoundedRectangleBorder(side: const BorderSide(color: NB.black, width: 3), borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add, color: NB.black),
        onPressed: () {
          // Future: Open map to draw zone polygon
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Zone creation coming soon')));
        },
      ),
    );
  }
}
