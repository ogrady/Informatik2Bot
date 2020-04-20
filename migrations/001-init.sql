-- Up 
CREATE TABLE `users` (
    id INTEGER PRIMARY KEY,
    token TEXT,
    email TEXT NOT NULL,
    discord_user TEXT NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    created TEXT DEFAULT CURRENT_TIMESTAMP,
    verified TEXT,
    UNIQUE(discord_user)
);

-- Down 
DROP TABLE IF EXISTS `users`;
