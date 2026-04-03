import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class NB {
  static const Color black = Color(0xFF0A0A0A);
  static const Color yellow = Color(0xFFFFE500);
  static const Color red = Color(0xFFFF3B3B);
  static const Color blue = Color(0xFF2B6FFF);
  static const Color mint = Color(0xFF00D084);
  static const Color cream = Color(0xFFFFFBF0);
  static const Color white = Color(0xFFFFFFFF);
  static const Color violet = Color(0xFF8B5CF6);
  static const Color orange = Color(0xFFFF7A00);
}

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  String _mode = 'register';
  String _role = 'tourist';
  String? _blockchainId;

  // Controllers
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  
  // Tourist
  String _idType = 'aadhaar';
  final _idNumCtrl = TextEditingController();
  final _destRegionCtrl = TextEditingController();
  final _tripStartCtrl = TextEditingController();
  final _tripEndCtrl = TextEditingController();

  // Resident / Business
  final _wardIdCtrl = TextEditingController();
  
  // Business
  final _bizNameCtrl = TextEditingController();
  String _bizCategory = 'accommodation';
  final _addressCtrl = TextEditingController();

  // Authority
  final _deptCtrl = TextEditingController();
  final _designationCtrl = TextEditingController();
  final _authCodeCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    if (_blockchainId != null) {
      return _buildSuccessScreen();
    }

    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        backgroundColor: NB.black,
        title: RichText(
          text: const TextSpan(
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 1.5, fontFamily: 'Space Grotesk'),
            children: [
              TextSpan(text: 'TRACK', style: TextStyle(color: NB.white)),
              TextSpan(text: 'MATE', style: TextStyle(color: NB.yellow)),
            ],
          )
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: Container(color: NB.black, height: 4),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Container(
              decoration: BoxDecoration(
                color: NB.white,
                border: Border.all(color: NB.black, width: 3),
                boxShadow: const [BoxShadow(color: NB.black, offset: Offset(5, 5))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Tabs
                  Row(
                    children: [
                      _buildTab('register', 'REGISTER'),
                      _buildTab('login', 'SIGN IN'),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.all(24),
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

  Widget _buildTab(String m, String label) {
    bool isSelected = _mode == m;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _mode = m),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? NB.yellow : NB.white,
            border: Border(
              bottom: const BorderSide(color: NB.black, width: 3),
              right: m == 'register' ? const BorderSide(color: NB.black, width: 3) : BorderSide.none,
            )
          ),
          alignment: Alignment.center,
          child: Text(
            label, 
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.2),
          ),
        ),
      ),
    );
  }

  Widget _buildLogin() {
    final authState = ref.watch(authProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (authState.error != null) _buildError(authState.error!),
        const SizedBox(height: 16),
        _buildLabel('EMAIL ADDRESS'),
        _buildInput(_emailCtrl, hint: 'you@example.com'),
        const SizedBox(height: 16),
        _buildLabel('PASSWORD'),
        _buildInput(_passCtrl, obscure: true, hint: '••••••••'),
        const SizedBox(height: 24),
        _buildSubmitButton('AUTHENTICATE', () async {
          await ref.read(authProvider.notifier).login(_emailCtrl.text, _passCtrl.text);
          final state = ref.read(authProvider);
          if (state.isAuthenticated && mounted) {
            String role = state.user?['role'] ?? 'tourist';
            context.go('/$role/dashboard');
          }
        }, isLoading: authState.isLoading),
      ],
    );
  }

  Widget _buildRegister() {
    final authState = ref.watch(authProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (authState.error != null) _buildError(authState.error!),
        
        const Text('SELECT YOUR ROLE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.5)),
        const Divider(color: NB.black, thickness: 3),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.2,
          children: [
            _buildRoleCard('tourist', 'TOURIST', 'Visitor', Icons.map, NB.yellow),
            _buildRoleCard('resident', 'RESIDENT', 'Local', Icons.people, NB.blue, iconColor: NB.white),
            _buildRoleCard('business', 'BUSINESS', 'Service', Icons.business, NB.mint),
            _buildRoleCard('authority', 'AUTHORITY', 'Gov Agency', Icons.security, NB.black, iconColor: NB.yellow, textColor: NB.white),
          ],
        ),
        const SizedBox(height: 24),

        // Common Fields
        Row(
          children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('FULL NAME'), _buildInput(_nameCtrl, hint: 'Legal Name')])),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('PHONE'), _buildInput(_phoneCtrl, hint: '+91 ...')])),
          ],
        ),
        const SizedBox(height: 14),
        _buildLabel('EMAIL ADDRESS'),
        _buildInput(_emailCtrl, hint: 'you@example.com'),
        const SizedBox(height: 14),

        // Role Specific
        if (_role == 'tourist') _buildTouristFields(),
        if (_role == 'resident') _buildResidentFields(),
        if (_role == 'business') _buildBusinessFields(),
        if (_role == 'authority') _buildAuthorityFields(),

        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('PASSWORD'), _buildInput(_passCtrl, obscure: true, hint: '••••••••')])),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('CONFIRM PASSWORD'), _buildInput(_confirmPassCtrl, obscure: true, hint: '••••••••')])),
          ],
        ),
        const SizedBox(height: 24),
        _buildSubmitButton('CREATE ACCOUNT', _handleRegister, isLoading: authState.isLoading),
      ],
    );
  }

  Widget _buildRoleCard(String id, String title, String sub, IconData icon, Color bg, {Color? iconColor, Color? textColor}) {
    bool isSelected = _role == id;
    Color tColor = textColor ?? NB.black;
    return GestureDetector(
      onTap: () => setState(() => _role = id),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected ? bg : NB.cream,
          border: Border.all(color: NB.black, width: isSelected ? 3 : 2),
          boxShadow: isSelected ? const [BoxShadow(color: NB.black, offset: Offset(3, 3))] : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor ?? NB.black, size: 28),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: tColor, letterSpacing: 1.2)),
            Text(sub, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 10, color: tColor.withOpacity(0.7))),
          ],
        ),
      ),
    );
  }

  Widget _buildTouristFields() {
    return _buildSectionBox(NB.blue, 'TOURIST DETAILS', [
      Row(
        children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _buildLabel('ID TYPE'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(border: Border.all(color: NB.black, width: 3), color: NB.white, boxShadow: const [BoxShadow(color: NB.black, offset: Offset(3, 3))]),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _idType,
                  isExpanded: true,
                  onChanged: (v) => setState(() => _idType = v!),
                  items: const [
                    DropdownMenuItem(value: 'aadhaar', child: Text('Aadhaar', style: TextStyle(fontWeight: FontWeight.bold))),
                    DropdownMenuItem(value: 'passport', child: Text('Passport', style: TextStyle(fontWeight: FontWeight.bold))),
                  ],
                ),
              ),
            ),
          ])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('ID NUMBER'), _buildInput(_idNumCtrl, hint: 'For verification')])),
        ],
      ),
      const SizedBox(height: 12),
      _buildLabel('DESTINATION REGION'),
      _buildInput(_destRegionCtrl, hint: 'e.g. Tawang District'),
      const SizedBox(height: 12),
      Row(
        children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('TRIP START'), _buildInput(_tripStartCtrl, hint: 'YYYY-MM-DD')])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('TRIP END'), _buildInput(_tripEndCtrl, hint: 'YYYY-MM-DD')])),
        ],
      ),
    ]);
  }

  Widget _buildResidentFields() {
    return _buildSectionBox(NB.mint, 'RESIDENT DETAILS', [
      _buildLabel('WARD ID'),
      _buildInput(_wardIdCtrl, hint: 'Enter your Ward ID'),
      const SizedBox(height: 4),
      const Text('Links you to neighbourhood alerts.', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold))
    ]);
  }

  Widget _buildBusinessFields() {
    return _buildSectionBox(NB.orange, 'BUSINESS DETAILS', [
      _buildLabel('BUSINESS NAME'),
      _buildInput(_bizNameCtrl, hint: 'Official Name'),
      const SizedBox(height: 12),
      Row(
        children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _buildLabel('CATEGORY'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(border: Border.all(color: NB.black, width: 3), color: NB.white, boxShadow: const [BoxShadow(color: NB.black, offset: Offset(3, 3))]),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _bizCategory,
                  isExpanded: true,
                  onChanged: (v) => setState(() => _bizCategory = v!),
                  items: const [
                    DropdownMenuItem(value: 'accommodation', child: Text('Accommodation', style: TextStyle(fontWeight: FontWeight.bold))),
                    DropdownMenuItem(value: 'food_beverage', child: Text('Food & Beverage', style: TextStyle(fontWeight: FontWeight.bold))),
                  ],
                ),
              ),
            ),
          ])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('WARD ID'), _buildInput(_wardIdCtrl, hint: '24-char ID')])),
        ],
      ),
      const SizedBox(height: 12),
      _buildLabel('BUSINESS ADDRESS'),
      _buildInput(_addressCtrl, hint: ''),
    ]);
  }

  Widget _buildAuthorityFields() {
    return _buildSectionBox(NB.violet, 'AUTHORITY DETAILS', [
      Row(
        children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('DEPARTMENT'), _buildInput(_deptCtrl, hint: 'e.g. Police')])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [_buildLabel('DESIGNATION'), _buildInput(_designationCtrl, hint: 'e.g. Inspector')])),
        ],
      ),
      const SizedBox(height: 12),
      _buildLabel('AUTHORITY CODE'),
      _buildInput(_authCodeCtrl, hint: 'Enter secure code', obscure: true),
    ]);
  }

  Widget _buildSectionBox(Color headerColor, String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(color: NB.cream, border: Border.all(color: NB.black, width: 2)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: headerColor, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.5)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.2)),
    );
  }

  Widget _buildInput(TextEditingController ctrl, {String hint = '', bool obscure = false}) {
    return Container(
      decoration: BoxDecoration(
        color: NB.white,
        border: Border.all(color: NB.black, width: 3),
        boxShadow: const [BoxShadow(color: NB.black, offset: Offset(3, 3))],
      ),
      child: TextField(
        controller: ctrl,
        obscureText: obscure,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          isDense: true,
        ),
      ),
    );
  }

  Widget _buildSubmitButton(String text, VoidCallback onTap, {bool isLoading = false}) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: NB.yellow,
          border: Border.all(color: NB.black, width: 3),
          boxShadow: const [BoxShadow(color: NB.black, offset: Offset(4, 4))],
        ),
        alignment: Alignment.center,
        child: isLoading 
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 3, color: NB.black))
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(text, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1.2)),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_outlined, color: NB.black, size: 20),
              ],
            ),
      ),
    );
  }

  Widget _buildError(String err) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF0F0),
        border: Border.all(color: NB.red, width: 2),
        boxShadow: const [BoxShadow(color: NB.red, offset: Offset(3, 3))],
      ),
      child: Text(err, style: const TextStyle(color: NB.red, fontWeight: FontWeight.bold, fontSize: 12)),
    );
  }

  void _handleRegister() async {
    final payload = {
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
    if (state.isAuthenticated && mounted) {
      setState(() {
        _blockchainId = state.user?['blockchain_id'] ?? state.user?['blockchainId'];
      });
      // If no blockchain ID was returned but auth succeeded, route directly
      if (_blockchainId == null) {
        context.go('/$_role/dashboard');
      }
    }
  }

  Widget _buildSuccessScreen() {
    return Scaffold(
      backgroundColor: NB.cream,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                decoration: BoxDecoration(color: NB.mint, border: Border.all(color: NB.black, width: 2)),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.check, size: 14, color: NB.black),
                  SizedBox(width: 6),
                  Text('IDENTITY ISSUED', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.5))
                ]),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: NB.white,
                  border: Border.all(color: NB.black, width: 3),
                  boxShadow: const [BoxShadow(color: NB.black, offset: Offset(6, 6))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 64, height: 64,
                      decoration: BoxDecoration(color: NB.yellow, border: Border.all(color: NB.black, width: 3)),
                      child: const Icon(Icons.fingerprint, size: 32, color: NB.black),
                    ),
                    const SizedBox(height: 20),
                    const Text('Digital Identity\nIssued', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, height: 1.1)),
                    const SizedBox(height: 12),
                    const Text(
                      'Your cryptographic blockchain identifier has been generated. Keep this safe — authorities use it to verify your identity.',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF3A3A3A)),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(color: NB.cream, border: Border.all(color: NB.black, width: 3), boxShadow: const [BoxShadow(color: NB.black, offset: Offset(3, 3))]),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text(_blockchainId!, style: const TextStyle(fontWeight: FontWeight.w900, color: NB.blue, fontSize: 14))),
                          const Icon(Icons.copy, size: 20),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    _buildSubmitButton('ENTER DASHBOARD', () {
                      final role = ref.read(authProvider).role;
                      context.go('/$role/dashboard');
                    })
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
