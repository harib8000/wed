import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/theme.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

enum GuestRsvpStatus { confirmed, pending, declined }
enum DietaryPreference { veg, nonVeg, jain, vegan }
enum GuestFilterTab { all, confirmed, pending, declined }

class WeddingGuest {
  final String id;
  final String name;
  final String phone;
  final String relation;
  final GuestRsvpStatus status;
  final DietaryPreference dietaryPreference;
  final String tableNumber;

  const WeddingGuest({
    required this.id,
    required this.name,
    required this.phone,
    required this.relation,
    required this.status,
    required this.dietaryPreference,
    required this.tableNumber,
  });
}

class GuestNotifier extends StateNotifier<AsyncValue<List<WeddingGuest>>> {
  GuestNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      await Future<void>.delayed(const Duration(milliseconds: 650));
      state = AsyncValue.data(_mockGuests);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  void addGuest(WeddingGuest guest) {
    final current = state.value;
    if (current == null) return;
    state = AsyncValue.data([...current, guest]);
  }

  void removeGuest(String id) {
    final current = state.value;
    if (current == null) return;
    state = AsyncValue.data(current.where((guest) => guest.id != id).toList());
  }
}

class GuestManagementScreen extends StatefulWidget {
  const GuestManagementScreen({super.key});

  @override
  State<GuestManagementScreen> createState() => _GuestManagementScreenState();
}

class _GuestManagementScreenState extends State<GuestManagementScreen> {
  late final GuestNotifier _notifier;
  late final void Function(AsyncValue<List<WeddingGuest>>) _listener;
  final TextEditingController _searchController = TextEditingController();
  GuestFilterTab _selectedTab = GuestFilterTab.all;

  @override
  void initState() {
    super.initState();
    _notifier = GuestNotifier();
    _listener = (_) {
      if (mounted) {
        setState(() {});
      }
    };
    _notifier.addListener(_listener);
    _searchController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _notifier.removeListener(_listener);
    _notifier.dispose();
    _searchController.dispose();
    super.dispose();
  }

  List<WeddingGuest> _visibleGuests(List<WeddingGuest> guests) {
    final query = _searchController.text.trim().toLowerCase();
    return guests.where((guest) {
      final matchesTab = switch (_selectedTab) {
        GuestFilterTab.all => true,
        GuestFilterTab.confirmed => guest.status == GuestRsvpStatus.confirmed,
        GuestFilterTab.pending => guest.status == GuestRsvpStatus.pending,
        GuestFilterTab.declined => guest.status == GuestRsvpStatus.declined,
      };
      final matchesQuery = query.isEmpty ||
          guest.name.toLowerCase().contains(query) ||
          guest.phone.contains(query) ||
          guest.relation.toLowerCase().contains(query);
      return matchesTab && matchesQuery;
    }).toList();
  }

  Future<void> _showAddGuestSheet() async {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final tableController = TextEditingController();
    var relation = 'Bride\'s family';
    var dietary = DietaryPreference.veg;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                20,
                20,
                20,
                MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Add guest', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 16),
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Guest name'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Phone number'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: relation,
                    items: _relations
                        .map((item) => DropdownMenuItem<String>(value: item, child: Text(item)))
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      setModalState(() => relation = value);
                    },
                    decoration: const InputDecoration(labelText: 'Relation'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<DietaryPreference>(
                    value: dietary,
                    items: DietaryPreference.values
                        .map(
                          (item) => DropdownMenuItem<DietaryPreference>(
                            value: item,
                            child: Text(_dietaryLabel(item)),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      setModalState(() => dietary = value);
                    },
                    decoration: const InputDecoration(labelText: 'Dietary preference'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: tableController,
                    decoration: const InputDecoration(labelText: 'Table number'),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        await HapticFeedback.lightImpact();
                        if (nameController.text.trim().isEmpty || phoneController.text.trim().isEmpty) {
                          return;
                        }
                        _notifier.addGuest(
                          WeddingGuest(
                            id: DateTime.now().microsecondsSinceEpoch.toString(),
                            name: nameController.text.trim(),
                            phone: phoneController.text.trim(),
                            relation: relation,
                            status: GuestRsvpStatus.pending,
                            dietaryPreference: dietary,
                            tableNumber: tableController.text.trim().isEmpty
                                ? 'TBD'
                                : tableController.text.trim(),
                          ),
                        );
                        if (!context.mounted) return;
                        Navigator.pop(context);
                      },
                      child: const Text('Save Guest'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _showImportInfo() async {
    await HapticFeedback.lightImpact();
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Import guests'),
        content: const Text(
          'CSV and contact import will be available soon. For now, you can add guests manually one by one.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  Future<void> _exportGuests(List<WeddingGuest> guests) async {
    await HapticFeedback.lightImpact();
    final buffer = StringBuffer('WeddingOS Guest List\n\n');
    for (final guest in guests) {
      buffer.writeln(
        '${guest.name} • ${guest.phone} • ${guest.relation} • ${_statusLabel(guest.status)} • ${_dietaryLabel(guest.dietaryPreference)}',
      );
    }
    await Share.share(buffer.toString(), subject: 'Hyderabad Wedding Guest List');
  }

  @override
  Widget build(BuildContext context) {
    final guestsState = _notifier.state;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Guest Management'),
        actions: [
          IconButton(
            tooltip: 'Import guests',
            onPressed: _showImportInfo,
            icon: const Icon(Icons.upload_file_outlined),
          ),
          IconButton(
            tooltip: 'Export guests',
            onPressed: () {
              final guests = guestsState.value ?? const <WeddingGuest>[];
              _exportGuests(guests);
            },
            icon: const Icon(Icons.share_outlined),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddGuestSheet,
        backgroundColor: AppColors.brand,
        icon: const Icon(Icons.person_add_alt_1_outlined, color: Colors.white),
        label: const Text('Add Guest'),
      ),
      body: guestsState.when(
        loading: _GuestsLoading.new,
        error: (error, _) => ErrorStateWidget(
          message: 'Unable to load your guest list. Please try again.',
          onRetry: _notifier.load,
        ),
        data: (guests) {
          final visibleGuests = _visibleGuests(guests);
          return RefreshIndicator(
            color: AppColors.brand,
            onRefresh: _notifier.load,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
              children: [
                _GuestStatsHeader(guests: guests),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by name, phone, or relation',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isEmpty
                        ? null
                        : IconButton(
                            onPressed: () {
                              _searchController.clear();
                            },
                            icon: const Icon(Icons.close),
                          ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 42,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: GuestFilterTab.values.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final tab = GuestFilterTab.values[index];
                      final selected = _selectedTab == tab;
                      return ChoiceChip(
                        label: Text(_tabLabel(tab)),
                        selected: selected,
                        selectedColor: AppColors.brand,
                        labelStyle: TextStyle(
                          color: selected ? Colors.white : AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                        onSelected: (_) async {
                          await HapticFeedback.lightImpact();
                          setState(() => _selectedTab = tab);
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
                if (visibleGuests.isEmpty)
                  EmptyStateWidget(
                    icon: Icons.groups_outlined,
                    title: 'No guests found',
                    message: 'Start building your guest list for the Hyderabad celebration.',
                    actionLabel: 'Add Guest',
                    onAction: _showAddGuestSheet,
                  )
                else
                  ...visibleGuests.map(
                    (guest) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Dismissible(
                        key: ValueKey(guest.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          decoration: BoxDecoration(
                            color: AppColors.error,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(Icons.delete_outline, color: Colors.white),
                        ),
                        onDismissed: (_) {
                          final removedGuest = guest;
                          _notifier.removeGuest(guest.id);
                          ScaffoldMessenger.of(context)
                            ..hideCurrentSnackBar()
                            ..showSnackBar(
                              SnackBar(
                                content: Text('${removedGuest.name} removed'),
                                action: SnackBarAction(
                                  label: 'Undo',
                                  onPressed: () => _notifier.addGuest(removedGuest),
                                ),
                              ),
                            );
                        },
                        child: _GuestCard(guest: guest),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _GuestStatsHeader extends StatelessWidget {
  final List<WeddingGuest> guests;

  const _GuestStatsHeader({required this.guests});

  @override
  Widget build(BuildContext context) {
    final confirmed = guests.where((guest) => guest.status == GuestRsvpStatus.confirmed).length;
    final pending = guests.where((guest) => guest.status == GuestRsvpStatus.pending).length;
    final declined = guests.where((guest) => guest.status == GuestRsvpStatus.declined).length;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.brand, Color(0xFFF472B6)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Guest summary',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _StatPill(label: 'Total Guests', value: '${guests.length}')),
              const SizedBox(width: 8),
              Expanded(child: _StatPill(label: 'Confirmed', value: '$confirmed')),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(child: _StatPill(label: 'Pending', value: '$pending')),
              const SizedBox(width: 8),
              Expanded(child: _StatPill(label: 'Declined', value: '$declined')),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;

  const _StatPill({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.14),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
          ),
        ],
      ),
    );
  }
}

class _GuestCard extends StatelessWidget {
  final WeddingGuest guest;

  const _GuestCard({required this.guest});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: AppColors.brandLight,
                child: Text(
                  guest.name.substring(0, 1),
                  style: const TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      guest.name,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(guest.phone, style: const TextStyle(color: AppColors.textSecondary)),
                  ],
                ),
              ),
              _StatusChip(status: guest.status),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _InfoChip(label: guest.relation, icon: Icons.family_restroom_outlined),
              _InfoChip(label: _dietaryLabel(guest.dietaryPreference), icon: Icons.restaurant_outlined),
              _InfoChip(label: 'Table ${guest.tableNumber}', icon: Icons.table_restaurant_outlined),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final GuestRsvpStatus status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      GuestRsvpStatus.confirmed => AppColors.success,
      GuestRsvpStatus.pending => AppColors.gold,
      GuestRsvpStatus.declined => AppColors.error,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        _statusLabel(status),
        style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final IconData icon;

  const _InfoChip({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _GuestsLoading extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Container(
          height: 110,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      ),
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemCount: 6,
    );
  }
}

String _tabLabel(GuestFilterTab tab) => switch (tab) {
      GuestFilterTab.all => 'All',
      GuestFilterTab.confirmed => 'Confirmed',
      GuestFilterTab.pending => 'Pending',
      GuestFilterTab.declined => 'Declined',
    };

String _statusLabel(GuestRsvpStatus status) => switch (status) {
      GuestRsvpStatus.confirmed => 'Confirmed',
      GuestRsvpStatus.pending => 'Pending',
      GuestRsvpStatus.declined => 'Declined',
    };

String _dietaryLabel(DietaryPreference preference) => switch (preference) {
      DietaryPreference.veg => 'Veg',
      DietaryPreference.nonVeg => 'Non-veg',
      DietaryPreference.jain => 'Jain',
      DietaryPreference.vegan => 'Vegan',
    };

const _relations = <String>['Bride\'s family', 'Groom\'s family', 'Friends', 'VIP'];

const _mockGuests = <WeddingGuest>[
  WeddingGuest(id: 'g1', name: 'Ananya Reddy', phone: '9876543210', relation: 'Bride\'s family', status: GuestRsvpStatus.confirmed, dietaryPreference: DietaryPreference.veg, tableNumber: 'A1'),
  WeddingGuest(id: 'g2', name: 'Karthik Reddy', phone: '9123456780', relation: 'Bride\'s family', status: GuestRsvpStatus.confirmed, dietaryPreference: DietaryPreference.nonVeg, tableNumber: 'A1'),
  WeddingGuest(id: 'g3', name: 'Fatima Begum', phone: '9012345678', relation: 'Friends', status: GuestRsvpStatus.pending, dietaryPreference: DietaryPreference.veg, tableNumber: 'B3'),
  WeddingGuest(id: 'g4', name: 'Rahul Varma', phone: '9988776655', relation: 'Groom\'s family', status: GuestRsvpStatus.confirmed, dietaryPreference: DietaryPreference.nonVeg, tableNumber: 'A2'),
  WeddingGuest(id: 'g5', name: 'Sana Khan', phone: '9090909090', relation: 'Friends', status: GuestRsvpStatus.declined, dietaryPreference: DietaryPreference.vegan, tableNumber: 'TBD'),
  WeddingGuest(id: 'g6', name: 'Lakshmi Garu', phone: '9345678901', relation: 'Bride\'s family', status: GuestRsvpStatus.confirmed, dietaryPreference: DietaryPreference.jain, tableNumber: 'A3'),
  WeddingGuest(id: 'g7', name: 'Vikram Chowdary', phone: '9555555555', relation: 'VIP', status: GuestRsvpStatus.pending, dietaryPreference: DietaryPreference.nonVeg, tableNumber: 'VIP-1'),
  WeddingGuest(id: 'g8', name: 'Pooja Singhania', phone: '9000011111', relation: 'Friends', status: GuestRsvpStatus.confirmed, dietaryPreference: DietaryPreference.veg, tableNumber: 'B1'),
  WeddingGuest(id: 'g9', name: 'Mahesh Babu Garu', phone: '9888881234', relation: 'VIP', status: GuestRsvpStatus.pending, dietaryPreference: DietaryPreference.veg, tableNumber: 'VIP-2'),
  WeddingGuest(id: 'g10', name: 'Niharika Konidela', phone: '9777774444', relation: 'Friends', status: GuestRsvpStatus.confirmed, dietaryPreference: DietaryPreference.veg, tableNumber: 'B2'),
  WeddingGuest(id: 'g11', name: 'Ajay Kumar', phone: '9666662222', relation: 'Groom\'s family', status: GuestRsvpStatus.declined, dietaryPreference: DietaryPreference.nonVeg, tableNumber: 'TBD'),
  WeddingGuest(id: 'g12', name: 'Deepthi Rao', phone: '9444443333', relation: 'Bride\'s family', status: GuestRsvpStatus.pending, dietaryPreference: DietaryPreference.veg, tableNumber: 'A4'),
  WeddingGuest(id: 'g13', name: 'Pranav Iyer', phone: '9333337777', relation: 'Friends', status: GuestRsvpStatus.confirmed, dietaryPreference: DietaryPreference.jain, tableNumber: 'C1'),
  WeddingGuest(id: 'g14', name: 'Meera Nair', phone: '9222221111', relation: 'Friends', status: GuestRsvpStatus.pending, dietaryPreference: DietaryPreference.vegan, tableNumber: 'C2'),
  WeddingGuest(id: 'g15', name: 'Arjun Naidu', phone: '9111119999', relation: 'Groom\'s family', status: GuestRsvpStatus.confirmed, dietaryPreference: DietaryPreference.nonVeg, tableNumber: 'A2'),
];
