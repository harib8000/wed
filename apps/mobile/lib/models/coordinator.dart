// ─── Coordinator Models ───────────────────────────────────────────────────────

enum TimelineItemStatus { pending, inProgress, done, overdue }

extension TimelineItemStatusLabel on TimelineItemStatus {
  String get label {
    switch (this) {
      case TimelineItemStatus.pending:
        return 'Pending';
      case TimelineItemStatus.inProgress:
        return 'In Progress';
      case TimelineItemStatus.done:
        return 'Done';
      case TimelineItemStatus.overdue:
        return 'Overdue';
    }
  }
}

class CoordinatorEvent {
  final String id;
  final String coupleNames;
  final String venueName;
  final DateTime eventDate;
  final String status; // PLANNING | ACTIVE | COMPLETED
  final String eventType;
  final int? guestCount;
  final int? budgetPaise;

  const CoordinatorEvent({
    required this.id,
    required this.coupleNames,
    required this.venueName,
    required this.eventDate,
    required this.status,
    required this.eventType,
    this.guestCount,
    this.budgetPaise,
  });

  factory CoordinatorEvent.fromJson(Map<String, dynamic> j) {
    DateTime date;
    try {
      date = DateTime.parse(j['eventDate'] as String? ?? '');
    } catch (_) {
      date = DateTime.now();
    }
    return CoordinatorEvent(
      id: j['id'] as String,
      coupleNames: j['coupleNames'] as String? ?? j['customerName'] as String? ?? 'Couple',
      venueName: j['venueName'] as String? ?? j['venue'] as String? ?? 'TBD',
      eventDate: date,
      status: j['status'] as String? ?? 'PLANNING',
      eventType: j['eventType'] as String? ?? 'Wedding',
      guestCount: j['guestCount'] as int?,
      budgetPaise: j['budgetPaise'] as int?,
    );
  }
}

class TimelineItem {
  final String id;
  final String eventId;
  final String title;
  final String? description;
  final DateTime scheduledAt;
  final TimelineItemStatus status;
  final int order;
  final String? assignedTo;

  const TimelineItem({
    required this.id,
    required this.eventId,
    required this.title,
    this.description,
    required this.scheduledAt,
    required this.status,
    required this.order,
    this.assignedTo,
  });

  factory TimelineItem.fromJson(Map<String, dynamic> j) {
    DateTime scheduled;
    try {
      scheduled = DateTime.parse(j['scheduledAt'] as String? ?? j['time'] as String? ?? '');
    } catch (_) {
      scheduled = DateTime.now();
    }
    final statusStr = j['status'] as String? ?? 'PENDING';
    final status = switch (statusStr.toUpperCase()) {
      'IN_PROGRESS' => TimelineItemStatus.inProgress,
      'DONE' || 'COMPLETED' => TimelineItemStatus.done,
      'OVERDUE' => TimelineItemStatus.overdue,
      _ => TimelineItemStatus.pending,
    };
    return TimelineItem(
      id: j['id'] as String,
      eventId: j['eventId'] as String? ?? '',
      title: j['title'] as String,
      description: j['description'] as String?,
      scheduledAt: scheduled,
      status: status,
      order: j['order'] as int? ?? 0,
      assignedTo: j['assignedTo'] as String?,
    );
  }

  TimelineItem copyWith({TimelineItemStatus? status}) => TimelineItem(
        id: id,
        eventId: eventId,
        title: title,
        description: description,
        scheduledAt: scheduledAt,
        status: status ?? this.status,
        order: order,
        assignedTo: assignedTo,
      );
}

enum TaskStatus { todo, inProgress, done }

extension TaskStatusLabel on TaskStatus {
  String get label {
    switch (this) {
      case TaskStatus.todo:
        return 'To Do';
      case TaskStatus.inProgress:
        return 'In Progress';
      case TaskStatus.done:
        return 'Done';
    }
  }
}

class CoordinatorTask {
  final String id;
  final String eventId;
  final String title;
  final String? description;
  final TaskStatus status;
  final DateTime? dueDate;
  final String? assignedTo;
  final String? vendorId;
  final String createdAt;

  const CoordinatorTask({
    required this.id,
    required this.eventId,
    required this.title,
    this.description,
    required this.status,
    this.dueDate,
    this.assignedTo,
    this.vendorId,
    required this.createdAt,
  });

  factory CoordinatorTask.fromJson(Map<String, dynamic> j) {
    DateTime? due;
    final dueStr = j['dueDate'] as String?;
    if (dueStr != null) {
      try {
        due = DateTime.parse(dueStr);
      } catch (_) {}
    }
    final statusStr = j['status'] as String? ?? 'TODO';
    final status = switch (statusStr.toUpperCase()) {
      'IN_PROGRESS' => TaskStatus.inProgress,
      'DONE' || 'COMPLETED' => TaskStatus.done,
      _ => TaskStatus.todo,
    };
    return CoordinatorTask(
      id: j['id'] as String,
      eventId: j['eventId'] as String? ?? '',
      title: j['title'] as String,
      description: j['description'] as String?,
      status: status,
      dueDate: due,
      assignedTo: j['assignedTo'] as String?,
      vendorId: j['vendorId'] as String?,
      createdAt: j['createdAt'] as String? ?? '',
    );
  }

  CoordinatorTask copyWith({TaskStatus? status}) => CoordinatorTask(
        id: id,
        eventId: eventId,
        title: title,
        description: description,
        status: status ?? this.status,
        dueDate: dueDate,
        assignedTo: assignedTo,
        vendorId: vendorId,
        createdAt: createdAt,
      );
}

class CoordinatorStats {
  final int activeEventsToday;
  final int pendingTasks;
  final int upcomingMilestones;
  final int openChats;
  final int totalEventsManaged;
  final int completedThisMonth;

  const CoordinatorStats({
    required this.activeEventsToday,
    required this.pendingTasks,
    required this.upcomingMilestones,
    required this.openChats,
    required this.totalEventsManaged,
    required this.completedThisMonth,
  });
}
