import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Watches network connectivity and exposes it as a simple bool.
final connectivityProvider = StateNotifierProvider<ConnectivityNotifier, bool>(
  (ref) => ConnectivityNotifier(),
);

class ConnectivityNotifier extends StateNotifier<bool> {
  late final StreamSubscription<List<ConnectivityResult>> _sub;

  ConnectivityNotifier() : super(true) {
    _sub = Connectivity().onConnectivityChanged.listen((results) {
      state = results.any((r) => r != ConnectivityResult.none);
    });
    // Check current state immediately
    Connectivity().checkConnectivity().then((results) {
      state = results.any((r) => r != ConnectivityResult.none);
    });
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
