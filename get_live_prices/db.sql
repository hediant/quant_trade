create database if not exists stock;
use stock;

create table if not exists t_stock_pool (
	`id` int unsigned not null auto_increment,
	`code` char(16) not null,
	`name` varchar(16),
	`start_date` char(12) not null,
	`end_date` char(12) not null,
	`label` varchar(128),
	`reason` varchar(128),
	`enabled` tinyint default 0,
	`level` tinyint default 0,
	`create_time` timestamp DEFAULT current_timestamp,
	primary key (`id`)
) engine=InnoDB default charset=utf8;