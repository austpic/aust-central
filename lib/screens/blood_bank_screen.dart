import 'package:flutter/material.dart';

import '../models/blood_request.dart';
import '../services/blood_request_service.dart';
import '../services/donor_profile_service.dart';
import '../theme/app_colors.dart';
import '../widgets/blood_request_card.dart';
import '../widgets/my_status_card.dart';
import 'blood_request_form_screen.dart';

/// Blood Bank screen.
///
/// Layout: 3 vertically stacked sections inside a single scroll view.
///   1. **My Status** — donor's own profile (group, eligibility).
///   2. **Send request CTA** — opens the form sheet/page.
///   3. **My requests** (only when the user has submitted at least one).
///   4. **Active requests nearby** — hardcoded feed the donor can respond to.
///
/// Persistence: donor profile + my-requests are stored in SharedPreferences so
/// the surface survives restarts and screen pops. The feed is hardcoded.
class BloodBankScreen extends StatefulWidget {
  const BloodBankScreen({super.key});

  @override
  State<BloodBankScreen> createState() => _BloodBankScreenState();
}

class _BloodBankScreenState extends State<BloodBankScreen> {
  DonorProfile _profile = DonorProfile.empty;
  List<BloodRequest> _feed = const [];
  List<BloodRequest> _myRequests = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final profile = await DonorProfileService.load();
    final mine = await BloodRequestService.loadMyRequests();
    if (!mounted) return;
    setState(() {
      _profile = profile;
      _feed = BloodRequestService.seedRequests();
      _myRequests = mine;
      _loading = false;
    });
  }

  Future<void> _openRequestForm() async {
    final result = await Navigator.of(context).push<BloodRequest?>(
      MaterialPageRoute(
        builder: (_) => BloodRequestFormScreen(
          defaultBloodGroup: _profile.bloodGroup,
        ),
      ),
    );
    if (result != null && mounted) {
      final mine = await BloodRequestService.loadMyRequests();
      if (!mounted) return;
      setState(() => _myRequests = mine);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textDark),
        title: const Text(
          'Blood Bank',
          style: TextStyle(
            color: AppColors.darkGreen,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(
                color: AppColors.darkGreen,
                strokeWidth: 2.5,
              ),
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                MyStatusCard(
                  profile: _profile,
                  onChanged: (next) async {
                    setState(() => _profile = next);
                    await DonorProfileService.save(next);
                  },
                ),
                const SizedBox(height: 16),
                _SendRequestCta(onTap: _openRequestForm),
                if (_myRequests.isNotEmpty) ...[
                  const SizedBox(height: 22),
                  _SectionLabel(
                    label: 'My Requests',
                    count: _myRequests.length,
                  ),
                  const SizedBox(height: 8),
                  for (final r in _myRequests)
                    BloodRequestCard(
                      key: ValueKey('mine_${r.id}'),
                      request: r,
                      mine: true,
                      onCancel: () async {
                        await BloodRequestService.removeRequest(r.id);
                        if (!mounted) return;
                        final mine =
                            await BloodRequestService.loadMyRequests();
                        if (!mounted) return;
                        setState(() => _myRequests = mine);
                      },
                    ),
                ],
                const SizedBox(height: 22),
                _SectionLabel(
                  label: 'Active Requests Nearby',
                  count: _feed.length,
                ),
                const SizedBox(height: 8),
                for (final r in _feed)
                  BloodRequestCard(
                    key: ValueKey('feed_${r.id}'),
                    request: r,
                    onHelp: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            // TODO: wiring is fabricated — I-can-help just acknowledges.
                            'Thanks — your interest has been recorded for ${r.patientName}.',
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
    );
  }
}

class _SendRequestCta extends StatelessWidget {
  final VoidCallback onTap;
  const _SendRequestCta({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.darkGreen,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.water_drop_outlined,
                  color: AppColors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Need blood?',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.white,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Send a request to donors across campus',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.white,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward,
                  color: AppColors.white, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  final int count;
  const _SectionLabel({required this.label, required this.count});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '· $count',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.subtitleGrey,
            ),
          ),
        ],
      ),
    );
  }
}
