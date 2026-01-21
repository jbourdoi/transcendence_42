menu button Profile : error console when press left or right navigation
Chat Click Block User:
	User blocking is notified if user properly blocked or error
	
	If the Blocked user send an mp to User Blocking, send a notification that the user has blocked him/her

	When Loading chat room, show the blocked user as blocked in user list

Chat Click Unblock User:
	User unblocking is notified if user properly unblocked or error

Chat click remove friend:
	Remove friendship row in DB
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

2FA:
	Implement email based 2FA

BLOQUER ACCES USER (a faire):
- pas registered:
	+ friends
	+ others' match history
+ dans le waf