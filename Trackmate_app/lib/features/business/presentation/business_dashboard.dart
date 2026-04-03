import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/network/api_client.dart';

class BusinessDashboard extends ConsumerStatefulWidget {
  const BusinessDashboard({super.key});

  @override
  ConsumerState<BusinessDashboard> createState() => _BusinessDashboardState();
}

class _BusinessDashboardState extends ConsumerState<BusinessDashboard> {
  final _verifyCtrl = TextEditingController();

  bool _isVerifying = false;
  Map<String, dynamic>? _verifiedUser;
  String? _verifyError;

  Map<String, dynamic>? _stats;
  List<dynamic> _incidents = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final statRes = await ApiClient.get('/analytics/summary');
      if (statRes['success'] == true) {
        _stats = statRes['data'];
      }

      final incRes = await ApiClient.get('/incidents?limit=5');
      if (incRes['success'] == true) {
        _incidents = incRes['data'] ?? [];
      }
    } catch (_) {
      // ignore
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleVerify() async {
    final id = _verifyCtrl.text.trim();
    if (id.isEmpty) return;

    setState(() {
      _isVerifying = true;
      _verifiedUser = null;
      _verifyError = null;
    });

    try {
      final res = await ApiClient.get('/businesses/verify-tourist/$id');
      if (res['success'] == true) {
        setState(() {
          _verifiedUser = res['data'];
        });
      } else {
        setState(() {
          _verifyError = 'User not found or not verified.';
        });
      }
    } catch (_) {
      setState(() {
        _verifyError = 'Verification failed: invalid ID.';
      });
    } finally {
      setState(() {
        _isVerifying = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        title: const Text('Business Dashboard', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        backgroundColor: Clay.surface,
        elevation: 0,
        iconTheme: const IconThemeData(color: Clay.text),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Clay.text),
            onPressed: () => context.push('/business/profile'),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Clay.text),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (mounted) context.go('/auth');
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Clay.primary))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                ClayCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Clay.primary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.store, color: Clay.primary),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(authState.fullName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Clay.text)),
                            const SizedBox(height: 4),
                            const Text('Verified Business', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Clay.textMuted)),
                          ],
                        ),
                      ),
                      ClayBadge(label: 'ACTIVE', color: Clay.safe.withOpacity(0.12), textColor: Clay.safe),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                const Text('Verify Tourist Identity', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text)),
                const SizedBox(height: 8),
                ClayCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      ClayInput(controller: _verifyCtrl, hint: 'Enter Blockchain ID'),
                      const SizedBox(height: 12),
                      ClayButton(
                        label: 'Verify',
                        variant: ClayButtonVariant.primary,
                        isLoading: _isVerifying,
                        onTap: _handleVerify,
                      ),
                      if (_verifyError != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Text(_verifyError!, style: const TextStyle(color: Clay.critical, fontWeight: FontWeight.w700)),
                        ),
                      if (_verifiedUser != null)
                        Container(
                          margin: const EdgeInsets.only(top: 16),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Clay.surfaceAlt,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Clay.border, width: 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: const [
                                  Icon(Icons.check_circle, color: Clay.safe, size: 18),
                                  SizedBox(width: 6),
                                  Text('Identity Verified', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.safe)),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text('Name: ${_verifiedUser!['full_name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              Text('Safety Score: ${_verifiedUser!['safety_score'] ?? 100}%', style: const TextStyle(fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              if (_verifiedUser!['id_type'] != null)
                                Text('ID: ${_verifiedUser!['id_type'].toString().toUpperCase()} ending in ${_verifiedUser!['id_last_four'] ?? '***'}', style: const TextStyle(fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: ClayCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Active Local Users', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                            const SizedBox(height: 6),
                            Text('${_stats?['activeUsersToday'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: Clay.primary)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ClayCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Open Incidents', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 10, color: Clay.textMuted)),
                            const SizedBox(height: 6),
                            Text('${_stats?['openIncidents'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: Clay.high)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                const Text('General Alerts', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Clay.text)),
                const SizedBox(height: 8),

                if (_incidents.isEmpty)
                  const Center(child: Text('No active incidents.', style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted)))
                else
                  ..._incidents.map((inc) {
                    final sev = (inc['severity'] ?? 'low').toString().toLowerCase();
                    Color sevColor = Clay.moderate;
                    if (sev == 'critical') sevColor = Clay.critical;
                    if (sev == 'high') sevColor = Clay.high;

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ClayCard(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            Container(width: 12, height: 12, decoration: BoxDecoration(color: sevColor, shape: BoxShape.circle)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(inc['title'] ?? 'Alert', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Clay.text)),
                                  Text(inc['status'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: Clay.textMuted)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
    );
  }
}
