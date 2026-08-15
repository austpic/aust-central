import 'package:flutter/material.dart';

import 'package:aust_track/theme/app_colors.dart';

/// Shared loading / error / empty states for screens backed by the API.
///
/// Every migrated screen has the same three non-content states, and they must
/// look and behave identically — an error on the blood bank should not read
/// differently from an error on notices. Extracted so there is one of each.

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});

  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: AppColors.darkGreen));
}

class ErrorView extends StatelessWidget {
  final String message;
  final Future<void> Function() onRetry;

  const ErrorView({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 48, color: AppColors.subtitleGrey),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.subtitleGrey),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => onRetry(),
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
              style: FilledButton.styleFrom(backgroundColor: AppColors.darkGreen),
            ),
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? action;
  final VoidCallback? onAction;

  const EmptyView({
    super.key,
    required this.icon,
    required this.message,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 52, color: AppColors.subtitleGrey),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.subtitleGrey),
            ),
            if (action != null && onAction != null) ...[
              const SizedBox(height: 16),
              FilledButton(
                onPressed: onAction,
                style: FilledButton.styleFrom(backgroundColor: AppColors.darkGreen),
                child: Text(action!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Renders the right state for a simple load-once screen.
///
/// Keeps the `loading ? … : error != null ? … : empty ? … : content` ladder
/// out of every build method, where it is easy to get subtly wrong.
class AsyncContent extends StatelessWidget {
  final bool loading;
  final String? error;
  final bool isEmpty;
  final Future<void> Function() onRetry;
  final Widget emptyView;
  final Widget Function() builder;

  const AsyncContent({
    super.key,
    required this.loading,
    required this.error,
    required this.isEmpty,
    required this.onRetry,
    required this.emptyView,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) return const LoadingView();
    if (error != null) return ErrorView(message: error!, onRetry: onRetry);
    if (isEmpty) return emptyView;
    return RefreshIndicator(
      onRefresh: onRetry,
      color: AppColors.darkGreen,
      child: builder(),
    );
  }
}
