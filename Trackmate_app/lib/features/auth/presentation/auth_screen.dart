import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clay_widgets.dart';
import '../providers/auth_provider.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  String _mode = 'register';
  String _role = 'tourist';
  String? _blockchainId;

  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  String _idType = 'aadhaar';
  final _idNumCtrl = TextEditingController();
  final _destRegionCtrl = TextEditingController();
  final _tripStartCtrl = TextEditingController();
  final _tripEndCtrl = TextEditingController();

  final _wardIdCtrl = TextEditingController();

  final _bizNameCtrl = TextEditingController();
  String _bizCategory = 'accommodation';
  final _addressCtrl = TextEditingController();

  final _deptCtrl = TextEditingController();
  final _designationCtrl = TextEditingController();
  final _authCodeCtrl = TextEditingController();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _idNumCtrl.dispose();
    _destRegionCtrl.dispose();
    _tripStartCtrl.dispose();
    _tripEndCtrl.dispose();
    _wardIdCtrl.dispose();
    _bizNameCtrl.dispose();
    _addressCtrl.dispose();
    _deptCtrl.dispose();
    _designationCtrl.dispose();
    _authCodeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_blockchainId != null) {
      return _buildSuccessScreen();
    }

    return Scaffold(
      backgroundColor: Clay.bg,
      appBar: AppBar(
        backgroundColor: Clay.surface,
        title: RichText(
          text: const TextSpan(
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
            children: [
              TextSpan(text: 'Track', style: TextStyle(color: Clay.text)),
              TextSpan(text: 'Mate', style: TextStyle(color: Clay.primary)),
            ],
          ),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: ClayCard(
              padding: const EdgeInsets.all(0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      _buildTab('register', 'REGISTER'),
                      _buildTab('login', 'SIGN IN'),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: _mode == 'login' ? _buildLogin() : _buildRegister(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTab(String mode, String label) {
    final selected = _mode == mode;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _mode = mode),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? Clay.primary.withValues(alpha: 0.10) : Clay.surface,
            border: Border(
              bottom: BorderSide(color: selected ? Clay.primary : Clay.border, width: 2),
              right: mode == 'register' ? const BorderSide(color: Clay.border, width: 1) : BorderSide.none,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 12,
              letterSpacing: 0.8,
              color: selected ? Clay.primary : Clay.textMuted,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogin() {
    final state = ref.watch(authProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (state.error != null) _buildError(state.error!),
        const SizedBox(height: 12),
        _buildLabel('EMAIL ADDRESS'),
        ClayInput(controller: _emailCtrl, hint: 'you@example.com'),
        const SizedBox(height: 12),
        _buildLabel('PASSWORD'),
        ClayInput(controller: _passCtrl, obscure: true, hint: '********'),
        const SizedBox(height: 18),
        ClayButton(
          label: 'AUTHENTICATE',
          variant: ClayButtonVariant.primary,
          isLoading: state.isLoading,
          onTap: () async {
            await ref.read(authProvider.notifier).login(_emailCtrl.text, _passCtrl.text);
            final fresh = ref.read(authProvider);
            if (!mounted) return;
            if (fresh.isAuthenticated) {
              final role = fresh.user?['role'] ?? 'tourist';
              context.go('/$role/dashboard');
            }
          },
        ),
      ],
    );
  }

  Widget _buildRegister() {
    final state = ref.watch(authProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (state.error != null) _buildError(state.error!),
        _buildLabel('SELECT YOUR ROLE'),
        const SizedBox(height: 10),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.55,
          children: [
            _buildRoleCard('tourist', 'TOURIST', Icons.map_outlined, Clay.primary),
            _buildRoleCard('resident', 'RESIDENT', Icons.people_outline, Clay.safe),
            _buildRoleCard('business', 'BUSINESS', Icons.business_outlined, Clay.moderate),
            _buildRoleCard('authority', 'AUTHORITY', Icons.security_outlined, Clay.restricted),
          ],
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('FULL NAME'),
                  ClayInput(controller: _nameCtrl, hint: 'Legal Name'),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('PHONE'),
                  ClayInput(controller: _phoneCtrl, hint: '+91 ...'),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _buildLabel('EMAIL ADDRESS'),
        ClayInput(controller: _emailCtrl, hint: 'you@example.com'),

        if (_role == 'tourist') _buildTouristFields(),
        if (_role == 'resident') _buildResidentFields(),
        if (_role == 'business') _buildBusinessFields(),
        if (_role == 'authority') _buildAuthorityFields(),

        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('PASSWORD'),
                  ClayInput(controller: _passCtrl, obscure: true, hint: '********'),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('CONFIRM PASSWORD'),
                  ClayInput(controller: _confirmPassCtrl, obscure: true, hint: '********'),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        ClayButton(
          label: 'CREATE ACCOUNT',
          variant: ClayButtonVariant.primary,
          isLoading: state.isLoading,
          onTap: _handleRegister,
        ),
      ],
    );
  }

  Widget _buildRoleCard(String role, String title, IconData icon, Color accent) {
    final selected = _role == role;
    return InkWell(
      onTap: () => setState(() => _role = role),
      child: Container(
        decoration: BoxDecoration(
          color: selected ? accent.withValues(alpha: 0.14) : Clay.surfaceAlt,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? accent.withValues(alpha: 0.45) : Clay.border, width: 1),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: selected ? accent : Clay.textMuted),
            const SizedBox(height: 6),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 11,
                letterSpacing: 0.6,
                color: selected ? accent : Clay.text,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTouristFields() {
    return _buildSectionBox('TOURIST DETAILS', [
      Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('ID TYPE'),
                _buildDropdown(
                  value: _idType,
                  items: const ['aadhaar', 'passport'],
                  onChanged: (v) => setState(() => _idType = v ?? 'aadhaar'),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('ID NUMBER'),
                ClayInput(controller: _idNumCtrl, hint: 'For verification'),
              ],
            ),
          ),
        ],
      ),
      const SizedBox(height: 10),
      _buildLabel('DESTINATION REGION'),
      ClayInput(controller: _destRegionCtrl, hint: 'e.g. Tawang District'),
      const SizedBox(height: 10),
      Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('TRIP START'),
                ClayInput(controller: _tripStartCtrl, hint: 'YYYY-MM-DD'),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('TRIP END'),
                ClayInput(controller: _tripEndCtrl, hint: 'YYYY-MM-DD'),
              ],
            ),
          ),
        ],
      ),
    ]);
  }

  Widget _buildResidentFields() {
    return _buildSectionBox('RESIDENT DETAILS', [
      _buildLabel('WARD ID'),
      ClayInput(controller: _wardIdCtrl, hint: 'Enter your Ward ID'),
      const SizedBox(height: 4),
      const Text(
        'Links you to neighbourhood alerts.',
        style: TextStyle(fontSize: 10, color: Clay.textMuted, fontWeight: FontWeight.w600),
      ),
    ]);
  }

  Widget _buildBusinessFields() {
    return _buildSectionBox('BUSINESS DETAILS', [
      _buildLabel('BUSINESS NAME'),
      ClayInput(controller: _bizNameCtrl, hint: 'Official Name'),
      const SizedBox(height: 10),
      Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('CATEGORY'),
                _buildDropdown(
                  value: _bizCategory,
                  items: const ['accommodation', 'food_beverage'],
                  onChanged: (v) => setState(() => _bizCategory = v ?? 'accommodation'),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('WARD ID'),
                ClayInput(controller: _wardIdCtrl, hint: '24-char ID'),
              ],
            ),
          ),
        ],
      ),
      const SizedBox(height: 10),
      _buildLabel('BUSINESS ADDRESS'),
      ClayInput(controller: _addressCtrl, hint: 'Address'),
    ]);
  }

  Widget _buildAuthorityFields() {
    return _buildSectionBox('AUTHORITY DETAILS', [
      Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('DEPARTMENT'),
                ClayInput(controller: _deptCtrl, hint: 'e.g. Police'),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLabel('DESIGNATION'),
                ClayInput(controller: _designationCtrl, hint: 'e.g. Inspector'),
              ],
            ),
          ),
        ],
      ),
      const SizedBox(height: 10),
      _buildLabel('AUTHORITY CODE'),
      ClayInput(controller: _authCodeCtrl, hint: 'Enter secure code', obscure: true),
    ]);
  }

  Widget _buildSectionBox(String title, List<Widget> children) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: ClayInset(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.6, color: Clay.primary),
            ),
            const SizedBox(height: 10),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: Clay.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Clay.border, width: 1),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          onChanged: onChanged,
          items: items
              .map((item) => DropdownMenuItem<String>(
                    value: item,
                    child: Text(
                      item.replaceAll('_', ' ').toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                    ),
                  ))
              .toList(),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 10, letterSpacing: 0.8, color: Clay.textMuted),
      ),
    );
  }

  Widget _buildError(String err) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Clay.high.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Clay.high.withValues(alpha: 0.35), width: 1),
      ),
      child: Text(err, style: const TextStyle(color: Clay.critical, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }

  Future<void> _handleRegister() async {
    final payload = <String, dynamic>{
      'full_name': _nameCtrl.text,
      'email': _emailCtrl.text,
      'password': _passCtrl.text,
      'role': _role,
      'phone': _phoneCtrl.text,
    };

    if (_role == 'tourist') {
      payload['id_type'] = _idType;
      payload['id_number'] = _idNumCtrl.text;
      payload['destination_region'] = _destRegionCtrl.text;
      payload['start_date'] = _tripStartCtrl.text;
      payload['end_date'] = _tripEndCtrl.text;
    } else if (_role == 'resident') {
      payload['ward_id'] = _wardIdCtrl.text;
    } else if (_role == 'business') {
      payload['business_name'] = _bizNameCtrl.text;
      payload['category'] = _bizCategory;
      payload['ward_id'] = _wardIdCtrl.text;
      payload['address'] = _addressCtrl.text;
    } else if (_role == 'authority') {
      payload['department'] = _deptCtrl.text;
      payload['designation'] = _designationCtrl.text;
      payload['authority_code'] = _authCodeCtrl.text;
    }

    await ref.read(authProvider.notifier).register(payload);

    final state = ref.read(authProvider);
    if (!mounted || !state.isAuthenticated) return;

    setState(() {
      _blockchainId = state.user?['blockchain_id'] ?? state.user?['blockchainId'];
    });

    if (_blockchainId == null) {
      context.go('/$_role/dashboard');
    }
  }

  Widget _buildSuccessScreen() {
    return Scaffold(
      backgroundColor: Clay.bg,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: ClayCard(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClayBadge(
                    label: 'IDENTITY ISSUED',
                    color: Clay.safe.withValues(alpha: 0.18),
                    textColor: Clay.safe,
                  ),
                  const SizedBox(height: 16),
                  const Icon(Icons.fingerprint, size: 40, color: Clay.primary),
                  const SizedBox(height: 12),
                  const Text(
                    'Digital Identity Issued',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 22, color: Clay.text),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Your cryptographic blockchain identifier has been generated. Keep it safe for verification checks.',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Clay.textSecondary),
                  ),
                  const SizedBox(height: 14),
                  ClayInset(
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            _blockchainId!,
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Clay.primary),
                          ),
                        ),
                        const Icon(Icons.copy, size: 18, color: Clay.textMuted),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  ClayButton(
                    label: 'ENTER DASHBOARD',
                    variant: ClayButtonVariant.primary,
                    onTap: () {
                      final role = ref.read(authProvider).role;
                      context.go('/$role/dashboard');
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
