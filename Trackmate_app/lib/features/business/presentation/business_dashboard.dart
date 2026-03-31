import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/presentation/auth_screen.dart'; // for NB colors

class BusinessDashboard extends ConsumerStatefulWidget {
  const BusinessDashboard({super.key});

  @override
  ConsumerState<BusinessDashboard> createState() => _BusinessDashboardState();
}

class _BusinessDashboardState extends ConsumerState<BusinessDashboard> {
  final _verifyCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: NB.cream,
      appBar: AppBar(
        title: const Text('Business Hub', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Space Grotesk')),
        backgroundColor: NB.orange,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: Container(color: NB.black, height: 4),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('VERIFY TOURIST IDENTITY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5, color: NB.black)),
            const Divider(color: NB.black, thickness: 3),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: NB.white,
                border: Border.all(color: NB.black, width: 3),
                boxShadow: const [BoxShadow(color: NB.black, offset: Offset(5, 5))],
              ),
              child: Column(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: NB.white,
                      border: Border.all(color: NB.black, width: 3),
                      boxShadow: const [BoxShadow(color: NB.black, offset: Offset(3, 3))],
                    ),
                    child: TextField(
                      controller: _verifyCtrl,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: 'Enter Blockchain ID',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  GestureDetector(
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: NB.black,
                        border: Border.all(color: NB.black, width: 3),
                        boxShadow: const [BoxShadow(color: NB.orange, offset: Offset(4, 4))],
                      ),
                      alignment: Alignment.center,
                      child: const Text('VERIFY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: NB.white, letterSpacing: 1.2)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            const Text('LOCAL FOOTFALL STATS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5, color: NB.black)),
            const Divider(color: NB.black, thickness: 3),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildStatCard('TODAY', '1,245', NB.yellow)),
                const SizedBox(width: 16),
                Expanded(child: _buildStatCard('WARD', '#14', NB.mint)),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color bg) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: NB.black, width: 3),
        boxShadow: const [BoxShadow(color: NB.black, offset: Offset(4, 4))],
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.2)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 28)),
        ],
      ),
    );
  }
}
