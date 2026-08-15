import 'package:flutter/foundation.dart';

import 'package:aust_track/data/api/api_exception.dart';

/// Lifecycle state shared by every screen that loads from the API.
enum ViewState { idle, busy, error }

/// Base class for all view models.
///
/// Every screen in this app has the same three non-content states — loading,
/// error, and loaded — and the same need to run an async call without leaking
/// exceptions into the widget tree. Putting that here means a view model
/// contains only its feature's logic, and a view only ever reads `state`,
/// `errorMessage`, and the data.
///
/// View models must never import anything from `views/`. The dependency
/// direction is view → view model → repository, and keeping it one-way is what
/// makes the logic testable without a widget tree.
abstract class BaseViewModel extends ChangeNotifier {
  ViewState _state = ViewState.idle;
  String? _errorMessage;
  bool _disposed = false;

  ViewState get state => _state;
  String? get errorMessage => _errorMessage;

  bool get isBusy => _state == ViewState.busy;
  bool get hasError => _state == ViewState.error;

  /// Guards against `notifyListeners()` after the provider has been torn down,
  /// which throws if an in-flight request completes after the user navigates
  /// away — a routine occurrence, not an edge case.
  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }

  @protected
  void safeNotify() {
    if (!_disposed) notifyListeners();
  }

  @protected
  void setState(ViewState next, {String? error}) {
    _state = next;
    _errorMessage = error;
    safeNotify();
  }

  /// Run a load, mapping failure onto [ViewState.error].
  ///
  /// Use for the initial fetch, where a failure should replace the screen with
  /// a retry affordance.
  ///
  /// @param silent skip the busy state — for pull-to-refresh, where the
  ///        indicator is already showing and a flash of the spinner is worse.
  @protected
  Future<void> runLoad(Future<void> Function() action, {bool silent = false}) async {
    if (!silent) setState(ViewState.busy);
    try {
      await action();
      if (!_disposed) setState(ViewState.idle);
    } on ApiException catch (e) {
      if (!_disposed) setState(ViewState.error, error: e.message);
    } catch (_) {
      if (!_disposed) {
        setState(ViewState.error, error: 'Something went wrong. Please try again.');
      }
    }
  }

  /// Run a mutation, returning the failure message instead of replacing the
  /// screen with an error state.
  ///
  /// Writes are optimistic throughout this app: the caller has already updated
  /// the UI and needs a message to show plus a signal to roll back. Blanking
  /// the whole screen because one toggle failed would be the wrong response.
  ///
  /// @returns null on success, or a user-facing message on failure.
  @protected
  Future<String?> runAction(Future<void> Function() action) async {
    try {
      await action();
      return null;
    } on ApiException catch (e) {
      return e.message;
    } catch (_) {
      return 'Something went wrong. Please try again.';
    }
  }
}
