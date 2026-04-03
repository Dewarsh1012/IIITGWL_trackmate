import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/nb_widgets.dart';
import '../../../core/network/api_client.dart';

class AuthorityIncidentsPage extends ConsumerStatefulWidget {
  const AuthorityIncidentsPage({super.key});

  @override
  ConsumerState<AuthorityIncidentsPage> createState() => _AuthorityIncidentsPageState();
}

class _AuthorityIncidentsPageState extends ConsumerState<AuthorityIncidentsPage> {
  List<dynamic> _incidents = [];
  bool _isLoading = true;
  String _statusFilter = 'active';

  @override
  void initState() {
    super.initState();
    _fetchIncidents();
  }

  Future<void> _fetchIncidents() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.get('/incidents?status=$_statusFilter');
      if (res['success'] == true && mounted) {
        setState(() => _incidents = res['data'] ?? []);
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String id, String status) async {
    try {
      await ApiClient.patch('/incidents/$id', {'status': status});
      _fetchIncidents();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Status updated to $status')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error updating status: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('Incidents', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk', color: NB.white)),
        backgroundColor: NB.black,
        iconTheme: const IconThemeData(color: NB.white),
      ),
      body: Column(
        children: [
          // Filter Row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: const BoxDecoration(
              color: NB.white,
              border: Border(bottom: BorderSide(color: NB.black, width: 3)),
            ),
            child: Row(
              children: [
                _filterTab('active', 'Active'),
                const SizedBox(width: 8),
                _filterTab('acknowledged', 'Ack\'d'),
                const SizedBox(width: 8),
                _filterTab('resolved', 'Resolved'),
              ],
            ),
          ),
          
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: NB.black))
                : _incidents.isEmpty
                    ? const Center(child: Text('No incidents found.', style: TextStyle(fontWeight: FontWeight.bold)))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _incidents.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 16),
                        itemBuilder: (context, i) {
                          final inc = _incidents[i];
                          final severity = inc['severity'] ?? 'low';
                          Color sevBg = NB.cream;
                          if (severity == 'critical') sevBg = const Color(0xFFFFD6E0);
                          else if (severity == 'high') sevBg = const Color(0xFFFFE0E0);
                          else if (severity == 'medium') sevBg = const Color(0xFFFFF0D4);

                          return NBCard(
                            color: sevBg,
                            borderColor: NB.black,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    NBBadge(label: severity.toString().toUpperCase(), color: severity == 'critical' ? NB.critical : (severity == 'high' ? NB.red : NB.orange), textColor: NB.white),
                                    Text(inc['status']?.toString().toUpperCase() ?? 'UNKNOWN', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, color: NB.textMuted)),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(inc['title'] ?? 'No Title', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                                const SizedBox(height: 4),
                                Text(inc['description'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: NB.textSecondary)),
                                const SizedBox(height: 16),
                                
                                Row(
                                  children: [
                                    const Icon(Icons.person, size: 14),
                                    const SizedBox(width: 4),
                                    GestureDetector(
                                      onTap: inc['reporter']?['_id'] != null ? () => context.push('/authority/user/${inc['reporter']['_id']}') : null,
                                      child: Text(inc['reporter']?['full_name'] ?? 'System', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: inc['reporter']?['_id'] != null ? NB.blue : NB.black, decoration: inc['reporter']?['_id'] != null ? TextDecoration.underline : null)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),

                                // Action Buttons
                                if (_statusFilter == 'active')
                                  NBButton(label: 'ACKNOWLEDGE', color: NB.blue, textColor: NB.white, onTap: () => _updateStatus(inc['_id'], 'acknowledged')),
                                if (_statusFilter == 'acknowledged')
                                  NBButton(label: 'RESOLVE', color: NB.mint, textColor: NB.black, onTap: () => _updateStatus(inc['_id'], 'resolved')),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _filterTab(String val, String label) {
    bool active = _statusFilter == val;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _statusFilter = val);
          _fetchIncidents();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active ? NB.black : NB.cream,
            border: Border.all(color: NB.black, width: 2),
          ),
          alignment: Alignment.center,
          child: Text(label, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: active ? NB.white : NB.black)),
        ),
      ),
    );
  }
}
