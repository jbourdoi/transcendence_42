Match History:
	1 vs 1 -> dates, players, score, winner

Login:
	When login in with 42 auth and not in db -> Interface is messed up and error in terminal
	After trying to login in with 42 auth and fail and reload the page, we get a forbidden error

Register:
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

Vault:
	.env.tpl -> copie-colle-modif .env -> script pour bouger les secrets importants dans vault -> conteneurs qui call vault directement

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
+ fonction: redirectIfNotAuthenticated()
