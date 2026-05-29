import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/theme.dart';
import '../../shared/widgets/empty_state_widget.dart';
import '../../shared/widgets/error_state_widget.dart';

enum BudgetCategoryType {
  venue,
  photography,
  catering,
  decor,
  makeup,
  music,
  others,
}

class BudgetCategory {
  final BudgetCategoryType type;
  final String name;
  final IconData icon;
  final Color color;
  final double allocationPercent;

  const BudgetCategory({
    required this.type,
    required this.name,
    required this.icon,
    required this.color,
    required this.allocationPercent,
  });
}

class BudgetExpense {
  final String id;
  final BudgetCategoryType category;
  final int amountPaise;
  final String description;
  final DateTime date;

  const BudgetExpense({
    required this.id,
    required this.category,
    required this.amountPaise,
    required this.description,
    required this.date,
  });
}

class BudgetState {
  final int totalPaise;
  final List<BudgetCategory> categories;
  final List<BudgetExpense> expenses;

  const BudgetState({
    required this.totalPaise,
    required this.categories,
    required this.expenses,
  });

  int get totalAllocatedPaise => totalPaise;

  int spentFor(BudgetCategoryType type) {
    return expenses
        .where((expense) => expense.category == type)
        .fold<int>(0, (sum, expense) => sum + expense.amountPaise);
  }

  int allocatedFor(BudgetCategoryType type) {
    final category = categories.firstWhere((item) => item.type == type);
    return (totalPaise * category.allocationPercent).round();
  }

  int get totalSpentPaise => expenses.fold<int>(0, (sum, expense) => sum + expense.amountPaise);

  int get remainingPaise => totalPaise - totalSpentPaise;

  BudgetState copyWith({
    int? totalPaise,
    List<BudgetCategory>? categories,
    List<BudgetExpense>? expenses,
  }) {
    return BudgetState(
      totalPaise: totalPaise ?? this.totalPaise,
      categories: categories ?? this.categories,
      expenses: expenses ?? this.expenses,
    );
  }
}

class BudgetNotifier extends StateNotifier<AsyncValue<BudgetState>> {
  BudgetNotifier() : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      await Future<void>.delayed(const Duration(milliseconds: 700));
      state = AsyncValue.data(_mockBudgetState);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  void updateBudget(int totalPaise) {
    final current = state.value;
    if (current == null) return;
    state = AsyncValue.data(current.copyWith(totalPaise: totalPaise));
  }

  void addExpense(BudgetExpense expense) {
    final current = state.value;
    if (current == null) return;
    state = AsyncValue.data(
      current.copyWith(expenses: [...current.expenses, expense]..sort((a, b) => b.date.compareTo(a.date))),
    );
  }
}

class BudgetPlannerScreen extends StatefulWidget {
  const BudgetPlannerScreen({super.key});

  @override
  State<BudgetPlannerScreen> createState() => _BudgetPlannerScreenState();
}

class _BudgetPlannerScreenState extends State<BudgetPlannerScreen> {
  late final BudgetNotifier _notifier;
  late final void Function(AsyncValue<BudgetState>) _listener;

  @override
  void initState() {
    super.initState();
    _notifier = BudgetNotifier();
    _listener = (_) {
      if (mounted) {
        setState(() {});
      }
    };
    _notifier.addListener(_listener);
  }

  @override
  void dispose() {
    _notifier.removeListener(_listener);
    _notifier.dispose();
    super.dispose();
  }

  Future<void> _showEditBudgetSheet(BudgetState budget) async {
    final controller = TextEditingController(
      text: (budget.totalPaise / 10000000).round().toString(),
    );

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
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
              Text('Edit total budget', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              const Text(
                'Enter your total wedding budget in lakhs.',
                style: TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  prefixText: '₹ ',
                  suffixText: ' Lakhs',
                  hintText: '25',
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await HapticFeedback.lightImpact();
                    final lakhs = int.tryParse(controller.text.trim());
                    if (lakhs == null || lakhs <= 0) return;
                    _notifier.updateBudget(lakhs * 10000000);
                    if (!context.mounted) return;
                    Navigator.pop(context);
                  },
                  child: const Text('Update Budget'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showAddExpenseSheet(BudgetState budget) async {
    final amountController = TextEditingController();
    final descriptionController = TextEditingController();
    var selectedCategory = BudgetCategoryType.venue;
    var selectedDate = DateTime.now();

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
                  Text('Add expense', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<BudgetCategoryType>(
                    value: selectedCategory,
                    items: budget.categories
                        .map(
                          (item) => DropdownMenuItem<BudgetCategoryType>(
                            value: item.type,
                            child: Text(item.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      setModalState(() => selectedCategory = value);
                    },
                    decoration: const InputDecoration(labelText: 'Category'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Amount',
                      prefixText: '₹ ',
                      hintText: '75000',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      hintText: 'Advance for florist in Banjara Hills',
                    ),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () async {
                      final pickedDate = await showDatePicker(
                        context: context,
                        firstDate: DateTime(2024),
                        lastDate: DateTime(2027),
                        initialDate: selectedDate,
                      );
                      if (pickedDate == null) return;
                      setModalState(() => selectedDate = pickedDate);
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Date'),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(_dateFormat.format(selectedDate)),
                          const Icon(Icons.calendar_today_outlined, size: 18),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        await HapticFeedback.lightImpact();
                        final amountRupees = int.tryParse(amountController.text.trim());
                        if (amountRupees == null || amountRupees <= 0) return;
                        if (descriptionController.text.trim().isEmpty) return;
                        _notifier.addExpense(
                          BudgetExpense(
                            id: DateTime.now().microsecondsSinceEpoch.toString(),
                            category: selectedCategory,
                            amountPaise: amountRupees * 100,
                            description: descriptionController.text.trim(),
                            date: selectedDate,
                          ),
                        );
                        if (!context.mounted) return;
                        Navigator.pop(context);
                      },
                      child: const Text('Save Expense'),
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

  Future<void> _showCategoryExpenses(BudgetState budget, BudgetCategory category) async {
    final expenses = budget.expenses.where((expense) => expense.category == category.type).toList();

    await HapticFeedback.lightImpact();
    if (!mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('${category.name} expenses', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text(
                  '${expenses.length} recorded expenses',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),
                if (expenses.isEmpty)
                  const EmptyStateWidget(
                    icon: Icons.receipt_long_outlined,
                    title: 'No expenses yet',
                    message: 'Add your first expense to start tracking this category.',
                  )
                else
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: expenses.length,
                      separatorBuilder: (_, __) => const Divider(height: 16),
                      itemBuilder: (context, index) {
                        final expense = expenses[index];
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            backgroundColor: category.color.withOpacity(0.12),
                            child: Icon(category.icon, color: category.color),
                          ),
                          title: Text(expense.description),
                          subtitle: Text(_dateFormat.format(expense.date)),
                          trailing: Text(
                            _currency(expense.amountPaise),
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final budgetState = _notifier.state;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Budget Planner')),
      floatingActionButton: budgetState.value == null
          ? null
          : FloatingActionButton.extended(
              backgroundColor: AppColors.brand,
              onPressed: () => _showAddExpenseSheet(budgetState.value!),
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text('Add Expense'),
            ),
      body: budgetState.when(
        loading: _BudgetLoading.new,
        error: (error, _) => ErrorStateWidget(
          message: 'Unable to load budget planner. Please try again.',
          onRetry: _notifier.load,
        ),
        data: (budget) {
          if (budget.categories.isEmpty) {
            return EmptyStateWidget(
              icon: Icons.account_balance_wallet_outlined,
              title: 'No budget categories',
              message: 'Set up your wedding budget to start tracking payments.',
              actionLabel: 'Reload',
              onAction: _notifier.load,
            );
          }

          return RefreshIndicator(
            color: AppColors.brand,
            onRefresh: _notifier.load,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
              children: [
                _BudgetHeader(
                  budget: budget,
                  onEdit: () => _showEditBudgetSheet(budget),
                ),
                const SizedBox(height: 16),
                ...budget.categories.map(
                  (category) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _BudgetCategoryCard(
                      category: category,
                      allocatedPaise: budget.allocatedFor(category.type),
                      spentPaise: budget.spentFor(category.type),
                      onTap: () => _showCategoryExpenses(budget, category),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _BudgetSummaryCard(budget: budget),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BudgetHeader extends StatelessWidget {
  final BudgetState budget;
  final VoidCallback onEdit;

  const _BudgetHeader({required this.budget, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    final progress = budget.totalPaise == 0 ? 0.0 : budget.totalSpentPaise / budget.totalPaise;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.brand, Color(0xFFEC4899)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total budget',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white.withOpacity(0.9),
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _currency(budget.totalPaise),
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress.clamp(0, 1),
              minHeight: 10,
              backgroundColor: Colors.white.withOpacity(0.18),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Spent ${_currency(budget.totalSpentPaise)}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              ),
              Text(
                'Remaining ${_currency(budget.remainingPaise)}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BudgetCategoryCard extends StatelessWidget {
  final BudgetCategory category;
  final int allocatedPaise;
  final int spentPaise;
  final VoidCallback onTap;

  const _BudgetCategoryCard({
    required this.category,
    required this.allocatedPaise,
    required this.spentPaise,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final progress = allocatedPaise == 0 ? 0.0 : spentPaise / allocatedPaise;
    final remaining = allocatedPaise - spentPaise;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: category.color.withOpacity(0.12),
                    child: Icon(category.icon, color: category.color),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          category.name,
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${(category.allocationPercent * 100).round()}% allocation',
                          style: const TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
                ],
              ),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: progress.clamp(0, 1),
                  minHeight: 10,
                  backgroundColor: AppColors.border,
                  valueColor: AlwaysStoppedAnimation<Color>(category.color),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _AmountStat(label: 'Allocated', value: _currency(allocatedPaise)),
                  ),
                  Expanded(
                    child: _AmountStat(label: 'Spent', value: _currency(spentPaise)),
                  ),
                  Expanded(
                    child: _AmountStat(
                      label: 'Remaining',
                      value: _currency(remaining),
                      valueColor: remaining >= 0 ? AppColors.success : AppColors.error,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AmountStat extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _AmountStat({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _BudgetSummaryCard extends StatelessWidget {
  final BudgetState budget;

  const _BudgetSummaryCard({required this.budget});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Summary', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18)),
          const SizedBox(height: 16),
          _SummaryRow(label: 'Total Allocated', value: _currency(budget.totalAllocatedPaise)),
          const SizedBox(height: 12),
          _SummaryRow(label: 'Total Spent', value: _currency(budget.totalSpentPaise)),
          const SizedBox(height: 12),
          _SummaryRow(
            label: 'Remaining Budget',
            value: _currency(budget.remainingPaise),
            valueColor: budget.remainingPaise >= 0 ? AppColors.success : AppColors.error,
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _SummaryRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary)),
        Text(
          value,
          style: TextStyle(fontWeight: FontWeight.w700, color: valueColor ?? AppColors.textPrimary),
        ),
      ],
    );
  }
}

class _BudgetLoading extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemBuilder: (_, index) => Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Container(
          height: index == 0 ? 180 : 140,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ),
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemCount: 5,
    );
  }
}

final _currencyFormatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
final _dateFormat = DateFormat('dd MMM yyyy');

String _currency(int paise) => _currencyFormatter.format(paise / 100);

final _mockBudgetState = BudgetState(
  totalPaise: 250000000,
  categories: [
    BudgetCategory(type: BudgetCategoryType.venue, name: 'Venue', icon: Icons.location_city_outlined, color: Color(0xFF7C3AED), allocationPercent: 0.40),
    BudgetCategory(type: BudgetCategoryType.photography, name: 'Photography', icon: Icons.camera_alt_outlined, color: Color(0xFF2563EB), allocationPercent: 0.15),
    BudgetCategory(type: BudgetCategoryType.catering, name: 'Catering', icon: Icons.restaurant_menu_outlined, color: Color(0xFFEA580C), allocationPercent: 0.20),
    BudgetCategory(type: BudgetCategoryType.decor, name: 'Decor', icon: Icons.local_florist_outlined, color: Color(0xFFDB2777), allocationPercent: 0.10),
    BudgetCategory(type: BudgetCategoryType.makeup, name: 'Makeup', icon: Icons.face_retouching_natural_outlined, color: Color(0xFFEC4899), allocationPercent: 0.05),
    BudgetCategory(type: BudgetCategoryType.music, name: 'Music', icon: Icons.music_note_outlined, color: Color(0xFF059669), allocationPercent: 0.05),
    BudgetCategory(type: BudgetCategoryType.others, name: 'Others', icon: Icons.more_horiz_rounded, color: Color(0xFF6B7280), allocationPercent: 0.05),
  ],
  expenses: [
    BudgetExpense(id: 'b1', category: BudgetCategoryType.venue, amountPaise: 30000000, description: 'Advance paid to Royal Grand Palace, Kompally', date: DateTime(2025, 1, 12)),
    BudgetExpense(id: 'b2', category: BudgetCategoryType.photography, amountPaise: 8500000, description: 'Booking amount for Srikanth Photography', date: DateTime(2025, 1, 25)),
    BudgetExpense(id: 'b3', category: BudgetCategoryType.catering, amountPaise: 12000000, description: 'Menu tasting and token for Flavours Catering', date: DateTime(2025, 2, 5)),
    BudgetExpense(id: 'b4', category: BudgetCategoryType.decor, amountPaise: 4500000, description: 'Haldi and reception floral design booking', date: DateTime(2025, 2, 18)),
    BudgetExpense(id: 'b5', category: BudgetCategoryType.makeup, amountPaise: 1500000, description: 'Bridal trial and advance for Glow Bridal Studio', date: DateTime(2025, 2, 22)),
    BudgetExpense(id: 'b6', category: BudgetCategoryType.music, amountPaise: 1000000, description: 'Sangeet DJ booking amount', date: DateTime(2025, 2, 28)),
    BudgetExpense(id: 'b7', category: BudgetCategoryType.others, amountPaise: 2200000, description: 'Wedding invitation printing in Charminar market', date: DateTime(2025, 3, 2)),
  ],
);
