150 POINTS!!!!! 🥳🥳🥳🥳
Add responsive
Add SEO

Send proper constraint message from backend
	auth.route.ts > line 86

When updating profile name, chat gets messed up
	Fix, close previous socket, and refresh front edn socket

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
	Create remove and mp buttons (friends page)
	Access other player information

2FA: Implement email based 2FA
	- 6 numbers random from base of 0-9 (hashed with bcrypt)
	- expiration 5 minutes
	- fail limit / send mail limit => attempts = 3
	- code regeneration invalidates the old one
	- purpose in db to know if it's for login, enable 2fa or disable 2fa
	- used_at in db to stop from reusing hashed code

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