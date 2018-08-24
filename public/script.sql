-- -----------------------------------------------------
-- Table `c9`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `c9`.`users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '',
  `nick` VARCHAR(50) NOT NULL COMMENT '',
  `pwd` VARCHAR(50) NOT NULL COMMENT '',
  `name` VARCHAR(50) NOT NULL COMMENT '',
  PRIMARY KEY (`id`)  COMMENT '',
  UNIQUE INDEX `ux_nick` (`nick` ASC)  COMMENT '')
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

-- -----------------------------------------------------
-- Table `c9`.`rooms`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `c9`.`rooms` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '',
  `user_id` INT(11) NOT NULL COMMENT '' REFERENCES users(id),
  PRIMARY KEY (`id`)  COMMENT '',
  INDEX `x_user_id` (`user_id` ASC)  COMMENT '')
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;



CREATE TABLE IF NOT EXISTS `c9`.`rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` BIGINT NOT NULL,
  `user_id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ux_room` (`key` ASC, `user_id` ASC, `partner_id` ASC),
  KEY `x_room_key` (`key`),
  KEY `x_user_id` (`user_id`),
  KEY `x_partner_id` (`partner_id`),
  FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
  FOREIGN KEY (partner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8


CREATE TABLE IF NOT EXISTS `c9`.`messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_key` BIGINT NOT NULL,
  `message` TEXT NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `x_room_key` (`room_key`),
  KEY `x_created_by` (`created_by`),
  FOREIGN KEY (`created_by`)
        REFERENCES users(`id`)
        ON DELETE CASCADE,
  FOREIGN KEY (`room_key`)
        REFERENCES rooms(`key`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8


SELECT * FROM rooms JOIN users ON rooms.partner_id = users.id WHERE user_id = 1; 

SELECT * FROM messages WHERE room_key = 2907811687;
SELECT * FROM messages WHERE room_key = 2907811687 ORDER BY created_at ASC;

INSERT INTO messages(`room_key`, `message`, `created_by`)
VALUES
(2907811687,'Hello!',2),
(2907811687,'Hi.',1);

CREATE OR REPLACE VIEW vw_room_messages
AS
SELECT
  room_key,
  CONCAT('[', GROUP_CONCAT(CONCAT('{room_key:"', room_key, '", message:"',message, '", created_by:', created_by, '}')), ']') AS room_messages
FROM
  messages
GROUP BY room_key;
  room_key;