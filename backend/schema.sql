-- Full schema for a fresh database. Existing databases use migrations/ instead.

CREATE TABLE `account_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `account_id` int NOT NULL,
  `balance` decimal(20,2) NOT NULL,
  `as_of` date NOT NULL,
  `source` enum('manual','statement') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `recorded_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_balance_day` (`account_id`,`as_of`),
  KEY `idx_balances_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `account_income` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `account_id` int NOT NULL,
  `amount` decimal(20,2) NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `received_on` date NOT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_income_user` (`user_id`,`received_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `account_transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `from_account_id` int NOT NULL,
  `to_account_id` int NOT NULL,
  `amount` decimal(20,2) NOT NULL,
  `moved_on` date NOT NULL,
  `receipt_no` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_transfer_receipt` (`user_id`,`receipt_no`),
  KEY `idx_transfers_user` (`user_id`,`moved_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('mpesa','bank','cash','savings','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `spendable` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('active','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_accounts_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bill_aliases` (
  `recurring_id` int NOT NULL,
  `user_id` int NOT NULL,
  `alias` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`recurring_id`,`alias`),
  KEY `idx_bill_aliases_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `budget` (
  `budget_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subcategories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `amount` decimal(20,2) NOT NULL,
  `has_time_limit` tinyint(1) DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notified_exceeded` tinyint(1) DEFAULT '0',
  `notify_email` tinyint(1) DEFAULT '0',
  `email_checked` enum('checked','unchecked') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `update_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('active','exceeded','expired','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `user_id` int DEFAULT NULL,
  `period` enum('monthly','weekly','once') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `rollover` tinyint(1) NOT NULL DEFAULT '0',
  `alert_mode` enum('important','balanced','everything','off') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warn_at` tinyint DEFAULT NULL,
  PRIMARY KEY (`budget_id`),
  KEY `fk_budget` (`user_id`),
  FULLTEXT KEY `budget_fulltext` (`category`,`name`),
  CONSTRAINT `budget_chk_1` CHECK (json_valid(`subcategories`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `budget_alerts` (
  `budget_id` int NOT NULL,
  `user_id` int NOT NULL,
  `period_key` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pending_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`budget_id`,`period_key`,`kind`),
  KEY `idx_alerts_user` (`user_id`),
  KEY `idx_alerts_pending` (`pending_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `budget_changes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `budget_id` int NOT NULL,
  `old_amount` decimal(20,2) NOT NULL,
  `new_amount` decimal(20,2) NOT NULL,
  `scope` enum('month','forward','move') COLLATE utf8mb4_unicode_ci NOT NULL,
  `month` char(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_changes_budget` (`budget_id`,`created_at`),
  KEY `idx_changes_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `budget_limits` (
  `budget_id` int NOT NULL,
  `user_id` int NOT NULL,
  `from_month` char(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `only_month` tinyint(1) NOT NULL DEFAULT '0',
  `amount` decimal(20,2) NOT NULL,
  PRIMARY KEY (`budget_id`,`from_month`,`only_month`),
  KEY `idx_limits_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dismissed_bills` (
  `user_id` int NOT NULL,
  `bill_key` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`bill_key`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expense` (
  `expense_id` int NOT NULL AUTO_INCREMENT,
  `amount` decimal(20,2) NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subcategories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `budgeted` tinyint(1) DEFAULT '0',
  `date_created` date NOT NULL,
  `month` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `budget_id` int DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `merchant` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_no` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `needs_review` tinyint(1) NOT NULL DEFAULT '0',
  `recurring_id` int DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`expense_id`),
  UNIQUE KEY `uniq_expense_receipt` (`user_id`,`receipt_no`),
  KEY `fk_expense` (`user_id`),
  KEY `fk_expense_budget` (`budget_id`),
  KEY `idx_expense_recurring` (`recurring_id`),
  KEY `idx_expense_account` (`account_id`),
  FULLTEXT KEY `expense_fulltext` (`category`),
  CONSTRAINT `expense_chk_1` CHECK (json_valid(`subcategories`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expense_shortcuts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `merchant` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_shortcut` (`user_id`,`merchant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `goal_moves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `goal_id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount` decimal(20,2) NOT NULL,
  `moved_on` date NOT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_goal_moves_goal` (`goal_id`),
  KEY `idx_goal_moves_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `merchant_categories` (
  `user_id` int NOT NULL,
  `merchant` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`merchant`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `mpesa_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `receipt_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `occurred_at` datetime NOT NULL,
  `details` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `counterparty` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_in` decimal(20,2) NOT NULL DEFAULT '0.00',
  `withdrawn` decimal(20,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(20,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `transfer_status` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_mpesa_row` (`user_id`,`receipt_no`,`kind`),
  KEY `idx_mpesa_user_time` (`user_id`,`occurred_at`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('budget_exceeded','system','info','bill','goal') COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('unread','read','resolved') COLLATE utf8mb4_unicode_ci DEFAULT 'unread',
  `budget_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notifications_user` (`user_id`),
  KEY `fk_notifications_budget` (`budget_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recurring_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` enum('bill','subscription') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bill',
  `category` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(20,2) NOT NULL,
  `varies` tinyint(1) NOT NULL DEFAULT '0',
  `frequency` enum('weekly','monthly','termly','yearly') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `next_due` date NOT NULL,
  `due_day` tinyint NOT NULL,
  `status` enum('active','stopped') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `stop_reason` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stop_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stopped_at` date DEFAULT NULL,
  `last_paid` date DEFAULT NULL,
  `reminded_for` date DEFAULT NULL,
  `missed_for` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `account_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_recurring_name` (`user_id`,`name`),
  KEY `idx_recurring_due` (`status`,`next_due`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recurring_price_changes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `recurring_id` int NOT NULL,
  `old_amount` decimal(20,2) NOT NULL,
  `new_amount` decimal(20,2) NOT NULL,
  `changed_on` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_price_recurring` (`recurring_id`,`changed_on`),
  KEY `idx_price_user` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `savings_goals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target` decimal(20,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `start_amount` decimal(20,2) NOT NULL DEFAULT '0.00',
  `started_on` date NOT NULL,
  `status` enum('active','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `behind_noted_on` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goals_user` (`user_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subcategory_suggestions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subcategory` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_category_subcategory` (`user_id`,`category`,`subcategory`),
  KEY `idx_subcategory_suggestions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `status` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `occupation` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` int NOT NULL,
  `goal` text COLLATE utf8mb4_unicode_ci,
  `reset_password_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `bill_reminders` tinyint(1) NOT NULL DEFAULT '1',
  `pay_type` enum('salary','irregular') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'irregular',
  `pay_day` tinyint DEFAULT NULL,
  `safety_buffer` decimal(20,2) NOT NULL DEFAULT '2000.00',
  `budget_alert_mode` enum('important','balanced','everything','off') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'balanced',
  `budget_warn_at` tinyint NOT NULL DEFAULT '80',
  `budget_emails` tinyint(1) NOT NULL DEFAULT '1',
  `setup_status` enum('new','done','existing') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `setup_step` tinyint NOT NULL DEFAULT '0',
  `setup_hidden` tinyint(1) NOT NULL DEFAULT '0',
  `pay_set` tinyint(1) NOT NULL DEFAULT '0',
  `tips_seen` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `pin_hash` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pin_set_at` bigint DEFAULT NULL,
  `pin_failures` tinyint NOT NULL DEFAULT '0',
  `pin_locked_until` bigint DEFAULT NULL,
  `login_failures` tinyint NOT NULL DEFAULT '0',
  `login_locked_until` bigint DEFAULT NULL,
  `password_changed_at` bigint DEFAULT NULL,
  `policy_accepted_at` bigint DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

