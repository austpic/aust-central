import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/models/blood_request.dart';
import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/viewmodels/blood_bank_view_model.dart';
import 'package:aust_track/views/widgets/async_views.dart';
import 'package:aust_track/views/widgets/blood_request_card.dart';
import 'package:aust_track/views/widgets/my_status_card.dart';
import 'package:aust_track/views/blood/blood_request_form_screen.dart';

/// Blood Bank. Passive view over [BloodBankViewModel].
///
/// Four stacked sections: donor status, a send-request CTA, your own requests,
/// and the community feed. The feed is genuinely community-wide — a request
/// posted by another student appears here, which is the whole point of the
/// feature and was impossible when requests lived in device-local storage.
class BloodBankScreen extends StatelessWidget {
  const BloodBankScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BloodBankViewModel(context.read<CommunityRepository>()),
      child: const _BloodBankView(),
    );
  }
}

class _BloodBankView extends StatelessWidget {
  const _BloodBankView();

  void _report(ScaffoldMessengerState messenger, String? failure) {
    if (failure == null) return;
    messenger.showSnackBar(
      SnackBar(content: Text(failure), behavior: SnackBarBehavior.floating),
    );
  }

  Future<void> _openRequestForm(BuildContext context) async {
    final viewModel = context.read<BloodBankViewModel>();
    final created = await Navigator.of(context).push<BloodRequest?>(
      MaterialPageRoute(
        builder: (_) => BloodRequestFormScreen(
          defaultBloodGroup: viewModel.profile.bloodGroup,
        ),
      ),
    );
    if (created != null) await viewModel.load(silent: true);
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<BloodBankViewModel>();
    final messenger = ScaffoldMessenger.of(context);

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
      body: viewModel.isBusy
          ? const LoadingView()
          : viewModel.hasError
              ? ErrorView(
                  message: viewModel.errorMessage!,
                  onRetry: () => viewModel.load(silent: true),
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  children: [
                    MyStatusCard(
                      profile: viewModel.profile,
                      onChanged: (next) async =>
                          _report(messenger, await viewModel.saveProfile(next)),
                    ),
                    const SizedBox(height: 16),
                    _SendRequestCta(onTap: () => _openRequestForm(context)),
                    if (viewModel.myRequests.isNotEmpty) ...[
                      const SizedBox(height: 22),
                      _SectionLabel(
                        label: 'My Requests',
                        count: viewModel.myRequests.length,
                      ),
                      const SizedBox(height: 8),
                      for (final r in viewModel.myRequests)
                        BloodRequestCard(
                          key: ValueKey('mine_${r.id}'),
                          request: r,
                          mine: true,
                          onCancel: () async =>
                              _report(messenger, await viewModel.cancelRequest(r)),
                        ),
                    ],
                    const SizedBox(height: 22),
                    _SectionLabel(
                      label: 'Active Requests Nearby',
                      count: viewModel.feed.length,
                    ),
                    const SizedBox(height: 8),
                    for (final r in viewModel.feed)
                      BloodRequestCard(
                        key: ValueKey('feed_${r.id}'),
                        request: r,
                        // TODO: "I can help" only acknowledges — there is no
                        // responder endpoint yet, so nothing is recorded.
                        onHelp: () => messenger.showSnackBar(
                          SnackBar(
                            content: Text(
                              'Contact ${r.patientName}\'s requester on ${r.contactNumber}.',
                            ),
                          ),
                        ),
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
