const {OAuth2Client} = require('google-auth-library');
const crypto = require('crypto');
const CLIENT_ID = '144041458139-l0epu9merdau8a862sdn6bf4cgik7duc.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

function updateUser(user, db) {
	const defaults = {
		teachers: []
	};

	let lastUser = getUser(user.userId, db);
	if (lastUser) {
		if (user.accountType != lastUser.accountType) {
			user.accountType = lastUser.accountType;
		}
		db.get('accounts').find({ userId: user.userId }).assign({...defaults, ...lastUser, ...user}).write();
	} else if (user.accountType) {
		db.get('accounts').push({...defaults, ...user}).write();
	} else if (!lastUser && !user.accountType) {
		throw new Error('cannot create new user with no account type specified');
	}
}

function getUser(userId, db) {
	return db.get('accounts').find({ userId }).value();
}

function verifyWithCookie(cookie, db) {
	return db.get('accounts').find({ cookie }).value();
}

async function verifyWithGoogle(token, accountType, db) {
	try {
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: CLIENT_ID
		});
		const payload = ticket.getPayload();
		let user = {
			userId: payload.sub,
			domain: payload.hd,
			email: payload.email,
			profilePicture: payload.picture,
			name: payload.name,
			accountType
		};
		let previousUser = getUser(user.userId, db);
		if (previousUser && previousUser.cookie) {
			user.cookie = previousUser.cookie;
		} else {
			user.cookie = crypto.randomBytes(16).toString('hex');
		}
		updateUser(user, db);
		return user;
	} catch(err) {
		console.log('verifyWithGoogle failure:', err);
		return false;
	}
}

module.exports = { verifyWithGoogle, verifyWithCookie };