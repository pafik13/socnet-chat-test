-- MySQL dump 10.13  Distrib 5.5.57, for debian-linux-gnu (x86_64)
--
-- Host: 0.0.0.0    Database: c9
-- ------------------------------------------------------
-- Server version	5.5.57-0ubuntu0.14.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tbl_messages`
--

DROP TABLE IF EXISTS `tbl_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_key` bigint(20) NOT NULL,
  `message` text NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `x_room_key` (`room_key`),
  KEY `x_created_by` (`created_by`),
  CONSTRAINT `tbl_messages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_messages_ibfk_2` FOREIGN KEY (`room_key`) REFERENCES `tbl_rooms` (`key`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_rooms`
--

DROP TABLE IF EXISTS `tbl_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_room` (`key`,`user_id`,`partner_id`),
  KEY `x_room_key` (`key`),
  KEY `x_user_id` (`user_id`),
  KEY `x_partner_id` (`partner_id`),
  CONSTRAINT `tbl_rooms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tbl_rooms_ibfk_2` FOREIGN KEY (`partner_id`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tbl_users`
--

DROP TABLE IF EXISTS `tbl_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbl_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nick` varchar(50) NOT NULL,
  `pwd` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icon` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_nick` (`nick`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary table structure for view `vw_contacts_with_last_message`
--

DROP TABLE IF EXISTS `vw_contacts_with_last_message`;
/*!50001 DROP VIEW IF EXISTS `vw_contacts_with_last_message`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE TABLE `vw_contacts_with_last_message` (
  `room_id` tinyint NOT NULL,
  `room_key` tinyint NOT NULL,
  `user_id` tinyint NOT NULL,
  `id` tinyint NOT NULL,
  `name` tinyint NOT NULL,
  `nick` tinyint NOT NULL,
  `icon` tinyint NOT NULL,
  `room_last_message` tinyint NOT NULL,
  `created_by` tinyint NOT NULL,
  `created_at` tinyint NOT NULL
) ENGINE=MyISAM */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `vw_room_last_message`
--

DROP TABLE IF EXISTS `vw_room_last_message`;
/*!50001 DROP VIEW IF EXISTS `vw_room_last_message`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE TABLE `vw_room_last_message` (
  `id` tinyint NOT NULL,
  `room_key` tinyint NOT NULL,
  `message` tinyint NOT NULL,
  `created_by` tinyint NOT NULL,
  `created_at` tinyint NOT NULL
) ENGINE=MyISAM */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `vw_room_messages`
--

DROP TABLE IF EXISTS `vw_room_messages`;
/*!50001 DROP VIEW IF EXISTS `vw_room_messages`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE TABLE `vw_room_messages` (
  `room_key` tinyint NOT NULL,
  `room_messages` tinyint NOT NULL
) ENGINE=MyISAM */;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vw_contacts_with_last_message`
--

/*!50001 DROP TABLE IF EXISTS `vw_contacts_with_last_message`*/;
/*!50001 DROP VIEW IF EXISTS `vw_contacts_with_last_message`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`pafik13`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_contacts_with_last_message` AS select `R`.`id` AS `room_id`,`R`.`key` AS `room_key`,`R`.`user_id` AS `user_id`,`R`.`partner_id` AS `id`,`U`.`name` AS `name`,`U`.`nick` AS `nick`,`U`.`icon` AS `icon`,`RLM`.`message` AS `room_last_message`,`RLM`.`created_by` AS `created_by`,`RLM`.`created_at` AS `created_at` from ((`rooms` `R` join `users` `U` on((`R`.`partner_id` = `U`.`id`))) left join `vw_room_last_message` `RLM` on((`RLM`.`room_key` = `R`.`key`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_room_last_message`
--

/*!50001 DROP TABLE IF EXISTS `vw_room_last_message`*/;
/*!50001 DROP VIEW IF EXISTS `vw_room_last_message`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`pafik13`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_room_last_message` AS select `messages`.`id` AS `id`,`messages`.`room_key` AS `room_key`,`messages`.`message` AS `message`,`messages`.`created_by` AS `created_by`,`messages`.`created_at` AS `created_at` from `messages` where `messages`.`id` in (select max(`messages`.`id`) from `messages` group by `messages`.`room_key`) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_room_messages`
--

/*!50001 DROP TABLE IF EXISTS `vw_room_messages`*/;
/*!50001 DROP VIEW IF EXISTS `vw_room_messages`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`pafik13`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_room_messages` AS select `messages`.`room_key` AS `room_key`,concat('[',group_concat(concat('{room_key:"',`messages`.`room_key`,'", message:"',`messages`.`message`,'", created_by:',`messages`.`created_by`,'}') separator ','),']') AS `room_messages` from `messages` group by `messages`.`room_key` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-08-28 19:14:52
