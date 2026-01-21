150 POINTS!!!!! 🥳🥳🥳🥳
Add responsive
Add SEO
menu button Profile : error console when press left or right navigation
Chat Click Block User:
	User blocking is notified if user properly blocked or error
	
	If the Blocked user send an mp to User Blocking, send a notification that the user has blocked him/her

	When Loading chat room, show the blocked user as blocked in user list

Chat Click Unblock User:
	User unblocking is notified if user properly unblocked or error

Chat click remove friend:
	Notify user requesting that friendship is now removed

Login:
	When login in with 42 auth and not in db -> Interface is messed up (shows user form and block to log in 42oauth at the same time)
	When pressing login with the form or 42oauth and not registered, add a notification stating that the user isn't registered

Lobby:
	Player clicks on join game
		if remote:
			bind socket user socket to game
			Host goes to waiting list

Remote 1v1

Friends:
	Create (current) friends page
	Create remove and mp buttons (friends page)
	Access other player information

2FA: Implement email based 2FA
	- 5 numbers random from base of 0-9
	- expiration 5 minutes
	- fail limit / send mail limit => 3
	- code regeneration invalidates the old one

	logic (=> ON CHANGE pas ON SUBMIT):
		click on checkbox to enabled 2fa (user on website)
		email envoyé au mail du user
		validation de l'user sur son mail (lien, numbers) + expiration 2 minutes
		voir logic pour accepter la validation
		mettre 2fa dans db table users a true (has_2fa)
	logic si disable 2fa (=> ON CHANGE pas ON SUBMIT):
		click on checkbox to disable 2fa (user on website)
		email envoyé au mail du user
		validation de l'user sur son mail (lien, numbers) + expiration 2 minutes
		voir logic pour accepter la validation
		mettre 2fa dans db table users a false (has_2fa)
	logic au login si 2fa enabled:
		username + password OU 42OAuth
		validation with 2fa
	
	Table:
	PRIMARY KEY id
	FOREIGN KEY user_id
	TEXT NOT NULL code_hash => hash du code a envoyer par mail (eg: '482671') -> avec bcrypt
	STRING? NOT NULL purpose === 'login' | 'enable_2fa' | 'disable_2fa' => empecher un login en parallele d'un disable_2fa avec le meme code
	TIMESTAMP NOT NULL expires_at
	TIMESTAMP NULL used_at => empeche reutilisation du code
	INT attemptes DEFAULT 0 => max 3 avant invalidation

	- user sends incorrect code BEFORE EXPIRATION -> same code but attempts+1
	- user sends incorrect code AFTER EXPIRATION -> already expired, so either new code or no more attemps
	- user sends correct code BEFORE EXPIRATION
	- user sends correct code AFTER EXPIRATION
	- user sends nothing UNTIL EXPIRATION -> code expires
	- user wants a new code BEFORE EXPIRATION -> invalidate the old one

BLOQUER ACCES USER (a faire):
- pas registered:
	+ friends
	+ others' match history
+ dans le waf

login -> make -> refresh -> username not shown in home -> move to another page -> come back to home -> user shown

close socket when same user is chatting (double private window same user connected)