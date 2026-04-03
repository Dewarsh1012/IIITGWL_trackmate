import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';

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
      // ignore
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String id, String status) async {
    try {
      await ApiClient.patch('/incidents/$id', {'status': status});
      await _fetchIncidents();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Status updated to $status')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error updating status: $e')));
    }
  }

  Color _severityColor(String severity) {
    switch (severity) {
      case 'critical':
        return Clay.critical;
      case 'high':
        return Clay.high;
      case 'medium':
        return Clay.moderate;
      default:
        return Clay.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        title: const Text('Incidents', style: TextStyle(fontWeight: FontWeight.w800, color: Clay.text)),
        backgroundColor: Clay.surface,
        iconTheme: const IconThemeData(color: Clay.text),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
            decoration: const BoxDecoration(
              color: Clay.surface,
              border: Border(bottom: BorderSide(color: Clay.border, width: 1)),
            ),
            child: Row(
              children: [
                _filterTab('active', 'Active'),
                const SizedBox(width: 8),
                _filterTab('acknowledged', 'Acknowledged'),
                const SizedBox(width: 8),
                _filterTab('resolved', 'Resolved'),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Clay.primary))
                : _incidents.isEmpty
                    ? const Center(
                        child: Text(
                          'No incidents found.',
                          style: TextStyle(fontWeight: FontWeight.w600, color: Clay.textMuted),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: _incidents.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final incident = _incidents[i];
                          final severity = (incident['severity'] ?? 'low').toString().toLowerCase();
                          final color = _severityColor(severity);
                          final reporterId = incident['reporter']?['_id'];

                          return ClayCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    ClayBadge(
                                      label: severity.toUpperCase(),
                                      color: color.withValues(alpha: 0.14),
                                      textColor: color,
                                    ),
                                    ClayBadge(
                                      label: (incident['status'] ?? 'unknown').toString().toUpperCase(),
                                      color: Clay.surfaceAlt,
                                      textColor: Clay.textMuted,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  incident['title'] ?? 'No title',
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Clay.text),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  incident['description'] ?? '',
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Clay.textSecondary),
                                ),
                                const SizedBox(height: 10),
                                if (reporterId != null)
                                  InkWell(
                                    onTap: () => context.push('/authority/user/$reporterId'),
                                    child: Text(
                                      incident['reporter']?['full_name'] ?? 'System',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 11,
                                        color: Clay.primary,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  )
                                else
                                  const Text(
                                    'System',
                                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: Clay.textMuted),
                                  ),
                                const SizedBox(height: 12),
                                ClayButton(
                                  label: 'CREATE EFIR',
                                  variant: ClayButtonVariant.ghost,
                                  onTap: () => context.push('/authority/efir?incidentId=${incident['_id']}'),
                                ),
                                if (_statusFilter == 'active' || _statusFilter == 'acknowledged')
                                  const SizedBox(height: 8),
                                if (_statusFilter == 'active')
                                  ClayButton(
                                    label: 'ACKNOWLEDGE',
                                    variant: ClayButtonVariant.ghost,
                                    onTap: () => _updateStatus(incident['_id'], 'acknowledged'),
                                  ),
                                if (_statusFilter == 'acknowledged')
                                  ClayButton(
                                    label: 'RESOLVE',
                                    variant: ClayButtonVariant.primary,
                                    onTap: () => _updateStatus(incident['_id'], 'resolved'),
                                  ),
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

  Widget _filterTab(String value, String label) {
    final active = _statusFilter == value;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() => _statusFilter = value);
          _fetchIncidents();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active ? Clay.primary.withValues(alpha: 0.12) : Clay.surfaceAlt,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: active ? Clay.primary.withValues(alpha: 0.30) : Clay.border, width: 1),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 11,
              color: active ? Clay.primary : Clay.textMuted,
            ),
          ),
        ),
      ),
    );
  }
}
