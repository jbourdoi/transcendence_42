Chat Click Block User:
	User blocking is notified if user properly blocked or error
	Add row in blocks DB
	
	If a blocked user is in User Blocking blocked list, prevent message to User Blocking socket altogether
	If the Blocked user send an mp to User Blocking, send a notification that the user has blocked him/her
	
	When clicking un block user again, unblock user and send notification to one or both (?)
	
	When Loading chat room, show the blocked user as blocked in user list

	Blocking a user should also:
		Remove pending friend requests from both users
		Remove friendship from both users

Chat Click Unblock User:
	User unblocking is notified if user properly unblocked or error
	Remove row in blocks DB

Chat click add friend:
	(Done) Add friendship row in DB
	(Done) Notify user requesting that friendship is sent
	
Chat click remove friend:
	Remove friendship row in DB
	Notify user requesting that friendship is now removed

Match History:
	1 vs 1 -> dates, players, score, winner

Login:
	When login in with 42 auth and not in db -> Interface is messed up and error in terminal
	After trying to login in with 42 auth and fail and reload the page, we get a forbidden error
	When pressing login with the form and not registered, add a notification stating that the user isn't registered

Register:
	Registering doesn't set the token cookie
	First ever register (after empty db) no id is returned and no token is set
	When registering with 42 Auth after being already registered, goes back to home

Lobby:
	Player clicks on join game
		if Local:
			Goes to Alias and color select
			start game
		if remote:
			bind socket user socket to game
			Host goes to waiting list

Tournament:
	Paufiner

Remote 1v1

Friends:
	Create (current) friends page
	Create remove and mp buttons (friends page)

Friends request:
	User "A" send a friends request to "B" by clicking the add friend button
	User "B" gets a notification
	The friends list shows the request and the user can click it
	
	Logic:
		User clicks on add friends
		Goes to websocket
		Save request in DB ⚠️
		Sends confirmation to requesting user
		Sends a request to requested friend

Player Stats:
	Shows other players' match history

Chat:
	Block users, prevent from seeing messages
	Access other player information

2FA:
	Implement email based 2FA

Database:
	Frontend -> Send query to backend
	Backend  -> Forwards query to database
	Database -> Runs the query
	Database -> Return either a value or an error -> Backend
	Backend  -> Returns error or value -> Frontend
	Frontend -> Shows error message


BLOQUER ACCES USER (a faire):
- pas registered:
	+ friends
	+ others' match history
+ dans le waf
