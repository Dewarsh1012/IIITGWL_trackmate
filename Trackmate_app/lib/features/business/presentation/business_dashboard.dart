import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/nb_widgets.dart';
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
    } catch (e) {
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
      final res = await ApiClient.get('/verify/tourist/$id');
      if (res['success'] == true) {
        setState(() {
          _verifiedUser = res['data'];
        });
      } else {
        setState(() {
          _verifyError = 'User not found or not verified.';
        });
      }
    } catch (e) {
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
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('Business Dashboard', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.black)),
        backgroundColor: NB.orange,
        elevation: 0,
        iconTheme: const IconThemeData(color: NB.black),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: NB.black),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (mounted) context.go('/auth');
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: Container(color: NB.black, height: 4),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: NB.black))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header block
                Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.bottom(16),
                  color: NB.white,
                  decoration: BoxDecoration(
                    border: Border.all(color: NB.black, width: 3),
                    boxShadow: const [BoxShadow(color: NB.black, offset: Offset(4, 4))],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48, height: 48,
                        decoration: BoxDecoration(color: NB.orange, border: Border.all(color: NB.black, width: 2)),
                        child: const Icon(Icons.store, size: 24, color: NB.black),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(authState.fullName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                            const SizedBox(height: 4),
                            NBBadge(label: 'VERIFIED BUSINESS', color: NB.mint),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 8),

                // Verify Tourist
                const Text('VERIFY TOURIST IDENTITY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5, color: NB.black)),
                const Divider(color: NB.black, thickness: 3),
                const SizedBox(height: 12),
                
                NBCard(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      NBInput(
                        controller: _verifyCtrl,
                        hint: 'Enter Blockchain ID',
                      ),
                      const SizedBox(height: 16),
                      NBButton(
                        label: 'VERIFY',
                        color: NB.black,
                        textColor: NB.white,
                        isLoading: _isVerifying,
                        onTap: _handleVerify,
                      ),
                      
                      if (_verifyError != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Text(_verifyError!, style: const TextStyle(color: NB.red, fontWeight: FontWeight.bold)),
                        ),
                        
                      if (_verifiedUser != null)
                        Container(
                          margin: const EdgeInsets.only(top: 20),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: NB.cream,
                            border: Border.all(color: NB.black, width: 2),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.check_circle, color: NB.mint, size: 20),
                                  const SizedBox(width: 8),
                                  const Text('IDENTITY VERIFIED', style: TextStyle(fontWeight: FontWeight.w900, color: NB.mint)),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text('Name: ${_verifiedUser!['full_name']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('Safety Score: ${_verifiedUser!['safety_score'] ?? 100}%', style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              if (_verifiedUser!['id_type'] != null)
                                Text('ID: ${_verifiedUser!['id_type'].toString().toUpperCase()} ending in ${_verifiedUser!['id_last_four'] ?? '***'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Stats
                Row(
                  children: [
                    Expanded(child: NBStatCard(label: 'ACTIVE LOCAL USERS', value: '${_stats?['activeUsersToday'] ?? 0}', color: NB.blue, icon: Icons.map)),
                    const SizedBox(width: 12),
                    Expanded(child: NBStatCard(label: 'OPEN INCIDENTS', value: '${_stats?['openIncidents'] ?? 0}', color: NB.red, icon: Icons.warning)),
                  ],
                ),
                
                const SizedBox(height: 24),
                
                // Incidents
                const Text('GENERAL ALERTS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5, color: NB.black)),
                const Divider(color: NB.black, thickness: 3),
                const SizedBox(height: 12),
                
                if (_incidents.isEmpty)
                  const Center(child: Text('No active incidents.', style: TextStyle(fontWeight: FontWeight.bold, color: NB.textMuted)))
                else
                  ..._incidents.map((inc) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: NBCard(
                      padding: const EdgeInsets.all(12),
                      borderWidth: 2,
                      color: NB.white,
                      child: Row(
                        children: [
                          Container(
                            width: 12, height: 12,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: inc['severity'] == 'critical' ? NB.critical : (inc['severity'] == 'high' ? NB.red : NB.orange),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(inc['title'] ?? 'Alert', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                Text(inc['status'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: NB.textMuted)),
                              ],
                            ),
                          )
                        ],
                      ),
                    ),
                  )),
                  
              ],
            ),
          ),
    );
  }
}
